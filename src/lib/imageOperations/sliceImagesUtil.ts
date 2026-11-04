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

// export async function debugRegions(
//   image: Mat,
//   regions: Region[],
//   cv: typeof import("@opencvjs/types/lib/opencv/_types"),
// ): Promise<Blob> {
//   const debug = image.clone();

//   regions.forEach((region, index) => {
//     const points = [
//       region.upperLeft,
//       region.upperRight,
//       region.lowerRight,
//       region.lowerLeft,
//     ];

//     // Draw the quadrilateral edges.
//     for (let i = 0; i < 4; i++) {
//       const a = points[i];
//       const b = points[(i + 1) % 4];

//       cv.line(
//         debug,
//         new cv.Point(Math.round(a.x), Math.round(a.y)),
//         new cv.Point(Math.round(b.x), Math.round(b.y)),
//         new cv.Scalar(0, 0, 255, 255),
//         3,
//       );
//     }

//     // Draw the corner points.
//     points.forEach((point, pointIndex) => {
//       cv.circle(
//         debug,
//         new cv.Point(
//           Math.round(point.x),
//           Math.round(point.y),
//         ),
//         12,
//         new cv.Scalar(0, 255, 0, 255),
//         -1,
//       );

//       cv.putText(
//         debug,
//         `${pointIndex} (${Math.round(point.x)},${Math.round(point.y)})`,
//         new cv.Point(
//           Math.round(point.x) + 15,
//           Math.round(point.y),
//         ),
//         cv.FONT_HERSHEY_SIMPLEX,
//         0.7,
//         new cv.Scalar(255, 0, 0, 255),
//         2,
//       );
//     });
//     // Draw the region number near its center.
//     const centerX =
//       (region.upperLeft.x +
//         region.upperRight.x +
//         region.lowerRight.x +
//         region.lowerLeft.x) /
//       4;

//     const centerY =
//       (region.upperLeft.y +
//         region.upperRight.y +
//         region.lowerRight.y +
//         region.lowerLeft.y) /
//       4;

//     cv.putText(
//       debug,
//       `REGION ${index}`,
//       new cv.Point(Math.round(centerX), Math.round(centerY)),
//       cv.FONT_HERSHEY_SIMPLEX,
//       1,
//       new cv.Scalar(255, 255, 0, 255),
//       3,
//     );
//   });

//   console.log("IMAGE", image.cols, image.rows);
// console.log(JSON.stringify(regions, null, 2));

//   try {
//     return await matToBlob(debug, "image/jpeg", 0.85, cv);
//   } finally {
//     debug.delete();
//   }
// }

// export async function debugRegionBoundingBoxes(
//   image: Mat,
//   regions: Region[],
//   cv: typeof import("@opencvjs/types/lib/opencv/_types"),
// ): Promise<Blob[]> {
//   return Promise.all(
//     regions.map(async (region) => {
//       const xs = [
//         region.upperLeft.x,
//         region.upperRight.x,
//         region.lowerRight.x,
//         region.lowerLeft.x,
//       ];

//       const ys = [
//         region.upperLeft.y,
//         region.upperRight.y,
//         region.lowerRight.y,
//         region.lowerLeft.y,
//       ];

//       const minX = Math.max(0, Math.floor(Math.min(...xs)));
//       const minY = Math.max(0, Math.floor(Math.min(...ys)));
//       const maxX = Math.min(image.cols - 1, Math.ceil(Math.max(...xs)));
//       const maxY = Math.min(image.rows - 1, Math.ceil(Math.max(...ys)));

//       const width = maxX - minX + 1;
//       const height = maxY - minY + 1;

//       if (width <= 0 || height <= 0) {
//         throw new Error("Invalid region bounding box");
//       }

//       const rect = new cv.Rect(minX, minY, width, height);
//       const crop = image.roi(rect);

//       try {
//         return await matToBlob(crop, "image/jpeg", 0.85, cv);
//       } finally {
//         crop.delete();
//       }
//     }),
//   );
// }

function distance(a: Coord, b: Coord): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  return Math.sqrt(dx * dx + dy * dy);
}