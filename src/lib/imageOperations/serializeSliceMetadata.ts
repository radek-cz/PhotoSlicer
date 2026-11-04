/** Creates unique slice filenames and serializes metadata for exported slices. */
import type {
  ImageMetadata,
  RegionId,
} from "../../types/imageOperations";
import { normalizeImageMetadata } from "../imageMetadata";
import { slugify } from "transliteration";

export type SliceFileNames = Map<string, Map<RegionId, string>>;

export function createSliceFileNames(
  metadataByImage: Map<string, Map<RegionId, ImageMetadata>>,
): SliceFileNames {
  const fileNames: SliceFileNames = new Map();
  const usedFileNames = new Set<string>();

  for (const [imageId, metadatas] of metadataByImage) {
    const imageFileNames = new Map<RegionId, string>();
    for (const [regionId, metadata] of metadatas) {
      const baseName = slugify(metadata.title) || slugify(regionId) || "region";
      let fileName = `${baseName}.jpg`;
      let suffix = 2;
      while (usedFileNames.has(fileName.toLocaleLowerCase())) {
        const uniqueBase = `${baseName}-${slugify(regionId) || "region"}`;
        fileName = `${uniqueBase}${suffix === 2 ? "" : `-${suffix}`}.jpg`;
        suffix += 1;
      }
      usedFileNames.add(fileName.toLocaleLowerCase());
      imageFileNames.set(regionId, fileName);
    }
    fileNames.set(imageId, imageFileNames);
  }

  return fileNames;
}

export function serializeSliceMetadata(
  metadataByImage: Map<string, Map<RegionId, ImageMetadata>>,
  fileNames: SliceFileNames = createSliceFileNames(metadataByImage),
): string {
  const records = Array.from(metadataByImage, ([imageId, metadatas]) =>
    Array.from(metadatas, ([regionId, metadata]) => {
      const fileName = fileNames.get(imageId)?.get(regionId);
      if (!fileName) {
        throw new Error(`Missing exported filename for region "${regionId}".`);
      }
      return {
        imageId,
        regionId,
        fileName,
        ...normalizeImageMetadata(metadata),
      };
    }),
  ).flat();

  return JSON.stringify(records, null, 2);
}
