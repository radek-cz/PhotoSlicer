/** Prepares OpenCV matrices and extracts slices from processed images. */
import type { ProcessedImage } from "../../types/image";
import type { Region, RegionId } from "../../types/imageOperations";
import { getOpenCV } from "../opencv";
import { blobToMat } from "./opencvUtils";
import { extractImagesFromRegions } from "./sliceImagesUtil";

export const getSlicedPreviewImagesFromImage = async (image: ProcessedImage) => {
    const data = image.reducedImage;
    const regions = image.regions || [];

    return getSlicedImagesFromImage(data,regions);
}

export const getSlicedImagesFromImage = async (data: Blob, regions: Region[]) => {
    const cv = await getOpenCV();
    const mat = await blobToMat(data, cv);

    const images: Map<RegionId, Blob> = await extractImagesFromRegions(mat, regions, cv);

    return images;
}