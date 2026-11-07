/** Detects photo regions in a processed image using OpenCV. */
import type { ProcessedImage } from "../../types/image";
import type { FindRegionsResult, ImageOperationsWorkerType, PhotoDetectionSettings, Region } from "../../types/imageOperations";
import { getOpenCV } from "../opencv";
import { findPhotos } from "./findPhotos";
import { blobToMat } from "./opencvUtils";

export async function detectImageRegions(
    task: Extract<ImageOperationsWorkerType, { taskType: "DETECT_IMAGE_REGIONS" }>,
    processedImages: Map<string, ProcessedImage>
): Promise<FindRegionsResult> {
    const image = processedImages.get(task.payload.imageId);

    if (!image) {
        throw new Error(
            `Image with id ${task.payload.imageId} was not found`
        );
    }

    const regions: Region[] = await detectRegionsInImage(
        image,
        task.payload.detectionSettings,
    );

    return {
        regions
    };
}


export const detectRegionsInImage = async (
    processedImage: ProcessedImage,
    settings: PhotoDetectionSettings,
): Promise<Region[]> => {
    const cv = await getOpenCV();
    const mat = await blobToMat(processedImage.reducedImage, cv);
    
    const regions: Region[] = [];
    try {
        const photos = findPhotos(mat, cv, settings);

        for(const photo of photos) {
            const upperLeft = photo[0];
            const upperRight = photo[1];
            const lowerRight = photo[2];
            const lowerLeft = photo[3];
            regions.push({
                id: crypto.randomUUID(),
                upperLeft: upperLeft,
                upperRight: upperRight,
                lowerRight: lowerRight,
                lowerLeft: lowerLeft,
            })
        }
    } finally {
        mat.delete();
    }

    return regions;
}
