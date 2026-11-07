/** Coordinates image import, preview generation, metadata updates, and export. */
import type {
  MetadataEditorImage,
  PreviewImage,
  SavedImageData,
} from "../types/image";
import type {
  ImageMetadata,
  LoadImageResult,
  Region,
  RegionId,
} from "../types/imageOperations";
import { imageOperationsWorkerService } from "../services/imageOperationsWorkerService";
import {
  createObjectUrl,
  createObjectUrls,
  createObjectUrlsById,
} from "./browserImageOperations";
import {
  createEmptyImageMetadata,
  normalizeImageMetadata,
} from "./imageMetadata";
import { readPhotoDetectionSettings } from "./imageOperations/photoDetectionSettings";

export async function importImageFiles(
  files: readonly File[],
): Promise<
  PromiseSettledResult<{ file: File; image: LoadImageResult }>[]
> {
  const detectionSettings = readPhotoDetectionSettings();
  return Promise.allSettled(
    files.map(async (file) => ({
      file,
      image: await imageOperationsWorkerService.importAndAnalyzeImage(
        await file.arrayBuffer(),
        detectionSettings,
      ),
    })),
  );
}

export function toPreviewImages(
  results: LoadImageResult[],
  files: readonly File[],
): PreviewImage[] {
  return results.map((image, index) => ({
    blobUrl: createObjectUrl(image.scaledImage),
    imageId: image.imageId,
    fileName: files[index]?.name ?? "",
    scale: image.scale,
    regions: image.regions,
  }));
}

export function buildMetadataByImage(
  data: SavedImageData[],
): Map<string, Map<RegionId, ImageMetadata>> {
  return new Map(data.map((item) => [item.imageId, item.metadatas]));
}

export async function generateSlicePreviewUrls(
  imageId: string,
  regions: Region[],
): Promise<string[]> {
  const result =
    await imageOperationsWorkerService.generateImageSlicePreviews(
      imageId,
      regions,
    );

  return createObjectUrls(result.images.values());
}

export async function loadMetadataEditorImages(
  initialMetadata: readonly SavedImageData[] = [],
): Promise<MetadataEditorImage[]> {
  const result =
    await imageOperationsWorkerService.getAllImageSlicePreviews();
  const metadataByImage = new Map(
    initialMetadata.map((image) => [image.imageId, image.metadatas]),
  );

  return result.preview.map((preview) => {
    const blobUrls = createObjectUrlsById(preview.images);
    const metadatas = new Map<RegionId, ImageMetadata>();
    const savedMetadata = metadataByImage.get(preview.imageId);

    for (const regionId of preview.images.keys()) {
      metadatas.set(
        regionId,
        normalizeImageMetadata(
          savedMetadata?.get(regionId) ?? createEmptyImageMetadata(),
        ),
      );
    }

    return {
      ...preview,
      blobUrls,
      metadatas,
    };
  });
}

export async function exportImageSlices(
  data: SavedImageData[],
  sourceFileNamesByImage: Map<string, string>,
): Promise<Blob> {
  const result = await imageOperationsWorkerService.exportImageSlicesAsZip(
    buildMetadataByImage(data),
    sourceFileNamesByImage,
  );

  return result.zip;
}

export function patchMetadataForImage(
  images: readonly MetadataEditorImage[],
  imageIndex: number,
  regionId: RegionId,
  patch: Partial<ImageMetadata>,
): MetadataEditorImage[] {
  return images.map((image, index) => {
    if (index !== imageIndex) {
      return image;
    }

    const metadatas = new Map(image.metadatas);
    metadatas.set(regionId, {
      ...normalizeImageMetadata(
        metadatas.get(regionId) ?? createEmptyImageMetadata(),
      ),
      ...patch,
    });

    return { ...image, metadatas };
  });
}

export function cloneSavedImageData(
  images: readonly {
    imageId: string;
    metadatas: ReadonlyMap<RegionId, ImageMetadata>;
  }[],
): SavedImageData[] {
  return images.map((image) => ({
    imageId: image.imageId,
    metadatas: new Map(
      Array.from(image.metadatas, ([regionId, metadata]) => [
        regionId,
        { ...normalizeImageMetadata(metadata) },
      ]),
    ),
  }));
}
