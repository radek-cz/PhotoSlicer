/** Converts between image blobs and OpenCV matrices in worker contexts. */
import type { Mat } from "@opencvjs/types/lib/opencv/Mat";

export const blobToMat = async (
    blob: Blob,
    cv: typeof import("@opencvjs/types/lib/opencv/_types")
    ) => {
    const bitmap = await createImageBitmap(blob);

    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) {
        bitmap.close();
        throw new Error("Could not get canvas context");
    }

    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    // OpenCV.js input APIs vary by version; workers generally need ImageData.
    const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
    );

    return cv.matFromImageData(imageData);
};

export async function matToBlob(
  mat: Mat,
  mimeType = "image/jpeg",
  quality = 1,
  cv: typeof import("@opencvjs/types/lib/opencv/_types")
): Promise<Blob> {
  if (typeof OffscreenCanvas === "undefined") {
    throw new Error(
      "OffscreenCanvas is not available in this Web Worker.",
    );
  }

  // OpenCV may use BGR or BGRA channels, while ImageData requires RGBA.
  let rgba: Mat | null = null;

  try {
    if (mat.channels() === 4) {
      rgba = mat.clone();
    } else if (mat.channels() === 3) {
      rgba = new cv.Mat();

      cv.cvtColor(
        mat,
        rgba,
        cv.COLOR_BGR2RGBA,
      );
    } else if (mat.channels() === 1) {
      rgba = new cv.Mat();

      cv.cvtColor(
        mat,
        rgba,
        cv.COLOR_GRAY2RGBA,
      );
    } else {
      throw new Error(
        `Unsupported number of channels: ${mat.channels()}`,
      );
    }

    const canvas = new OffscreenCanvas(
      rgba.cols,
      rgba.rows,
    );

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error(
        "Could not get 2D context from OffscreenCanvas.",
      );
    }

    const imageData = new ImageData(
      new Uint8ClampedArray(rgba.data),
      rgba.cols,
      rgba.rows,
    );

    ctx.putImageData(imageData, 0, 0);

    return await canvas.convertToBlob({
      type: mimeType,
      quality,
    });
  } finally {
    rgba?.delete();
  }
}