import JSZip from "jszip";
import { Blob as NodeBlob } from "node:buffer";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProcessedImage } from "../../types/image";
import type { ImageMetadata, Region } from "../../types/imageOperations";
import { exportImageSlicesAsZip } from "./exportImageSlicesAsZip";

vi.mock("aeo-image", () => ({
  writeMetadata: (bytes: Uint8Array) => bytes,
}));

vi.mock("piexifjs", () => ({
  default: {
    load: () => ({ "0th": {}, Exif: {} }),
    dump: () => "",
    insert: (_exif: string, binary: string) => binary,
    ImageIFD: {
      XPTitle: 1,
      ImageDescription: 2,
      XPComment: 3,
      XPKeywords: 4,
      XPSubject: 5,
      DateTime: 6,
    },
    ExifIFD: {
      UserComment: 1,
      DateTimeOriginal: 2,
      DateTimeDigitized: 3,
    },
  },
}));

vi.mock("./slicesUtil", () => ({
  getSlicedImagesFromImage: vi.fn(
    async (_image: Blob, regions: Array<{ id: string }>) =>
      new Map(
        regions.map(
          (region) => [region.id, new Blob(["crop"], { type: "image/jpeg" })] as const,
        ),
      ),
  ),
}));

class TestOffscreenCanvas {
  readonly width: number;
  readonly height: number;

  constructor(
    width: number,
    height: number,
  ) {
    this.width = width;
    this.height = height;
  }

  getContext() {
    return { drawImage: () => undefined };
  }

  async convertToBlob(options?: { type?: string }) {
    return new Blob(["original"], { type: options?.type ?? "image/jpeg" });
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("exportImageSlicesAsZip", () => {
  it("includes full-size crops, per-crop metadata, coordinates, dates, and a text index", async () => {
    vi.stubGlobal("Blob", NodeBlob);
    vi.stubGlobal("OffscreenCanvas", TestOffscreenCanvas);
    const region: Region = {
      id: "region-1",
      upperLeft: { x: 10, y: 20 },
      upperRight: { x: 50, y: 20 },
      lowerRight: { x: 50, y: 70 },
      lowerLeft: { x: 10, y: 70 },
    };
    const metadata: ImageMetadata = {
      title: "Family name",
      description: "At the coast",
      rotation: 0,
      datePrecision: "year",
      dateValue: "1950",
      dateValues: { year: "1950" },
      people: ["Ada"],
      locations: ["Paris"],
      topics: ["History"],
    };
    const imageBitmap: ImageBitmap = {
      width: 100,
      height: 140,
      close: () => undefined,
    };
    const processedImage: ProcessedImage = {
      originalImage: imageBitmap,
      reducedImage: new Blob(["preview"]),
      scale: 0.5,
      regions: [region],
    };

    const { zip: blob } = await exportImageSlicesAsZip(
      {
        taskId: "test-export",
        taskType: "EXPORT_IMAGE_SLICES_AS_ZIP",
        payload: {
          metadataByImage: new Map([
            ["image-1", new Map([["region-1", metadata]])],
          ]),
          sourceFileNamesByImage: new Map([["image-1", "scan.png"]]),
        },
      },
      new Map([["image-1", processedImage]]),
    );

    const zip = await JSZip.loadAsync(blob);
    const cropFileName = Object.keys(zip.files).find(
      (name) => name.endsWith(".jpg") && !name.startsWith("metadata/"),
    );
    expect(cropFileName).toBeTruthy();
    expect(Object.keys(zip.files)).toContain("metadata.json");
    expect(Object.keys(zip.files)).toContain("index.txt");
    expect(Object.keys(zip.files)).toContain("README.txt");

    const cropJsonName = cropFileName?.replace(/\.jpg$/i, ".json");
    const perCropMetadata = JSON.parse(
      await zip.file(`metadata/${cropJsonName}`)!.async("string"),
    );
    expect(perCropMetadata).toMatchObject({
      sourceFileName: "scan.png",
      region: {
        upperLeft: { x: 20, y: 40 },
        lowerRight: { x: 100, y: 140 },
      },
      metadata: {
        title: "Family name",
        dateValue: "1950",
      },
    });
    expect(Number.isNaN(Date.parse(perCropMetadata.exportedAt))).toBe(false);
    expect(await zip.file("metadata.json")!.async("string")).toContain(
      '"sourceFileName": "scan.png"',
    );

    const textIndex = await zip.file("index.txt")!.async("string");
    for (const entry of ["Family name", "At the coast", "1950", "Ada", "Paris", "History"]) {
      expect(textIndex).toContain(entry);
    }

    const crop = await zip.file(cropFileName!)!.async("blob");
    expect(crop.size).toBeGreaterThan(0);
    expect(await zip.file("README.txt")!.async("string")).toContain(
      "Original capture timestamps are unavailable",
    );
  });
});
