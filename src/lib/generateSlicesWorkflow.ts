/** Creates workflow drafts and prepares their metadata and export data. */
import type { SavedImageData } from "../types/image";
import type {
  ImageMetadata,
  LoadImageResult,
  Region,
  RegionId,
} from "../types/imageOperations";
import { imageOperationsWorkerService } from "../services/imageOperationsWorkerService";
import {
  WORKFLOW_DRAFT_TTL_MS,
  workflowStepIndex,
  type WorkflowDraft,
  type WorkflowDraftImage,
} from "./workflowDraft";
import { exportImageSlices } from "./imageWorkflow";

export interface WorkflowExportDetails {
  filename: string;
  size: number;
  cropCount: number;
}

export function createWorkflowDraft(
  files: readonly File[],
  loadedImages: readonly LoadImageResult[],
): WorkflowDraft {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    version: 1,
    createdAt: now,
    lastActivityAt: now,
    expiresAt: now + WORKFLOW_DRAFT_TTL_MS,
    updatedAt: now,
    step: "regions",
    availableThrough: "regions",
    images: loadedImages.map((image, index) => ({
      fileId: crypto.randomUUID(),
      file: files[index],
      imageId: image.imageId,
      regions: image.regions,
    })),
    metadata: [],
    exportedZip: null,
    isEnded: false,
  };
}

export function getDraftMetadata(draft: WorkflowDraft): SavedImageData[] {
  return draft.images.map((image, index) => ({
    imageId: image.imageId,
    metadatas: new Map(draft.metadata[index] ?? []),
  }));
}

export function serializeMetadataForImages(
  images: readonly WorkflowDraftImage[],
  data: readonly SavedImageData[],
): WorkflowDraft["metadata"] {
  return images.map((image) => {
    const imageData = data.find((item) => item.imageId === image.imageId);
    return imageData
      ? Array.from(imageData.metadatas, ([regionId, value]) => [
          regionId,
          { ...value },
        ] as [RegionId, ImageMetadata])
      : [];
  });
}

export function updateDraftRegions(
  current: WorkflowDraft | null,
  imageId: string,
  regions: Region[],
): WorkflowDraft | null {
  if (!current) return current;
  const index = current.images.findIndex((image) => image.imageId === imageId);
  if (index < 0) return current;
  if (
    JSON.stringify(current.images[index].regions) === JSON.stringify(regions)
  ) {
    return current;
  }

  return {
    ...current,
    images: current.images.map((image, imageIndex) =>
      imageIndex === index ? { ...image, regions } : image,
    ),
    metadata: [],
    exportedZip: null,
    availableThrough:
      workflowStepIndex(current.availableThrough) >
      workflowStepIndex("regions")
        ? "regions"
        : current.availableThrough,
  };
}

export function updateDraftMetadata(
  current: WorkflowDraft | null,
  data: SavedImageData[],
): WorkflowDraft | null {
  if (!current) return current;
  const metadata = serializeMetadataForImages(current.images, data);
  if (JSON.stringify(current.metadata) === JSON.stringify(metadata)) {
    return current;
  }

  return {
    ...current,
    metadata,
    exportedZip: null,
    availableThrough:
      current.availableThrough === "export"
        ? "metadata"
        : current.availableThrough,
  };
}

export async function prepareWorkflowMetadataEditor(
  images: readonly WorkflowDraftImage[],
): Promise<void> {
  await Promise.all(
    images.map(async (image) => {
      await imageOperationsWorkerService.saveImageRegions(
        image.imageId,
        image.regions,
      );
      await imageOperationsWorkerService.generateImageSlicePreviews(
        image.imageId,
        image.regions,
      );
    }),
  );
}

export async function generateWorkflowExport(
  draft: WorkflowDraft,
): Promise<Blob> {
  const sourceFileNamesByImage = new Map(
    draft.images.map((image) => [image.imageId, image.file.name]),
  );
  return exportImageSlices(getDraftMetadata(draft), sourceFileNamesByImage);
}

export function getWorkflowExportDetails(
  draft: WorkflowDraft | null,
): WorkflowExportDetails | null {
  if (!draft?.exportedZip) return null;
  return {
    filename: "photoslicer-export.zip",
    size: draft.exportedZip.size,
    cropCount: draft.images.reduce(
      (total, image) => total + image.regions.length,
      0,
    ),
  };
}

export async function createArchiveSessionData(
  draft: WorkflowDraft,
  exportDetails: WorkflowExportDetails,
) {
  if (!draft.exportedZip) {
    throw new Error("Cannot save an archive session without an exported ZIP");
  }
  return {
    createdAt: Date.now(),
    filename: exportDetails.filename,
    zipData: await draft.exportedZip.arrayBuffer(),
    zipSize: draft.exportedZip.size,
    cropCount: exportDetails.cropCount,
    images: await Promise.all(
      draft.images.map(async (image, index) => ({
        fileName: image.file.name,
        fileData: await image.file.arrayBuffer(),
        fileType: image.file.type,
        regions: image.regions.map((region) => ({
          ...region,
          upperLeft: { ...region.upperLeft },
          upperRight: { ...region.upperRight },
          lowerRight: { ...region.lowerRight },
          lowerLeft: { ...region.lowerLeft },
        })),
        metadata: (draft.metadata[index] ?? []).map(
          ([regionId, metadata]) => [regionId, { ...metadata }] as [
            RegionId,
            ImageMetadata,
          ],
        ),
      })),
    ),
  };
}
