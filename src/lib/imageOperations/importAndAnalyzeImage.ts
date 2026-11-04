/** Decodes, normalizes, scales, and analyzes an imported image. */
import type { ProcessedImage } from "../../types/image";
import type { ImageOperationsWorkerType, LoadImageResult } from "../../types/imageOperations";
import { detectRegionsInImage } from "./detectImageRegions";

const DEST_WIDTH = 1280;

export const importAndAnalyzeImage = async (
    task: Extract<ImageOperationsWorkerType, { taskType: "IMPORT_AND_ANALYZE_IMAGE" }>,
    processedImages: Map<string, ProcessedImage>
): Promise<LoadImageResult> => {
  console.log("importAndAnalyzeImage", task.taskId);
  const { buffer } = task.payload;
    
  const id = crypto.randomUUID().toString();
  let bitmap = await bufferToBitmap(buffer);
  bitmap = await rotateIfPortrait(bitmap);
  const scaledImage = await generateScaledImage(bitmap);

  const processedImage = {
    originalImage: bitmap,
    scale: scaledImage.scale,
    reducedImage: scaledImage.scaledImage
  } as ProcessedImage;
  const regions = await detectRegionsInImage(processedImage);
  processedImage.regions = regions;

  processedImages.set(id, processedImage);
  return {
      imageId: id,
      scaledImage: scaledImage.scaledImage,
      scale: scaledImage.scale,
      regions: regions
  }
}

const bufferToBitmap = async (buffer: ArrayBuffer): Promise<ImageBitmap> => {
  const blob = new Blob([buffer]);
  
  return await createImageBitmap(blob);
};

const rotateIfPortrait = async (bitmap: ImageBitmap): Promise<ImageBitmap>=> {
  if (bitmap.height <= bitmap.width) {
    return bitmap;
  }

  const canvas = new OffscreenCanvas(
    bitmap.height,
    bitmap.width
  );

  const ctx = canvas.getContext("2d")!;

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(Math.PI / 2);

  ctx.drawImage(
    bitmap,
    -bitmap.width / 2,
    -bitmap.height / 2
  );

  return await createImageBitmap(canvas);
}

interface ScaledImage {
  scaledImage: Blob,
  scale: number
}

const generateScaledImage = async (image: ImageBitmap): Promise<ScaledImage> => {
  const originalWidth = image.width;
  const scale = DEST_WIDTH / originalWidth;
  const destHeight = image.height * scale;

  const canvas = new OffscreenCanvas(DEST_WIDTH, destHeight);
  const ctx = canvas.getContext("2d");

  if(ctx == null)
    throw new Error("Couldn't create canvas context");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(image, 0, 0, DEST_WIDTH, destHeight);

  const scaledImage = await canvas.convertToBlob();

  return {
    scaledImage: scaledImage,
    scale: scale
  }
}