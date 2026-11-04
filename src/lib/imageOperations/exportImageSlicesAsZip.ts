import type { ProcessedImage } from "../../types/image";
import type {
    ImageOperationsWorkerType,
    GenerateSlicedImagesResult,
    Region,
    Coord,
    ImageMetadata,
    Rotation,
} from "../../types/imageOperations";
import { writeMetadata } from "aeo-image";
import piexif from "piexifjs";
import { getSlicedImagesFromImage } from "./slicesUtil";
import {
    createSliceFileNames,
} from "./serializeSliceMetadata";
import { applyImageOrientation, getOrientedDimensions } from "../imageOrientation";
import JSZip from "jszip";

/** Exports full-resolution image slices and their metadata as a ZIP archive. */
export async function exportImageSlicesAsZip(
    task: Extract<
        ImageOperationsWorkerType,
        { taskType: "EXPORT_IMAGE_SLICES_AS_ZIP" }
    >,
    processedImages: Map<string, ProcessedImage>
): Promise<GenerateSlicedImagesResult> {
    const zip = new JSZip();
    const metadataByImage = task.payload.metadataByImage;
    const fileNames = createSliceFileNames(metadataByImage);
    const exportedAt = new Date().toISOString();
    const records: Array<Record<string, unknown>> = [];
    const indexLines = [
        "file_name\ttitle\tdescription\texact_date\tyear\tdecade\tdate_value\tpeople\tlocations\ttopics",
    ];

    for (const [imageId, image] of processedImages) {
        const { img, regions } = await getOriginalTransformedData(image);
        const slices = await getSlicedImagesFromImage(img, regions);
        const metadataByRegion = metadataByImage.get(imageId);

        image.metadata = metadataByRegion;

        for (const [regionId, blob] of slices) {
            const metadata = metadataByRegion?.get(regionId) ?? emptyMetadata();
            const fileName = fileNames.get(imageId)?.get(regionId);
            if (!fileName) {
                throw new Error(`Missing exported filename for region "${regionId}".`);
            }
            const oriented = await orientBlob(
                blob,
                metadata.rotation,
                metadata.mirrorHorizontal ?? false,
            );
            const withMetadata = await embedSliceMetadata(
                oriented,
                metadata,
            );
            zip.file(fileName, withMetadata);
            const region = regions.find((item) => item.id === regionId);
            const record = {
                imageId,
                sourceFileName:
                    task.payload.sourceFileNamesByImage.get(imageId) ?? null,
                regionId,
                fileName,
                region: region ?? null,
                metadata,
                exportedAt,
            };
            records.push(record);
            zip.file(
                `metadata/${fileName.replace(/\.jpg$/i, ".json")}`,
                JSON.stringify(record, null, 2),
            );
            indexLines.push(
                [
                    fileName,
                    metadata.title,
                    metadata.description,
                    metadata.dateValues?.exact ?? "",
                    metadata.dateValues?.year ?? "",
                    metadata.dateValues?.decade ?? "",
                    metadata.dateValue ?? "",
                    (metadata.people ?? []).join("; "),
                    (metadata.locations ?? []).join("; "),
                    (metadata.topics ?? []).join("; "),
                ]
                    .map((field) => field.replace(/[\t\r\n]+/g, " "))
                    .join("\t"),
            );
        }
    }

    zip.file("metadata.json", JSON.stringify(records, null, 2));
    zip.file("index.txt", indexLines.join("\n"));
    zip.file(
        "README.txt",
        [
            "PhotoSlicer export",
            `Generated at: ${exportedAt}`,
            "Coordinates in metadata are measured in pixels in the original source image.",
            "Original capture timestamps are unavailable; user-entered object dates are included in per-crop metadata.",
            "The original source image files are not included; only full-resolution crops are included.",
            "Use metadata.json for the searchable crop metadata index and index.txt for tab-separated text.",
        ].join("\n"),
    );

    const result = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    return {
      zip: result
    };
}

const emptyMetadata = (): ImageMetadata => ({
    title: "",
    description: "",
    rotation: 0,
});

const getOriginalTransformedData = async (image: ProcessedImage) => {
    const img = await imageBitmapToBlob(image.originalImage);
    const regions: Region[] = image.regions
        ? scaleRegions(image.regions, image.scale)
        : [];

    return {
        img,
        regions,
    };
};

const regionKeys = [
    "upperLeft",
    "upperRight",
    "lowerRight",
    "lowerLeft",
] as const satisfies readonly (keyof Omit<Region, "id">)[];

const scaleCoord = (coord: Coord, scale: number): Coord => ({
    x: coord.x / scale,
    y: coord.y / scale,
});

const scaleRegions = (regions: Region[], scale: number): Region[] => {
    return regions.map(region => {
        const scaled = { ...region };

        for (const key of regionKeys) {
            scaled[key] = scaleCoord(region[key], scale);
        }

        return scaled;
    });
};

async function imageBitmapToBlob(
    bitmap: ImageBitmap,
    type = "image/jpeg",
    quality?: number,
): Promise<Blob> {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("Cannot get 2D canvas context");
    }

    ctx.drawImage(bitmap, 0, 0);

    return canvas.convertToBlob({ type, quality });
}

async function orientBlob(
    blob: Blob,
    rotation: Rotation,
    mirrorHorizontal: boolean,
): Promise<Blob> {
    if (rotation === 0 && !mirrorHorizontal) {
        return blob;
    }

    const bitmap = await createImageBitmap(blob);

    try {
        const dimensions = getOrientedDimensions(
            bitmap.width,
            bitmap.height,
            rotation,
        );
        const canvas = new OffscreenCanvas(dimensions.width, dimensions.height);
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            throw new Error("Could not create canvas context.");
        }

        applyImageOrientation(
            ctx,
            canvas.width,
            canvas.height,
            rotation,
            mirrorHorizontal,
        );
        ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);

        return canvas.convertToBlob({
            type: blob.type.startsWith("image/") ? blob.type : "image/jpeg",
        });
    } finally {
        bitmap.close();
    }
}

export async function embedSliceMetadata(
  jpgBlob: Blob,
  metadata: ImageMetadata,
): Promise<Blob> {
  const keywords = Array.from(
    new Set(
      [...(metadata.people ?? []), ...(metadata.locations ?? []), ...(metadata.topics ?? [])]
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
  const exactDate = (metadata.datePrecision ?? "exact") === "exact"
    ? metadata.dateValues?.exact ?? metadata.dateValue ?? ""
    : "";
  const datePrecision = metadata.datePrecision ?? "exact";
  const partialDate = datePrecision === "exact"
    ? ""
    : metadata.dateValues?.[datePrecision] ??
      (metadata.datePrecision === datePrecision ? metadata.dateValue : "") ??
      "";
  if (
    !metadata.title &&
    !metadata.description &&
    !keywords.length &&
    !exactDate &&
    !partialDate &&
    !(metadata.topics?.length)
  ) {
    return jpgBlob;
  }

  const bytes = new Uint8Array(await jpgBlob.arrayBuffer());
  const result = new Uint8Array(writeMetadata(bytes, {
    title: metadata.title || undefined,
    description: metadata.description || undefined,
    keywords: keywords.length ? keywords : undefined,
  }));
  const binaryJpeg = bytesToBinaryString(result);
  const exif = piexif.load(binaryJpeg);
  const zeroth = (exif["0th"] ??= {});
  const exifIfd = (exif.Exif ??= {});

  if (metadata.title) {
    zeroth[piexif.ImageIFD.XPTitle] = toWindowsUnicode(metadata.title);
  }
  if (metadata.description) {
    zeroth[piexif.ImageIFD.ImageDescription] = metadata.description;
    zeroth[piexif.ImageIFD.XPComment] = toWindowsUnicode(metadata.description);
  }
  const userComment = [
    metadata.description,
    partialDate ? `Date (${datePrecision}): ${partialDate}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  if (userComment) {
    exifIfd[piexif.ExifIFD.UserComment] = toExifUserComment(userComment);
  }
  if (keywords.length) {
    zeroth[piexif.ImageIFD.XPKeywords] = toWindowsUnicode(keywords.join(";"));
  }
  if (metadata.topics?.length) {
    zeroth[piexif.ImageIFD.XPSubject] = toWindowsUnicode(
      metadata.topics.join(";"),
    );
  }
  if (exactDate) {
    const exifDate = toExifDate(exactDate);
    if (exifDate) {
      zeroth[piexif.ImageIFD.DateTime] = exifDate;
      exifIfd[piexif.ExifIFD.DateTimeOriginal] = exifDate;
      exifIfd[piexif.ExifIFD.DateTimeDigitized] = exifDate;
    }
  }

  const exifBytes = piexif.dump(exif);
  const exifJpeg = binaryStringToBytes(piexif.insert(exifBytes, binaryJpeg));
  const safeBytes = new Uint8Array(exifJpeg.byteLength);
  safeBytes.set(exifJpeg);

  return new Blob([safeBytes.buffer as ArrayBuffer], {
      type: "image/jpeg",
  });
}

function bytesToBinaryString(bytes: Uint8Array): string {
  const chunks: string[] = [];
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    chunks.push(
      String.fromCharCode(...bytes.subarray(offset, offset + chunkSize)),
    );
  }
  return chunks.join("");
}

function binaryStringToBytes(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index);
  }
  return bytes;
}

function toWindowsUnicode(value: string): number[] {
  const bytes: number[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    bytes.push(code & 0xff, code >> 8);
  }
  bytes.push(0, 0);
  return bytes;
}

function toExifUserComment(value: string): string {
  const encoded = value
    .split("")
    .map((character) => character.charCodeAt(0))
    .map((code) => String.fromCharCode((code >> 8) & 0xff, code & 0xff))
    .join("");
  return `UNICODE\0${encoded}`;
}

function toExifDate(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return `${match[1]}:${match[2]}:${match[3]} 00:00:00`;
}