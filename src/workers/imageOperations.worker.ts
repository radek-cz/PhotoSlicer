/// <reference lib="webworker" />

import { detectImageRegions } from "../lib/imageOperations/detectImageRegions";
import { exportImageSlicesAsZip } from "../lib/imageOperations/exportImageSlicesAsZip";
import { generateImageSlicePreviews } from "../lib/imageOperations/generateImageSlicePreviews";
import { getAllImageSlicePreviews } from "../lib/imageOperations/getAllImageSlicePreviews";
import { getImageRegions } from "../lib/imageOperations/getImageRegions";
import { importAndAnalyzeImage } from "../lib/imageOperations/importAndAnalyzeImage";
import { saveImageRegions } from "../lib/imageOperations/saveImageRegions";
import type { ProcessedImage } from "../types/image";
import type { ImageOperationsWorkerType, PingPongResult } from "../types/imageOperations";

const processedImages = new Map<string, ProcessedImage>();
console.log("[worker] plik załadowany");

self.onmessage = async (
    event: MessageEvent<ImageOperationsWorkerType>
) => {
    const task = event.data;
    try {
        switch (task.taskType) {
            case "PING_WORKER": {
                self.postMessage({
                  taskId: task.taskId,
                  payload: {
                    pong: "pong"
                  } as PingPongResult
                })

                break;
            }
            case "IMPORT_AND_ANALYZE_IMAGE": {
                const result = await importAndAnalyzeImage(task, processedImages);

                self.postMessage({
                  taskId: task.taskId,
                  payload: {
                    ...result
                  }
                });

                break;
            }

            case "DETECT_IMAGE_REGIONS": {
                const result = await detectImageRegions(task, processedImages);

                self.postMessage({
                  taskId: task.taskId,
                  payload: {
                    ...result
                  }
                });

                break;
            }

            case "SAVE_IMAGE_REGIONS": {
                const result = await saveImageRegions(task, processedImages);

                self.postMessage({
                  taskId: task.taskId,
                  payload: {
                    ...result
                  }
                });

                break;
            }

            case "GET_IMAGE_REGIONS": {
                const result = await getImageRegions(task, processedImages);

                self.postMessage({
                  taskId: task.taskId,
                  payload: {
                    ...result
                  }
                });

                break;
            }

            case "GENERATE_IMAGE_SLICE_PREVIEWS": {
                const result = await generateImageSlicePreviews(task, processedImages);

                self.postMessage({
                  taskId: task.taskId,
                  payload: {
                    ...result
                  }
                });

                break;
            }

            case "GET_ALL_IMAGE_SLICE_PREVIEWS": {
                const result = await getAllImageSlicePreviews(task, processedImages);

                self.postMessage({
                  taskId: task.taskId,
                  payload: {
                    ...result
                  }
                });

                break;
            }

            case "EXPORT_IMAGE_SLICES_AS_ZIP": {
                const result = await exportImageSlicesAsZip(task, processedImages);

                self.postMessage({
                  taskId: task.taskId,
                  payload: {
                    ...result
                  }
                });

                break;
            }

            case "CLEAR_PROCESSED_IMAGES": {
                processedImages.clear();

                self.postMessage({
                    taskId: task.taskId,
                    payload: {},
                });

                break;
            }

            default: {
                const exhaustiveCheck: never = task;
                throw new Error(
                    `Unsupported worker task: ${JSON.stringify(exhaustiveCheck)}`
                );
            }
        }
    } catch (error) {
        self.postMessage({
            taskId: task.taskId,
            error: error instanceof Error
                ? error.message
                : String(error),
        });
    }
};
