export type RegionId = string;

export type Rotation = 0 | 90 | 180 | 270;

export type MetadataDatePrecision = "exact" | "year" | "decade";

export interface Coord {
    x: number;
    y: number;
}

export interface Region {
    id: RegionId;
    upperLeft: Coord;
    upperRight: Coord;
    lowerRight: Coord;
    lowerLeft: Coord;
}

export interface ImageMetadata {
    title: string;
    description: string;
    rotation: Rotation;
    mirrorHorizontal?: boolean;
    datePrecision?: MetadataDatePrecision;
    dateValue?: string;
    dateValues?: Partial<Record<MetadataDatePrecision, string>>;
    people?: string[];
    locations?: string[];
    topics?: string[];
}

export type ImageOperationsWorkerType =
    | {
          taskId: string;
          taskType: "PING_WORKER";
          payload: {
          };
      }
    | {
          taskId: string;
          taskType: "IMPORT_AND_ANALYZE_IMAGE";
          payload: {
              buffer: ArrayBuffer;
          };
      }
    | {
          taskId: string;
          taskType: "DETECT_IMAGE_REGIONS";
          payload: {
              imageId: string;
          };
      }
    | {
          taskId: string;
          taskType: "SAVE_IMAGE_REGIONS";
          payload: {
              imageId: string;
              regions: Region[];
          };
      }
    | {
          taskId: string;
          taskType: "GET_IMAGE_REGIONS";
          payload: {
              imageId: string;
          };
      }
    | {
          taskId: string;
          taskType: "GENERATE_IMAGE_SLICE_PREVIEWS";
          payload: {
              imageId: string;
              regions: Region[];
          };
      }
    | {
          taskId: string;
          taskType: "GET_ALL_IMAGE_SLICE_PREVIEWS";
          payload: {
          };
      }
    | {
          taskId: string;
          taskType: "EXPORT_IMAGE_SLICES_AS_ZIP";
          payload: {
              metadataByImage: Map<string, Map<RegionId, ImageMetadata>>;
              sourceFileNamesByImage: Map<string, string>;
          };
      }
    | {
          taskId: string;
          taskType: "CLEAR_PROCESSED_IMAGES";
          payload: {};
      };

export type WorkerResponse =
    | {
          taskId: string;
          payload: PingPongResult;
      }
    | {
          taskId: string;
          payload: LoadImageResult;
      }
    | {
          taskId: string;
          payload: FindRegionsResult;
      }
    | {
          taskId: string;
          payload: UpdateRegionsResult;
      }
    | {
          taskId: string;
          payload: GeneratePreviewSlicedImagesResult;
      }
    | {
          taskId: string;
          payload: GetAllPreviewSlicedImagesResult;
      }
    | {
          taskId: string;
          payload: GenerateSlicedImagesResult;
      }
    | {
          taskId: string;
          payload: ClearResult;
      };

export interface PingPongResult {
    pong: string;
}
export interface LoadImageResult {
    imageId: string;
    scaledImage: Blob;
    scale: number;
    regions: Region[];
}

export interface FindRegionsResult {
    regions: Region[];
}

export interface UpdateRegionsResult {
    regions: Region[];
}

export interface GetRegionsResult {
    regions: Region[];
}

export interface GeneratePreviewSlicedImagesResult {
    images: Map<RegionId, Blob>;
}

export interface GetAllPreviewSlicedImagesResult {
    preview: PreviewSlicedImagesObject[];
}

export interface PreviewSlicedImagesObject {
        imageId: string;
        images: Map<RegionId, Blob>;
}

export interface GenerateSlicedImagesResult {
    zip: Blob;
}

export interface ClearResult {}