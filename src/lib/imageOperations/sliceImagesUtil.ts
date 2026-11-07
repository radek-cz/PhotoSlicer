/** Extracts perspective-corrected image slices from detected regions. */
import type { Mat } from "@opencvjs/types/lib/opencv/_types";
import type { Region, Coord, RegionId } from "../../types/imageOperations";
import { matToBlob } from "./opencvUtils";

export async function extractImagesFromRegions(
  image: Mat,
  regions: Region[],
  cv: typeof import("@opencvjs/types/lib/opencv/_types"),
): Promise<Map<RegionId, Blob>> {
  const blobs = await Promise.all(
    regions.map(async (region) => {
      const width = Math.max(
        distance(region.upperLeft, region.upperRight),
        distance(region.lowerLeft, region.lowerRight),
      );

      const height = Math.max(
        distance(region.upperLeft, region.lowerLeft),
        distance(region.upperRight, region.lowerRight),
      );

      const outputWidth = Math.max(1, Math.round(width));
      const outputHeight = Math.max(1, Math.round(height));

      const sourcePoints = cv.matFromArray(
        4,
        1,
        cv.CV_32FC2,
        [
          region.upperLeft.x,
          region.upperLeft.y,
          region.upperRight.x,
          region.upperRight.y,
          region.lowerRight.x,
          region.lowerRight.y,
          region.lowerLeft.x,
          region.lowerLeft.y,
        ],
      );

      const destinationPoints = cv.matFromArray(
        4,
        1,
        cv.CV_32FC2,
        [
          0, 0,
          outputWidth - 1, 0,
          outputWidth - 1, outputHeight - 1,
          0, outputHeight - 1,
        ],
      );

      const transform = cv.getPerspectiveTransform(
        sourcePoints,
        destinationPoints,
      );

      const result = new cv.Mat();

      try {
        cv.warpPerspective(
          image,
          result,
          transform,
          new cv.Size(outputWidth, outputHeight),
          cv.INTER_LINEAR,
          cv.BORDER_CONSTANT,
          new cv.Scalar(0, 0, 0, 0),
        );

        return await matToBlob(result, "image/jpeg", 0.90, cv);
      } finally {
        sourcePoints.delete();
        destinationPoints.delete();
        transform.delete();
        result.delete();
      }
    }),
  );

  return new Map(regions.map((region, index) => [region.id, blobs[index]]));
}

function distance(a: Coord, b: Coord): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  return Math.sqrt(dx * dx + dy * dy);
}