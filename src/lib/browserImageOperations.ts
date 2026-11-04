/** Browser helpers for reading, transforming, and downloading image files. */
import type { Rotation } from "../types/imageOperations";
import { applyImageOrientation, getOrientedDimensions } from "./imageOrientation";

export async function readFilesAsArrayBuffers(
  files: readonly File[],
): Promise<ArrayBuffer[]> {
  return Promise.all(files.map((file) => file.arrayBuffer()));
}

export function createObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function createObjectUrls(blobs: Iterable<Blob>): string[] {
  return Array.from(blobs, createObjectUrl);
}

export function createObjectUrlsById<Id>(
  blobs: ReadonlyMap<Id, Blob>,
): Map<Id, string> {
  return new Map(
    Array.from(blobs, ([id, blob]) => [id, createObjectUrl(blob)] as const),
  );
}

export function revokeObjectUrls(urls: Iterable<string>): void {
  for (const url of urls) {
    URL.revokeObjectURL(url);
  }
}

export function nextRotation(rotation: Rotation): Rotation {
  return ((rotation + 90) % 360) as Rotation;
}

export async function rotateImageBlob(
  blob: Blob,
  rotation: Rotation,
): Promise<Blob> {
  return orientImageBlob(blob, rotation, false);
}

export async function orientImageBlob(
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
    const canvas = document.createElement("canvas");

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Could not create canvas context.");
    }

    applyImageOrientation(
      context,
      canvas.width,
      canvas.height,
      rotation,
      mirrorHorizontal,
    );
    context.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error("Could not generate rotated image."));
          }
        },
        blob.type.startsWith("image/") ? blob.type : "image/png",
      );
    });
  } finally {
    bitmap.close();
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  try {
    document.body.append(link);
    link.click();
  } finally {
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
