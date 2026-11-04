import type {
  ImageMetadata,
  PreviewSlicedImagesObject,
  Region,
  RegionId,
} from "./imageOperations";

export interface ProcessedImage {
    originalImage: ImageBitmap;
    reducedImage: Blob;
    scale: number;
    regions?: Region[];
    previewSlicedImages?: Map<RegionId, Blob>;
    metadata?: Map<RegionId, ImageMetadata>;
}

export interface PreviewImage {
  blobUrl: string,
  imageId: string,
  fileName: string,
  scale: number,
  regions: Region[]
}

export interface SavedImageData {
  imageId: string;
  metadatas: Map<RegionId, ImageMetadata>;
}

export interface MetadataEditorImage extends PreviewSlicedImagesObject {
  blobUrls: Map<RegionId, string>;
  metadatas: Map<RegionId, ImageMetadata>;
}