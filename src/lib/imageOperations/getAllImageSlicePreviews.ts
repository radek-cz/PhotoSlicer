/** Loads slice previews for every image, generating and caching missing previews. */
import type { ProcessedImage } from "../../types/image";
import type { GetAllPreviewSlicedImagesResult, ImageOperationsWorkerType, PreviewSlicedImagesObject } from "../../types/imageOperations";
import { getSlicedPreviewImagesFromImage } from "./slicesUtil";

export async function getAllImageSlicePreviews(
    _task: Extract<
        ImageOperationsWorkerType,
        { taskType: "GET_ALL_IMAGE_SLICE_PREVIEWS" }
    >,
    processedImages: Map<string, ProcessedImage>
): Promise<GetAllPreviewSlicedImagesResult> {
    const result = await Promise.all([...processedImages.entries()]
    .map(async ([key, image]) => {
        return {
            imageId: key,
            images: await getPreviewSlices(image)
        } as PreviewSlicedImagesObject
    }));

    return {
        preview: result
    };
}

const getPreviewSlices = async (image: ProcessedImage) => {
    if(!image.previewSlicedImages) {
        image.previewSlicedImages = await getSlicedPreviewImagesFromImage(image);
    }

    return image.previewSlicedImages;
}