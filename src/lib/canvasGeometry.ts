/** Geometry helpers for editing image regions and positioning canvas controls. */
import type { Coord, Region } from "../types/imageOperations";
import type { MagnifierGeometry } from "../types/canvas";

export const REGION_POINT_KEYS = [
  "upperLeft",
  "upperRight",
  "lowerRight",
  "lowerLeft",
] as const;

export const REGION_EDGES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
] as const;

export function getRegionPoints(region: Region): Coord[] {
  return REGION_POINT_KEYS.map((key) => region[key]);
}

export function getRegionCenter(region: Region): Coord {
  const points = getRegionPoints(region);

  return points.reduce(
    (center, point) => ({
      x: center.x + point.x / points.length,
      y: center.y + point.y / points.length,
    }),
    { x: 0, y: 0 },
  );
}

export function updateRegionPoint(
  region: Region,
  index: number,
  point: Coord,
): Region | null {
  const key = REGION_POINT_KEYS[index];

  if (!key) {
    return null;
  }

  return { ...region, [key]: point };
}

export function updateRegionEdge(
  region: Region,
  firstIndex: number,
  first: Coord,
  secondIndex: number,
  second: Coord,
): Region {
  const nextRegion = { ...region };
  const firstKey = REGION_POINT_KEYS[firstIndex];
  const secondKey = REGION_POINT_KEYS[secondIndex];

  if (firstKey) {
    nextRegion[firstKey] = first;
  }

  if (secondKey) {
    nextRegion[secondKey] = second;
  }

  return nextRegion;
}

export function translateRegion(
  region: Region,
  originalPoints: readonly Coord[],
  delta: Coord,
): Region {
  const nextRegion = { ...region };

  REGION_POINT_KEYS.forEach((key, index) => {
    const point = originalPoints[index];
    if (!point) {
      return;
    }

    nextRegion[key] = {
      x: point.x + delta.x,
      y: point.y + delta.y,
    };
  });

  return nextRegion;
}

export function getRegionEdgeHandle(
  first: Coord,
  second: Coord,
): { x: number; y: number; rotation: number } {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
    rotation:
      Math.atan2(second.y - first.y, second.x - first.x) *
      (180 / Math.PI),
  };
}

export function getRegionTrashPosition(
  points: readonly Coord[],
  canvasWidth: number,
  canvasHeight: number,
): Coord {
  const hitRadius = Math.min(20, canvasWidth / 2, canvasHeight / 2);
  const offset = hitRadius + 10;
  const candidates = [
    { point: points[1], direction: 1 },
    { point: points[0], direction: -1 },
    { point: points[2], direction: 1 },
    { point: points[3], direction: -1 },
  ]
    .filter(
      (candidate): candidate is { point: Coord; direction: number } =>
        candidate.point !== undefined,
    )
    .map(({ point, direction }) => ({
      x: point.x + direction * offset,
      y: point.y,
    }));

  const fitsCanvas = ({ x, y }: Coord) =>
    x - hitRadius >= 0 &&
    x + hitRadius <= canvasWidth &&
    y - hitRadius >= 0 &&
    y + hitRadius <= canvasHeight;
  const selectedPosition =
    candidates.find(fitsCanvas) ?? candidates[3] ?? { x: 0, y: 0 };

  return {
    x: Math.max(
      hitRadius,
      Math.min(canvasWidth - hitRadius, selectedPosition.x),
    ),
    y: Math.max(
      hitRadius,
      Math.min(canvasHeight - hitRadius, selectedPosition.y),
    ),
  };
}

export function getRegionPointLabel(index: number): string {
  switch (index) {
    case 0:
      return "UL";
    case 1:
      return "UR";
    case 2:
      return "LR";
    case 3:
      return "LL";
    default:
      return "NN";
  }
}

export function createRegionAt(
  id: string,
  center: Coord,
  halfWidth = 40,
  halfHeight = 20,
): Region {
  return {
    id,
    upperLeft: { x: center.x - halfWidth, y: center.y - halfHeight },
    upperRight: { x: center.x + halfWidth, y: center.y - halfHeight },
    lowerRight: { x: center.x + halfWidth, y: center.y + halfHeight },
    lowerLeft: { x: center.x - halfWidth, y: center.y + halfHeight },
  };
}

export function getMagnifierGeometry(
  imageWidth: number,
  imageHeight: number,
  point: Coord,
  size = 120,
  zoom = 4,
): MagnifierGeometry {
  const marginX = 20;
  const marginY = 100;
  const maxEdgeMargin = 20;

  let xAddition = marginX;
  let yAddition = size - marginY;

  if (point.x + size + marginX > imageWidth - maxEdgeMargin) {
    xAddition = -size - xAddition;
  }

  if (point.y + size < imageHeight - maxEdgeMargin) {
    yAddition = -size - yAddition;
  }

  return {
    x: point.x + xAddition,
    y: point.y - size - yAddition,
    cropX: point.x - size / 2 / zoom,
    cropY: point.y - size / 2 / zoom,
    cropWidth: size / zoom,
    cropHeight: size / zoom,
  };
}
