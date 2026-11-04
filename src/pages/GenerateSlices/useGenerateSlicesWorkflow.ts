import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { downloadBlob } from "../../lib/browserImageOperations";
import { toPreviewImages } from "../../lib/imageWorkflow";
import {
  createArchiveSessionData,
  createWorkflowDraft,
  generateWorkflowExport,
  getDraftMetadata,
  getWorkflowExportDetails,
  prepareWorkflowMetadataEditor,
  serializeMetadataForImages,
  updateDraftMetadata,
  updateDraftRegions,
} from "../../lib/generateSlicesWorkflow";
import { archiveSessionRepository } from "../../features/archive-sessions/services/archiveSessionRepository";
import { imageOperationsWorkerService } from "../../services/imageOperationsWorkerService";
import {
  workflowStepIndex,
  type WorkflowDraft,
  type WorkflowStep,
} from "../../lib/workflowDraft";
import type { PreviewImage, SavedImageData } from "../../types/image";
import type {
  LoadImageResult,
  Region,
} from "../../types/imageOperations";
import { useWorkflowDraftState } from "./useWorkflowDraftState";

export interface GenerateSlicesContext {
  handleUploadComplete: (
    files: File[],
    loadedImages: LoadImageResult[],
  ) => Promise<void>;
  previewImages: PreviewImage[];
  handleRegionsChange: (imageId: string, regions: Region[]) => void;
  handleSelectRegionsComplete: () => Promise<void>;
  initialMetadata: SavedImageData[];
  saveMetadataToDraft: (data: SavedImageData[]) => void;
  handleMetadataSave: (data: SavedImageData[]) => Promise<void>;
  exportStatus: "idle" | "generating" | "success" | "error";
  exportDetails: { filename: string; size: number; cropCount: number } | null;
  hasDownloadError: boolean;
  archiveSaveStatus: "idle" | "saving" | "saved" | "error";
  retryExport: () => Promise<void>;
  downloadArchive: () => void;
  saveArchiveSession: () => Promise<void>;
  startImport: () => Promise<boolean>;
  resumeWorkflowDraft: (id: string, step: WorkflowStep) => void;
}

function workflowStepFromPath(pathname: string): WorkflowStep {
  const step = pathname.split("/").at(-1);
  return step === "regions" || step === "metadata" || step === "export"
    ? step
    : "upload";
}

function workflowPath(step: WorkflowStep, draftId?: string): string {
  const path = `/generate/${step}`;
  return draftId ? `${path}?draft=${encodeURIComponent(draftId)}` : path;
}

export function useGenerateSlicesWorkflow() {
  const location = useLocation();
  const navigate = useNavigate();
  const requestedDraftId = new URLSearchParams(location.search).get("draft");
  const {
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
  } = useWorkflowDraftState(requestedDraftId);
  const [exportStatus, setExportStatus] = useState<
    "idle" | "generating" | "success" | "error"
  >("idle");
  const [hasDownloadError, setHasDownloadError] = useState(false);
  const [archiveSaveStatus, setArchiveSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const exportInProgress = useRef(false);
  const isFinalizingExport = useRef(false);
  const [hasPreviewError, setHasPreviewError] = useState(false);
  const previousPathname = useRef(location.pathname);

  const requestedStep = workflowStepFromPath(location.pathname);

  const startImport = useCallback(async () => {
    if (draft) {
      const saved = draft.isEnded
        ? await removeDraft(draft.id)
        : await persistDraft(draft);
      if (!saved) return false;
    }
    try {
      await imageOperationsWorkerService.clearProcessedImages();
      setDraft(null);
      setPreviewImages([]);
      setHasDraftExpired(false);
      return true;
    } catch (error) {
      console.error("Couldn't clear worker before starting a new import", error);
      setHasDraftLoadError(true);
      return false;
    }
  }, [
    draft,
    persistDraft,
    removeDraft,
    setDraft,
    setPreviewImages,
    setHasDraftExpired,
    setHasDraftLoadError,
  ]);

  const resumeWorkflowDraft = useCallback(
    (id: string, step: WorkflowStep) => {
      navigate(workflowPath(step, id));
    },
    [navigate],
  );

  useEffect(() => {
    if (
      !isDraftReady ||
      requestedDraftId === null ||
      draft !== null ||
      hasDraftLoadError
    ) {
      return;
    }
    navigate("/", { replace: true });
  }, [
    draft,
    hasDraftLoadError,
    isDraftReady,
    navigate,
    requestedDraftId,
  ]);

  useEffect(() => {
    if (
      !isDraftReady ||
      location.pathname === "/" ||
      (requestedDraftId !== null && draft?.id !== requestedDraftId)
    ) {
      return;
    }

    const isAvailable =
      requestedStep === "upload" ||
      (draft !== null &&
        workflowStepIndex(requestedStep) <=
          workflowStepIndex(draft.availableThrough));
    if (!isAvailable) {
      const step = draft?.availableThrough ?? "upload";
      navigate(workflowPath(step, requestedDraftId ?? undefined), {
        replace: true,
      });
    }
  }, [
    draft,
    isDraftReady,
    location.pathname,
    navigate,
    requestedDraftId,
    requestedStep,
  ]);

  useEffect(() => {
    const previousPath = previousPathname.current;
    previousPathname.current = location.pathname;
    if (
      previousPath === "/generate/export" &&
      location.pathname !== "/generate/export"
    ) {
      isFinalizingExport.current = false;
    }
    if (
      location.pathname !== "/" ||
      !previousPath.startsWith("/generate/") ||
      !draft
    ) {
      return;
    }
    const leavingExport = previousPath === "/generate/export";

    void (async () => {
      const saved = draft.isEnded
        ? await removeDraft(draft.id)
        : leavingExport || (await persistDraft(draft));
      if (!saved) return;
      try {
        await imageOperationsWorkerService.clearProcessedImages();
        setDraft(null);
        setPreviewImages([]);
      } catch (error) {
        console.error("Couldn't clear worker after leaving the workflow", error);
        setHasDraftLoadError(true);
      }
    })();
  }, [
    draft,
    location.pathname,
    persistDraft,
    removeDraft,
    setDraft,
    setHasDraftLoadError,
    setPreviewImages,
  ]);

  useEffect(() => {
    if (hasDraftExpired && location.pathname !== "/") {
      navigate("/", { replace: true });
    }
  }, [hasDraftExpired, location.pathname, navigate]);

  useEffect(() => {
    if (
      !draft ||
      location.pathname === "/" ||
      requestedStep === "export" ||
      (requestedDraftId !== null && draft.id !== requestedDraftId)
    ) {
      return;
    }
    const savedStep =
      requestedStep === "upload" ||
      workflowStepIndex(requestedStep) <=
        workflowStepIndex(draft.availableThrough)
        ? requestedStep
        : draft.availableThrough;
    const draftToSave = { ...draft, step: savedStep };
    const timeout = window.setTimeout(() => {
      if (isFinalizingExport.current) return;
      void persistDraft(draftToSave);
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [
    draft,
    location.pathname,
    persistDraft,
    requestedDraftId,
    requestedStep,
  ]);

  const initialMetadata = useMemo(
    () => (draft ? getDraftMetadata(draft) : []),
    [draft],
  );

  const handleUploadComplete = async (
    files: File[],
    loadedImages: LoadImageResult[],
  ) => {
    isFinalizingExport.current = false;
    const nextDraft = createWorkflowDraft(files, loadedImages);

    setHasDraftLoadError(false);
    setHasDraftExpired(false);
    setPreviewImages(toPreviewImages(loadedImages, files));
    setDraft(nextDraft);
    if (await persistDraft(nextDraft)) {
      navigate(workflowPath("regions", nextDraft.id));
    }
  };

  const handleRegionsChange = useCallback(
    (imageId: string, regions: Region[]) => {
      setPreviewImages((current) =>
        current.map((image) =>
          image.imageId === imageId ? { ...image, regions } : image,
        ),
      );
      setDraft((current) => updateDraftRegions(current, imageId, regions));
    },
    [setDraft, setPreviewImages],
  );

  const saveMetadataToDraft = useCallback((data: SavedImageData[]) => {
    setDraft((current) => updateDraftMetadata(current, data));
  }, [setDraft]);

  const handleSelectRegionsComplete = async () => {
    if (!draft) return;
    setHasPreviewError(false);
    try {
      await prepareWorkflowMetadataEditor(draft.images);
      const nextDraft: WorkflowDraft = {
        ...draft,
        step: "metadata",
        availableThrough: "metadata",
      };
      setDraft(nextDraft);
      if (!(await persistDraft(nextDraft))) return;
      navigate(workflowPath("metadata", nextDraft.id));
    } catch (error) {
      console.error("Couldn't prepare metadata editor", error);
      setHasPreviewError(true);
    }
  };

  const handleMetadataSave = async (data: SavedImageData[]) => {
    if (!draft) return;
    isFinalizingExport.current = true;
    setExportStatus("idle");
    setArchiveSaveStatus("idle");
    setHasDownloadError(false);
    try {
      const metadata = serializeMetadataForImages(draft.images, data);
      const nextDraft: WorkflowDraft = {
        ...draft,
        step: "export",
        availableThrough: "export",
        metadata,
        exportedZip: null,
        isEnded: true,
      };
      setDraft(nextDraft);
      if (!(await persistDraft(nextDraft))) {
        isFinalizingExport.current = false;
        return;
      }
      navigate(workflowPath("export", nextDraft.id));
    } catch (error) {
      isFinalizingExport.current = false;
      console.error("Couldn't save metadata before export", error);
      setExportStatus("error");
    }
  };

  const retryExport = useCallback(async () => {
    if (!draft) return;
    if (draft.exportedZip) {
      setExportStatus("success");
      return;
    }
    if (exportInProgress.current) return;
    exportInProgress.current = true;
    setExportStatus("generating");
    setHasDownloadError(false);
    try {
      const zip = await generateWorkflowExport(draft);
      const nextDraft: WorkflowDraft = {
        ...draft,
        step: "export",
        availableThrough: "export",
        exportedZip: zip,
      };
      setDraft(nextDraft);
      setExportStatus("success");
    } catch (error) {
      console.error("Couldn't generate sliced images", error);
      setExportStatus("error");
    } finally {
      exportInProgress.current = false;
    }
  }, [draft, setDraft]);

  const exportDetails = useMemo(() => {
    return getWorkflowExportDetails(draft);
  }, [draft]);

  const downloadArchive = () => {
    if (!draft?.exportedZip || !exportDetails) return;
    setHasDownloadError(false);
    try {
      downloadBlob(draft.exportedZip, exportDetails.filename);
    } catch (error) {
      console.error("Couldn't download generated archive", error);
      setHasDownloadError(true);
    }
  };

  const saveArchiveSession = useCallback(async () => {
    if (!draft?.exportedZip || !exportDetails) return;
    setArchiveSaveStatus("saving");
    try {
      await archiveSessionRepository.save(
        await createArchiveSessionData(draft, exportDetails),
      );
      setArchiveSaveStatus("saved");
    } catch (error) {
      console.error("Couldn't save completed archive session", error);
      setArchiveSaveStatus("error");
    }
  }, [draft, exportDetails]);

  const context: GenerateSlicesContext = {
    handleUploadComplete,
    previewImages,
    handleRegionsChange,
    handleSelectRegionsComplete,
    initialMetadata,
    saveMetadataToDraft,
    handleMetadataSave,
    exportStatus,
    exportDetails,
    hasDownloadError,
    archiveSaveStatus,
    retryExport,
    downloadArchive,
    saveArchiveSession,
    startImport,
    resumeWorkflowDraft,
  };

  return {
    context,
    hasDraftLoadError,
    hasDraftSaveError,
    hasDraftExpired,
    hasPreviewError,
    isDraftReady,
    draftExpiresAt: expiresAt,
  };
}
