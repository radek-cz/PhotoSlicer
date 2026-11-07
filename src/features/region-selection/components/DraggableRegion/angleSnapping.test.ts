import { describe, expect, it } from "vitest";
import {
  getAngleGuidePoints,
  snapDeltaToAngle,
} from "./angleSnapping";

describe("snapDeltaToAngle", () => {
  it("returns no direction for a zero-length drag", () => {
    expect(snapDeltaToAngle({ x: 0, y: 0 })).toBeNull();
  });

  it.each([
    [{ x: 10, y: 1 }, 0],
    [{ x: 10, y: 10 }, 45],
    [{ x: 1, y: 10 }, 90],
    [{ x: -10, y: 10 }, 135],
    [{ x: -10, y: -10 }, -135],
    [{ x: 10, y: -10 }, -45],
  ])("snaps %o to %i degrees", (delta, expectedDegrees) => {
    const result = snapDeltaToAngle(delta);

    expect(result).not.toBeNull();
    expect((result!.angle * 180) / Math.PI).toBeCloseTo(expectedDegrees);
    expect(Math.hypot(result!.delta.x, result!.delta.y)).toBeCloseTo(
      Math.hypot(delta.x, delta.y),
    );
  });

  it("uses the nearest 15-degree direction at a boundary", () => {
    const result = snapDeltaToAngle({
      x: Math.cos((7.4 * Math.PI) / 180),
      y: Math.sin((7.4 * Math.PI) / 180),
    });

    expect(result?.angle).toBeCloseTo(0);
  });
});

describe("getAngleGuidePoints", () => {
  it("returns the full horizontal guide across the canvas", () => {
    expect(getAngleGuidePoints({ x: 50, y: 40 }, 0, 100, 80)).toEqual([
      0, 40, 100, 40,
    ]);
  });

  it("clips diagonal guides to the canvas bounds", () => {
    const points = getAngleGuidePoints(
      { x: 50, y: 40 },
      Math.PI / 4,
      100,
      80,
    );

    expect(points?.[0]).toBeCloseTo(10);
    expect(points?.[1]).toBeCloseTo(0);
    expect(points?.[2]).toBeCloseTo(90);
    expect(points?.[3]).toBeCloseTo(80);
  });

  it("returns null when the line does not intersect the canvas", () => {
    expect(
      getAngleGuidePoints({ x: -10, y: 10 }, Math.PI / 2, 100, 80),
    ).toBeNull();
  });
});
