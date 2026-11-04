/** Creates and normalizes image metadata with defaults for optional fields. */
import type { ImageMetadata } from "../types/imageOperations";

export function createEmptyImageMetadata(): ImageMetadata {
  return {
    title: "",
    description: "",
    rotation: 0,
    mirrorHorizontal: false,
    datePrecision: "exact",
    dateValue: "",
    dateValues: {},
    people: [],
    locations: [],
    topics: [],
  };
}

export function normalizeImageMetadata(
  metadata: ImageMetadata,
): ImageMetadata {
  const datePrecision = metadata.datePrecision ?? "exact";
  const dateValue = metadata.dateValue ?? "";
  return {
    ...createEmptyImageMetadata(),
    ...metadata,
    mirrorHorizontal: metadata.mirrorHorizontal ?? false,
    datePrecision,
    dateValue,
    dateValues: metadata.dateValues ?? (
      dateValue
        ? { [datePrecision]: dateValue }
        : {}
    ),
    people: metadata.people ?? [],
    locations: metadata.locations ?? [],
    topics: metadata.topics ?? [],
  };
}
