/** Stores updated region coordinates for a processed image. */
import type { ProcessedImage } from "../../types/image";
import type { ImageOperationsWorkerType, UpdateRegionsResult } from "../../types/imageOperations";

/**
 * Saves the regions currently associated with an image.
 */
export const saveImageRegions = async(
    task: Extract<ImageOperationsWorkerType, { taskType: "SAVE_IMAGE_REGIONS" }>,
        processedImages: Map<string, ProcessedImage>
): Promise<UpdateRegionsResult> => {
    const image = processedImages.get(task.payload.imageId);

    if (!image) {
        throw new Error(
            `Image with id ${task.payload.imageId} was not found`
        );
    }

    image.regions = task.payload.regions;
    
    return {
        regions: task.payload.regions,
    };
}