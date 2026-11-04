import { describe, expect, it } from "vitest";
import type { MetadataEditorImage } from "../../../types/image";
import {
  filterMetadataRecords,
  getMetadataCounts,
  getMetadataRecords,
  getOrientationTarget,
  resetOrientation,
  toggleMirror,
} from "./metadataUtils";
import {
  createSliceFileNames,
  serializeSliceMetadata,
} from "../../../lib/imageOperations/serializeSliceMetadata";
import { embedSliceMetadata } from "../../../lib/imageOperations/exportImageSlicesAsZip";
import { readMetadata } from "aeo-image";
import piexif from "piexifjs";
import { getOrientedDimensions } from "../../../lib/imageOrientation";
import { normalizeImageMetadata } from "../../../lib/imageMetadata";
import i18n from "../../../lib/i18n/i18n";

function createImage(metadatas: MetadataEditorImage["metadatas"]): MetadataEditorImage {
  const blobs = new Map([...metadatas.keys()].map((id) => [id, new Blob()]));
  return {
    imageId: "scan-1",
    images: blobs,
    blobUrls: new Map([...metadatas.keys()].map((id) => [id, `blob:${id}`])),
    metadatas,
  };
}

describe("metadata record utilities", () => {
  it("uses locale-specific plural forms for progress labels", async () => {
    await i18n.loadLanguages(["pl"]);
    expect(i18n.t("image.metadata.totalCount", {
      lng: "en",
      count: 2,
      formatted: "2",
    })).toBe("All 2 crop records");
    expect(i18n.t("image.metadata.totalCount", {
      lng: "pl",
      count: 2,
      formatted: "2",
    })).toBe("Wszystkie 2 rekordy");
  });

  it("counts completion by trimmed required title and filters without mutating records", () => {
    const images = [
      createImage(
        new Map([
          ["a", { title: "  ", description: "", rotation: 0 }],
          ["b", { title: "Portrait", description: "", rotation: 0 }],
        ]),
      ),
    ];
    const records = getMetadataRecords(images);

    expect(getMetadataCounts(images)).toEqual({
      total: 2,
      complete: 1,
      incomplete: 1,
    });
    expect(filterMetadataRecords(records, "incomplete").map((item) => item.regionId)).toEqual(["a"]);
    expect(filterMetadataRecords(records, "complete").map((item) => item.regionId)).toEqual(["b"]);
    expect(getMetadataRecords(images)).toHaveLength(2);
  });

  it("preserves date and tags in the export sidecar for older and newer records", () => {
    const json = serializeSliceMetadata(
      new Map([
        [
          "scan-1",
          new Map([
            ["old", { title: "Old", description: "", rotation: 0 }],
            [
              "new",
              {
                title: "New",
                description: "Back text",
                rotation: 90,
                mirrorHorizontal: true,
                datePrecision: "decade",
                dateValue: "1950",
                dateValues: { decade: "1950" },
                people: ["Ada"],
                locations: ["Gdansk"],
                topics: ["Family"],
              },
            ],
          ]),
        ],
      ]),
    );
    const records = JSON.parse(json) as Array<Record<string, unknown>>;

    expect(records[0]).toMatchObject({
      mirrorHorizontal: false,
      datePrecision: "exact",
      people: [],
      locations: [],
      topics: [],
    });
    expect(records[1]).toMatchObject({
      fileName: "new.jpg",
      datePrecision: "decade",
      dateValue: "1950",
      people: ["Ada"],
      locations: ["Gdansk"],
      topics: ["Family"],
    });
    expect(
      normalizeImageMetadata({
        title: "Legacy",
        description: "",
        rotation: 0,
        datePrecision: "year",
        dateValue: "1958",
      }).dateValues,
    ).toEqual({ year: "1958" });
  });

  it("keeps exported filenames unique when titles are identical", () => {
    const fileNames = createSliceFileNames(
      new Map([
        [
          "scan-1",
          new Map([
            ["first", { title: "Same title", description: "", rotation: 0 }],
            ["second", { title: "Same title", description: "", rotation: 0 }],
          ]),
        ],
      ]),
    );

    expect(Array.from(fileNames.get("scan-1")?.values() ?? [])).toEqual([
      "same-title.jpg",
      "same-title-second.jpg",
    ]);
  });

  it("embeds all descriptive metadata in the exported JPEG", async () => {
    const jpegBytes = new Uint8Array([
      0xff, 0xd8, 0xff, 0xda, 0x00, 0x02, 0x00, 0xff, 0xd9,
    ]);
    const jpg = new Blob([jpegBytes], {
      type: "image/jpeg",
    });
    Object.defineProperty(jpg, "arrayBuffer", {
      value: async () => jpegBytes.buffer,
    });
    const result = await embedSliceMetadata(jpg, {
      title: "Family photo",
      description: "Back text",
      rotation: 0,
      datePrecision: "exact",
      dateValue: "1958-04-03",
      dateValues: { exact: "1958-04-03" },
      people: ["Ada"],
      locations: ["Gdansk"],
      topics: ["Family"],
    });
    const bytes = new Uint8Array(await readBlobArrayBuffer(result));
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
    const exif = piexif.load(binary);

    expect(readMetadata(bytes)).toMatchObject({
      title: "Family photo",
      description: "Back text",
      keywords: ["Ada", "Gdansk", "Family"],
    });
    expect(exif["0th"]?.[piexif.ImageIFD.DateTime]).toBe("1958:04:03 00:00:00");
    expect(exif.Exif?.[piexif.ExifIFD.DateTimeOriginal]).toBe(
      "1958:04:03 00:00:00",
    );
    expect(exif["0th"]?.[piexif.ImageIFD.XPTitle]).toEqual([
      70, 0, 97, 0, 109, 0, 105, 0, 108, 0, 121, 0, 32, 0, 112, 0, 104, 0,
      111, 0, 116, 0, 111, 0, 0, 0,
    ]);
    expect(exif["0th"]?.[piexif.ImageIFD.XPComment]).toBeDefined();
    expect(exif["0th"]?.[piexif.ImageIFD.XPKeywords]).toBeDefined();
    expect(exif["0th"]?.[piexif.ImageIFD.XPSubject]).toBeDefined();
    expect(exif.Exif?.[piexif.ExifIFD.UserComment]).toBe(
      "UNICODE\0" +
        String.fromCharCode(
          0, 66, 0, 97, 0, 99, 0, 107, 0, 32, 0, 116, 0, 101, 0, 120, 0, 116,
        ),
    );
  });

  it.each([
    { precision: "year" as const, value: "1950" },
    { precision: "decade" as const, value: "1960" },
  ])("stores a $precision date in the EXIF user comment", async ({
    precision,
    value,
  }) => {
    const jpegBytes = new Uint8Array([
      0xff, 0xd8, 0xff, 0xda, 0x00, 0x02, 0x00, 0xff, 0xd9,
    ]);
    const jpg = new Blob([jpegBytes], { type: "image/jpeg" });
    Object.defineProperty(jpg, "arrayBuffer", {
      value: async () => jpegBytes.buffer,
    });
    const result = await embedSliceMetadata(jpg, {
      title: "",
      description: "",
      rotation: 0,
      datePrecision: precision,
      dateValue: value,
      dateValues: { [precision]: value },
    });
    const bytes = new Uint8Array(await readBlobArrayBuffer(result));
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
    const exif = piexif.load(binary);
    const comment = `Date (${precision}): ${value}`;
    const encodedComment = Array.from(
      comment,
      (character) => String.fromCharCode(0, character.charCodeAt(0)),
    ).join("");

    expect(exif.Exif?.[piexif.ExifIFD.UserComment]).toBe(
      `UNICODE\0${encodedComment}`,
    );
    expect(exif.Exif?.[piexif.ExifIFD.DateTimeOriginal]).toBeUndefined();
  });

  function readBlobArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) resolve(reader.result);
        else reject(new Error("Could not read exported JPEG."));
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(blob);
    });
  }

  it("keeps rotation within supported angles and resets only orientation state", () => {
    const metadata = {
      title: "Portrait",
      description: "Keep this",
      rotation: 270 as const,
      mirrorHorizontal: true,
    };

    expect(getOrientationTarget(metadata, 90)).toEqual({
      rotation: 0,
      mirrorHorizontal: true,
    });
    expect(toggleMirror(metadata).mirrorHorizontal).toBe(false);
    expect(resetOrientation()).toEqual({ rotation: 0, mirrorHorizontal: false });
    expect(getOrientedDimensions(640, 480, 90)).toEqual({
      width: 480,
      height: 640,
    });
  });
});
