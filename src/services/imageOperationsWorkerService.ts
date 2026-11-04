import type {
    ImageOperationsWorkerType,
    WorkerResponse,
    LoadImageResult,
    FindRegionsResult,
    UpdateRegionsResult,
    GeneratePreviewSlicedImagesResult,
    GenerateSlicedImagesResult,
    ClearResult,
    Region,
    RegionId,
    ImageMetadata,
    GetRegionsResult,
    PingPongResult,
    GetAllPreviewSlicedImagesResult,
} from "../types/imageOperations";

type WorkerErrorResponse = {
    taskId: string;
    error: string;
};

type PendingRequest = {
    resolve: (value: WorkerResponse["payload"]) => void;
    reject: (reason?: unknown) => void;
};

class ImageOperationsWorkerService {
    private readonly worker: Worker;

    private readonly pendingRequests = new Map<
        string,
        PendingRequest
    >();

    constructor() {
        console.log("aaa");
        this.worker = new Worker(
            new URL(
                "../workers/imageOperations.worker.ts",
                import.meta.url
            ),
            {
                type: "module",
            }
        );
        this.worker.onmessage = this.handleMessage;
        this.worker.onerror = this.handleWorkerError;
        this.worker.onmessageerror = this.handleMessageError;
    }

    private readonly handleMessage = (
        event: MessageEvent<
            WorkerResponse | WorkerErrorResponse
        >
    ): void => {
        const data = event.data;

        console.log("data", data);
        const pending = this.pendingRequests.get(data.taskId);

        if (!pending) {
            console.warn(
                `Received response for unknown task: ${data.taskId}`
            );

            return;
        }

        this.pendingRequests.delete(data.taskId);

        if ("error" in data) {
            pending.reject(new Error(data.error));
            return;
        }

        pending.resolve(data.payload);
    };

    private readonly handleWorkerError = (
        event: ErrorEvent
    ): void => {
        const error =
            event.error ?? new Error(event.message);

        for (const [, pending] of this.pendingRequests) {
            pending.reject(error);
        }

        this.pendingRequests.clear();
    };

    private readonly handleMessageError = (): void => {
        const error = new Error(
            "Failed to deserialize message from image operations worker"
        );

        for (const [, pending] of this.pendingRequests) {
            pending.reject(error);
        }

        this.pendingRequests.clear();
    };

    private send<
        TTask extends ImageOperationsWorkerType,
        TResult extends WorkerResponse["payload"]
    >(
        task: Omit<TTask, "taskId">,
        transferables: Transferable[] = []
    ): Promise<TResult> {
        const taskId = crypto.randomUUID();
        console.log("Sending ", taskId);
        const message = {
            ...task,
            taskId,
        } as TTask; 

        return new Promise<TResult>((resolve, reject) => {
            this.pendingRequests.set(taskId, {
                resolve: resolve as (
                    value: WorkerResponse["payload"]
                ) => void,
                reject,
            });

            try {
                console.log("aaa222");
                this.worker.postMessage(
                    message,
                    transferables
                );
                console.log("bbbb");
            } catch (error) {
                this.pendingRequests.delete(taskId);
                reject(error);
            }
        });
    }

    async pingWorker(): Promise<PingPongResult> {
        return this.send<
            Extract<
                ImageOperationsWorkerType,
                { taskType: "PING_WORKER" }
            >,
            PingPongResult
        >({
            taskType: "PING_WORKER",
            payload: {
            },
        });
    }

    async importAndAnalyzeImage(
        buffer: ArrayBuffer
    ): Promise<LoadImageResult> {
        return this.send<
            Extract<
                ImageOperationsWorkerType,
                { taskType: "IMPORT_AND_ANALYZE_IMAGE" }
            >,
            LoadImageResult
        >(
            {
                taskType: "IMPORT_AND_ANALYZE_IMAGE",
                payload: {
                    buffer,
                },
            },
            [buffer]
        );
    }

    async detectImageRegions(
        imageId: string
    ): Promise<FindRegionsResult> {
        return this.send<
            Extract<
                ImageOperationsWorkerType,
                { taskType: "DETECT_IMAGE_REGIONS" }
            >,
            FindRegionsResult
        >({
            taskType: "DETECT_IMAGE_REGIONS",
            payload: {
                imageId,
            },
        });
    }

    async saveImageRegions(
        imageId: string,
        regions: Region[]
    ): Promise<UpdateRegionsResult> {
        return this.send<
            Extract<
                ImageOperationsWorkerType,
                { taskType: "SAVE_IMAGE_REGIONS" }
            >,
            UpdateRegionsResult
        >({
            taskType: "SAVE_IMAGE_REGIONS",
            payload: {
                imageId,
                regions,
            },
        });
    }

    async getImageRegions(
        imageId: string
    ): Promise<GetRegionsResult> {
        return this.send<
            Extract<
                ImageOperationsWorkerType,
                { taskType: "GET_IMAGE_REGIONS" }
            >,
            GetRegionsResult
        >({
            taskType: "GET_IMAGE_REGIONS",
            payload: {
                imageId
            },
        });
    }

    async generateImageSlicePreviews(
        imageId: string,
        regions: Region[]
    ): Promise<GeneratePreviewSlicedImagesResult> {
        return this.send<
            Extract<
                ImageOperationsWorkerType,
                { taskType: "GENERATE_IMAGE_SLICE_PREVIEWS" }
            >,
            GeneratePreviewSlicedImagesResult
        >({
            taskType: "GENERATE_IMAGE_SLICE_PREVIEWS",
            payload: {
                imageId,
                regions,
            },
        });
    }

    async getAllImageSlicePreviews(
    ): Promise<GetAllPreviewSlicedImagesResult> {
        return this.send<
            Extract<
                ImageOperationsWorkerType,
                { taskType: "GET_ALL_IMAGE_SLICE_PREVIEWS" }
            >,
            GetAllPreviewSlicedImagesResult
        >({
            taskType: "GET_ALL_IMAGE_SLICE_PREVIEWS",
            payload: {
            },
        });
    }

    async exportImageSlicesAsZip(
        metadataByImage: Map<string, Map<RegionId, ImageMetadata>>,
        sourceFileNamesByImage: Map<string, string>,
    ): Promise<GenerateSlicedImagesResult> {
        return this.send<
            Extract<
                ImageOperationsWorkerType,
                { taskType: "EXPORT_IMAGE_SLICES_AS_ZIP" }
            >,
            GenerateSlicedImagesResult
        >({
            taskType: "EXPORT_IMAGE_SLICES_AS_ZIP",
            payload: {
                metadataByImage,
                sourceFileNamesByImage,
            },
        });
    }

    async clearProcessedImages(): Promise<ClearResult> {
        return this.send<
            Extract<
                ImageOperationsWorkerType,
                { taskType: "CLEAR_PROCESSED_IMAGES" }
            >,
            ClearResult
        >({
            taskType: "CLEAR_PROCESSED_IMAGES",
            payload: {},
        });
    }

    terminate(): void {
        for (const [, pending] of this.pendingRequests) {
            pending.reject(
                new Error(
                    "Image operations worker was terminated"
                )
            );
        }

        this.pendingRequests.clear();
        this.worker.terminate();
    }
}

export const imageOperationsWorkerService =
    new ImageOperationsWorkerService();