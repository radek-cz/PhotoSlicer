import type { Coord } from "../../../../types/imageOperations";

const SNAP_INCREMENT = Math.PI / 12;
const GEOMETRY_EPSILON = 1e-8;

export function snapDeltaToAngle(
  delta: Coord,
): { delta: Coord; angle: number } | null {
  const length = Math.hypot(delta.x, delta.y);
  if (length === 0) {
    return null;
  }

  const angle =
    Math.round(Math.atan2(delta.y, delta.x) / SNAP_INCREMENT) *
    SNAP_INCREMENT;

  return {
    delta: {
      x: Math.cos(angle) * length,
      y: Math.sin(angle) * length,
    },
    angle,
  };
}

export function getAngleGuidePoints(
  origin: Coord,
  angle: number,
  width: number,
  height: number,
): number[] | null {
  const direction = { x: Math.cos(angle), y: Math.sin(angle) };
  let minimum = Number.NEGATIVE_INFINITY;
  let maximum = Number.POSITIVE_INFINITY;

  const intersectAxis = (
    position: number,
    velocity: number,
    extent: number,
  ): boolean => {
    if (Math.abs(velocity) < GEOMETRY_EPSILON) {
      return position >= 0 && position <= extent;
    }

    const first = (0 - position) / velocity;
    const second = (extent - position) / velocity;
    minimum = Math.max(minimum, Math.min(first, second));
    maximum = Math.min(maximum, Math.max(first, second));
    return minimum <= maximum;
  };

  if (
    width < 0 ||
    height < 0 ||
    !intersectAxis(origin.x, direction.x, width) ||
    !intersectAxis(origin.y, direction.y, height) ||
    !Number.isFinite(minimum) ||
    !Number.isFinite(maximum)
  ) {
    return null;
  }

  const startX = origin.x + direction.x * minimum;
  const startY = origin.y + direction.y * minimum;
  const endX = origin.x + direction.x * maximum;
  const endY = origin.y + direction.y * maximum;

  return [
    Math.max(0, Math.min(width, startX)),
    Math.max(0, Math.min(height, startY)),
    Math.max(0, Math.min(width, endX)),
    Math.max(0, Math.min(height, endY)),
  ];
}
