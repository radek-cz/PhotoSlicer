/** Retrieves the detected or edited regions associated with an image. */
import type { ProcessedImage } from "../../types/image";
import type { GetRegionsResult, ImageOperationsWorkerType } from "../../types/imageOperations";

/**
 * Reads the regions currently stored for an image.
 */
export const getImageRegions = async(
    task: Extract<ImageOperationsWorkerType, { taskType: "GET_IMAGE_REGIONS" }>,
        processedImages: Map<string, ProcessedImage>
): Promise<GetRegionsResult> => {
    const image = processedImages.get(task.payload.imageId);

    if (!image) {
        throw new Error(
            `Image with id ${task.payload.imageId} was not found`
        );
    }

    return {
        regions: image.regions ?? [],
    };
}