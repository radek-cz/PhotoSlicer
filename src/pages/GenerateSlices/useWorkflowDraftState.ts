import { useCallback, useEffect, useRef, useState } from "react";
import { revokeObjectUrls } from "../../lib/browserImageOperations";
import {
  importImageFiles,
  toPreviewImages,
} from "../../lib/imageWorkflow";
import {
  areWorkflowDraftsEnabled,
  workflowDraftRepository,
  onWorkflowDraftSettingsChanged,
  workflowStepIndex,
  type WorkflowDraft,
} from "../../lib/workflowDraft";
import type { PreviewImage } from "../../types/image";
import type { LoadImageResult } from "../../types/imageOperations";
import { imageOperationsWorkerService } from "../../services/imageOperationsWorkerService";

export function useWorkflowDraftState(selectedDraftId: string | null) {
  const [draft, setDraft] = useState<WorkflowDraft | null>(null);
  const draftRef = useRef(draft);
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);
  const previewImagesRef = useRef(previewImages);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [loadedDraftId, setLoadedDraftId] = useState<string | null>();
  const [hasDraftLoadError, setHasDraftLoadError] = useState(false);
  const [hasDraftSaveError, setHasDraftSaveError] = useState(false);
  const [hasDraftExpired, setHasDraftExpired] = useState(false);
  const [draftsEnabled, setDraftsEnabled] = useState(
    areWorkflowDraftsEnabled,
  );
  const isDraftReady = loadedDraftId === selectedDraftId;
  const activeDraftId = draft?.id;

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    const updateDraftsEnabled = () => {
      const enabled = areWorkflowDraftsEnabled();
      setDraftsEnabled(enabled);
      if (!enabled) setExpiresAt(null);
    };
    const unsubscribe = onWorkflowDraftSettingsChanged(updateDraftsEnabled);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const previousUrls = new Set(
      previewImagesRef.current.map((image) => image.blobUrl),
    );
    const nextUrls = new Set(previewImages.map((image) => image.blobUrl));
    revokeObjectUrls(
      [...previousUrls].filter((url) => !nextUrls.has(url)),
    );
    previewImagesRef.current = previewImages;
  }, [previewImages]);

  useEffect(
    () => () =>
      revokeObjectUrls(
        previewImagesRef.current.map((image) => image.blobUrl),
      ),
    [],
  );

  const persistDraft = useCallback(
    async (nextDraft: WorkflowDraft, touchActivity = true) => {
      if (!areWorkflowDraftsEnabled()) {
        setHasDraftSaveError(false);
        return true;
      }
      try {
        const savedDraft = await workflowDraftRepository.save(
          nextDraft,
          touchActivity,
        );
        setExpiresAt(savedDraft.expiresAt);
        setHasDraftSaveError(false);
        return true;
      } catch (error) {
        console.error("Couldn't save workflow draft", error);
        setHasDraftSaveError(true);
        return false;
      }
    },
    [],
  );

  const removeDraft = useCallback(async (id: string) => {
    try {
      await workflowDraftRepository.delete(id);
      setExpiresAt(null);
      setHasDraftSaveError(false);
      return true;
    } catch (error) {
      console.error("Couldn't delete workflow draft", error);
      setHasDraftSaveError(true);
      return false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const restoreDraft = async (): Promise<{
      draft: WorkflowDraft;
      loadedImages: LoadImageResult[];
    } | null> => {
      if (!selectedDraftId) return null;

      const savedDraft = await workflowDraftRepository.get(selectedDraftId);
      if (!savedDraft) return null;

      await imageOperationsWorkerService.clearProcessedImages();
      const importResults = await importImageFiles(
        savedDraft.images.map((image) => image.file),
      );
      const importErrors: unknown[] = [];
      for (const result of importResults) {
        if (result.status === "rejected") importErrors.push(result.reason);
      }
      if (importErrors.length > 0) {
        throw new AggregateError(importErrors, "Couldn't restore all images.");
      }
      const loadedImages = importResults.map((result) => {
        if (result.status === "rejected") throw result.reason;
        return result.value.image;
      });
      const restoredImages = await Promise.all(
        loadedImages.map(async (image, index) => {
          const savedImage = savedDraft.images[index];
          const regions = savedImage?.regions ?? image.regions;
          const savedRegions =
            await imageOperationsWorkerService.saveImageRegions(
              image.imageId,
              regions,
            );
          return {
            fileId: savedImage.fileId,
            file: savedImage.file,
            imageId: image.imageId,
            regions: savedRegions.regions,
          };
        }),
      );

      if (
        workflowStepIndex(savedDraft.availableThrough) >=
        workflowStepIndex("metadata")
      ) {
        await Promise.all(
          restoredImages.map((image) =>
            imageOperationsWorkerService.generateImageSlicePreviews(
              image.imageId,
              image.regions,
            ),
          ),
        );
      }

      return {
        draft: {
          ...savedDraft,
          images: restoredImages,
        },
        loadedImages,
      };
    };

    const initialize = async () => {
      try {
        if (selectedDraftId && !areWorkflowDraftsEnabled()) {
          setHasDraftExpired(true);
          setLoadedDraftId(selectedDraftId);
          return;
        }
        const result = await restoreDraft();
        if (cancelled) return;
        if (result) {
          setDraft(result.draft);
          setExpiresAt(result.draft.expiresAt);
          setPreviewImages(
            toPreviewImages(
              result.loadedImages.map((image, index) => ({
                ...image,
                regions: result.draft.images[index].regions,
              })),
              result.draft.images.map((image) => image.file),
            ),
          );
        } else {
          setDraft(null);
          setPreviewImages([]);
          setExpiresAt(null);
        }
        setHasDraftLoadError(false);
        setHasDraftExpired(false);
        setLoadedDraftId(selectedDraftId);
      } catch (error) {
        if (cancelled) return;
        console.error("Couldn't restore workflow draft", error);
        setDraft(null);
        setPreviewImages([]);
        setExpiresAt(null);
        setHasDraftLoadError(true);
        setLoadedDraftId(selectedDraftId);
      }
    };

    void initialize();
    return () => {
      cancelled = true;
    };
  }, [selectedDraftId]);

  useEffect(() => {
    if (
      !draftsEnabled ||
      activeDraftId === undefined ||
      expiresAt === null ||
      (selectedDraftId !== null && activeDraftId !== selectedDraftId)
    ) {
      return;
    }

    let activityTimeout: number | undefined;
    const recordActivity = () => {
      if (activityTimeout !== undefined) {
        window.clearTimeout(activityTimeout);
      }
      activityTimeout = window.setTimeout(() => {
        void workflowDraftRepository
          .touch(activeDraftId)
          .then((nextExpiresAt) => {
            if (nextExpiresAt !== undefined) setExpiresAt(nextExpiresAt);
          })
          .catch((error: unknown) => {
            console.error("Couldn't renew workflow draft activity", error);
            setHasDraftSaveError(true);
          });
      }, 250);
    };

    document.addEventListener("pointerdown", recordActivity);
    document.addEventListener("keydown", recordActivity);
    document.addEventListener("input", recordActivity);
    document.addEventListener("wheel", recordActivity, { passive: true });
    document.addEventListener("touchstart", recordActivity, { passive: true });

    return () => {
      if (activityTimeout !== undefined) {
        window.clearTimeout(activityTimeout);
      }
      document.removeEventListener("pointerdown", recordActivity);
      document.removeEventListener("keydown", recordActivity);
      document.removeEventListener("input", recordActivity);
      document.removeEventListener("wheel", recordActivity);
      document.removeEventListener("touchstart", recordActivity);
    };
  }, [
    activeDraftId,
    draftsEnabled,
    expiresAt,
    selectedDraftId,
  ]);

  useEffect(() => {
    if (
      activeDraftId === undefined ||
      expiresAt === null ||
      (selectedDraftId !== null && activeDraftId !== selectedDraftId)
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void (async () => {
        try {
          const expired = await workflowDraftRepository.expire(
            activeDraftId,
            expiresAt,
          );
          if (!expired) return;
          try {
            await imageOperationsWorkerService.clearProcessedImages();
          } catch (error) {
            console.error("Couldn't clear expired workflow images", error);
          }
          if (draftRef.current?.id === activeDraftId) {
            setDraft(null);
            setPreviewImages([]);
            setExpiresAt(null);
            setHasDraftExpired(true);
          }
        } catch (error) {
          console.error("Couldn't expire workflow draft", error);
        }
      })();
    }, Math.max(0, expiresAt - Date.now()));

    return () => window.clearTimeout(timeout);
  }, [activeDraftId, expiresAt, selectedDraftId]);

  return {
    draft,
    setDraft,
    previewImages,
    setPreviewImages,
    isDraftReady,
    hasDraftLoadError,
    setHasDraftLoadError,
    hasDraftSaveError,
    hasDraftExpired,
    setHasDraftExpired,
    persistDraft,
    removeDraft,
    expiresAt,
  };
}
