import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { PreviewImage } from "../../../../types/image";
import { revokeObjectUrls } from "../../../../lib/browserImageOperations";
import { generateSlicePreviewUrls } from "../../../../lib/imageWorkflow";
import { useLocalization } from "../../../../lib/i18n/useLocalization";
import { imageOperationsWorkerService } from "../../../../services/imageOperationsWorkerService";

interface UseSelectRegionsProps {
  previewImages: PreviewImage[];
  onComplete: () => void;
  onStartImport: () => Promise<boolean>;
}

export const useSelectRegions = ({
  previewImages,
  onComplete,
  onStartImport,
}: UseSelectRegionsProps) => {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [currentImageId, setCurrentImageId] = useState<string | null>(
    previewImages[0]?.imageId ?? null,
  );
  const [zoom, setZoom] = useState(1);
  const [fitZoom, setFitZoom] = useState(1);
  const [gridVisible, setGridVisible] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [hasPreviewError, setHasPreviewError] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [hasSaveError, setHasSaveError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [previewDimensions, setPreviewDimensions] = useState<
    Record<string, string>
  >({});
  const previewGeneration = useRef(0);
  const handleSaveFailure = useCallback(() => setHasSaveError(true), []);
  const handleSaveSuccess = useCallback(() => setHasSaveError(false), []);

  const currentImage = useMemo(
    () =>
      previewImages.find((image) => image.imageId === currentImageId) ??
      previewImages[0] ??
      null,
    [currentImageId, previewImages],
  );
  const currentIndex = currentImage
    ? previewImages.findIndex((image) => image.imageId === currentImage.imageId)
    : -1;
  const totalRegions = previewImages.reduce(
    (total, image) => total + image.regions.length,
    0,
  );

  useEffect(() => {
    return () => revokeObjectUrls(images);
  }, [images]);

  const refreshPreviews = useCallback(async (image: PreviewImage) => {
    const request = ++previewGeneration.current;
    setIsGeneratingPreview(true);
    setHasPreviewError(false);

    try {
      await imageOperationsWorkerService.saveImageRegions(
        image.imageId,
        image.regions,
      );
      const previewUrls = await generateSlicePreviewUrls(
        image.imageId,
        image.regions,
      );
      if (request !== previewGeneration.current) {
        revokeObjectUrls(previewUrls);
        return;
      }
      setImages(previewUrls);
    } catch (error) {
      console.error("Couldn't generate slice previews", error);
      if (request === previewGeneration.current) setHasPreviewError(true);
    } finally {
      if (request === previewGeneration.current) {
        setIsGeneratingPreview(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!currentImage) return;
    const timeout = window.setTimeout(() => {
      void refreshPreviews(currentImage);
    }, 350);
    return () => {
      window.clearTimeout(timeout);
      previewGeneration.current += 1;
    };
  }, [currentImage, refreshPreviews]);

  const persistCurrentImage = async () => {
    if (!currentImage) return false;
    setIsSaving(true);
    try {
      await imageOperationsWorkerService.saveImageRegions(
        currentImage.imageId,
        currentImage.regions,
      );
      setHasSaveError(false);
      return true;
    } catch (error) {
      console.error("Couldn't save the current scan regions", error);
      setHasSaveError(true);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const navigateToImage = async (index: number) => {
    const nextImage = previewImages[index];
    if (!nextImage || index === currentIndex || !(await persistCurrentImage())) {
      return;
    }
    setCurrentImageId(nextImage.imageId);
    setZoom(fitZoom);
  };

  const handleZoomChange = (nextZoom: number) => {
    setZoom(Math.min(3, Math.max(0.05, Number(nextZoom.toFixed(2)))));
  };

  const handleFit = () => {
    setZoom(fitZoom);
  };

  const handleFitZoomChange = useCallback((nextZoom: number) => {
    setFitZoom(nextZoom);
    setZoom(nextZoom);
  }, []);

  const handleReturnToImport = async () => {
    if (
      (await persistCurrentImage()) &&
      (await onStartImport())
    ) {
      navigate("/generate/upload");
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await onComplete();
    } finally {
      setIsCompleting(false);
    }
  };

  const handlePreviewLoad = (
    imageId: string,
    index: number,
    naturalWidth: number,
    naturalHeight: number,
  ) => {
    const key = `${imageId}-${index}`;
    setPreviewDimensions((previous) => ({
      ...previous,
      [key]: t("image.regions.size", {
        width: naturalWidth,
        height: naturalHeight,
      }),
    }));
  };

  return {
    currentImage,
    currentIndex,
    totalRegions,
    zoom,
    setZoom,
    gridVisible,
    setGridVisible,
    images,
    hasPreviewError,
    isGeneratingPreview,
    hasSaveError,
    isSaving,
    isCompleting,
    previewDimensions,
    handleSaveFailure,
    handleSaveSuccess,
    refreshPreviews,
    navigateToImage,
    handleZoomChange,
    handleFit,
    handleFitZoomChange,
    handleReturnToImport,
    handleComplete,
    handlePreviewLoad,
  };
};
