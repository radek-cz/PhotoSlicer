/** Generates and caches low-resolution previews for the requested image regions. */
import type { ProcessedImage } from "../../types/image";
import type { GeneratePreviewSlicedImagesResult, ImageOperationsWorkerType, RegionId } from "../../types/imageOperations";

import { getSlicedPreviewImagesFromImage } from "./slicesUtil";

export async function generateImageSlicePreviews(
    task: Extract<
        ImageOperationsWorkerType,
        { taskType: "GENERATE_IMAGE_SLICE_PREVIEWS" }
    >,
    processedImages: Map<string, ProcessedImage>
): Promise<GeneratePreviewSlicedImagesResult> {
    const image = processedImages.get(task.payload.imageId);

    if (!image) {
        throw new Error(
            `Image with id ${task.payload.imageId} was not found`
        );
    }

    const images: Map<RegionId, Blob> = await getSlicedPreviewImagesFromImage(image)

    image.previewSlicedImages = images;

    return {
        images
    };
}