import type {
  ImageMetadata,
  MetadataDatePrecision,
  Rotation,
  RegionId,
} from "../../../types/imageOperations";
import type { MetadataEditorImage } from "../../../types/image";
import { createEmptyImageMetadata } from "../../../lib/imageMetadata";

export type MetadataFilter = "all" | "incomplete" | "complete";

export interface MetadataRecord {
  image: MetadataEditorImage;
  imageIndex: number;
  regionId: RegionId;
  metadata: ImageMetadata;
  previewUrl: string;
}

export interface OrientationTarget {
  rotation: Rotation;
  mirrorHorizontal: boolean;
}

export function getMetadataRecords(
  images: MetadataEditorImage[],
): MetadataRecord[] {
  return images.flatMap((image, imageIndex) =>
    Array.from(image.blobUrls, ([regionId, previewUrl]) => ({
      image,
      imageIndex,
      regionId,
      previewUrl,
      metadata: image.metadatas.get(regionId) ?? createEmptyImageMetadata(),
    })),
  );
}

export function isMetadataComplete(metadata: ImageMetadata): boolean {
  return metadata.title.trim().length > 0;
}

export function getMetadataCounts(images: MetadataEditorImage[]) {
  const records = getMetadataRecords(images);
  const complete = records.filter(({ metadata }) =>
    isMetadataComplete(metadata),
  ).length;
  return { total: records.length, complete, incomplete: records.length - complete };
}

export function filterMetadataRecords(
  records: MetadataRecord[],
  filter: MetadataFilter,
): MetadataRecord[] {
  if (filter === "all") return records;
  return records.filter(({ metadata }) =>
    filter === "complete"
      ? isMetadataComplete(metadata)
      : !isMetadataComplete(metadata),
  );
}

export function metadataRecordId(
  imageId: string,
  regionId: RegionId,
): string {
  return `${imageId}:${regionId}`;
}

export function getNextRotation(
  rotation: Rotation,
  direction: -90 | 90 | 180,
): Rotation {
  return ((rotation + direction + 360) % 360) as Rotation;
}

export function getOrientationTarget(
  metadata: ImageMetadata,
  direction: -90 | 90 | 180,
): OrientationTarget {
  return {
    rotation: getNextRotation(metadata.rotation, direction),
    mirrorHorizontal: metadata.mirrorHorizontal ?? false,
  };
}

export function resetOrientation(): OrientationTarget {
  return { rotation: 0, mirrorHorizontal: false };
}

export function toggleMirror(
  metadata: ImageMetadata,
): OrientationTarget {
  return {
    rotation: metadata.rotation,
    mirrorHorizontal: !(metadata.mirrorHorizontal ?? false),
  };
}

export function getDatePrecision(
  precision: MetadataDatePrecision | undefined,
): MetadataDatePrecision {
  return precision ?? "exact";
}

export function getDateValue(
  metadata: ImageMetadata,
  precision: MetadataDatePrecision,
): string {
  return metadata.dateValues?.[precision] ??
    (metadata.datePrecision === precision ? metadata.dateValue : "") ??
    "";
}
