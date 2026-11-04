/** Applies shared canvas transforms and dimensions for image orientation. */
import type { Rotation } from "../types/imageOperations";

type ImageCanvasContext =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D;

export function applyImageOrientation(
  context: ImageCanvasContext,
  width: number,
  height: number,
  rotation: Rotation,
  mirrorHorizontal: boolean,
): void {
  context.translate(width / 2, height / 2);
  context.rotate((rotation * Math.PI) / 180);
  context.scale(mirrorHorizontal ? -1 : 1, 1);
}

export function getOrientedDimensions(
  width: number,
  height: number,
  rotation: Rotation,
): { width: number; height: number } {
  return rotation === 90 || rotation === 270
    ? { width: height, height: width }
    : { width, height };
}
