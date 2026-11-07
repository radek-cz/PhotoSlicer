import type { PreviewImage } from "../../../../types/image";
import { useState } from "react";
import { PhotoDetectionSettingsDialog } from "../../../../components/PhotoDetectionSettings/PhotoDetectionSettings";
import { useLocalization } from "../../../../lib/i18n/useLocalization";
import { CanvasImage } from "../CanvasImage/CanvasImage";
import { RegionEditorFooter } from "../RegionEditorFooter/RegionEditorFooter";
import { RegionEditorToolbar } from "../RegionEditorToolbar/RegionEditorToolbar";
import { RegionPreviewList } from "../RegionPreviewList/RegionPreviewList";
import { useSelectRegions } from "./useSelectRegions";
import "./SelectRegions.css";

interface Props {
  previewImages: PreviewImage[];
  onComplete: () => void;
  onStartImport: () => Promise<boolean>;
  onRegionsChange: (imageId: string, regions: PreviewImage["regions"]) => void;
}

export const SelectRegions = ({
  previewImages,
  onComplete,
  onStartImport,
  onRegionsChange,
}: Props) => {
  const { t } = useLocalization();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const editor = useSelectRegions({
    previewImages,
    onComplete,
    onStartImport,
    onRegionsChange,
  });
  const { currentImage } = editor;

  if (!currentImage) {
    return <h2>{t("image.regions.empty")}</h2>;
  }

  return (
    <section className="region-editor" aria-label={t("image.regions.toolbarLabel")}>
      <RegionEditorToolbar
        currentFileName={currentImage.fileName}
        currentIndex={editor.currentIndex}
        totalImages={previewImages.length}
        zoom={editor.zoom}
        gridVisible={editor.gridVisible}
        isSaving={editor.isSaving}
        isFindingEdges={editor.isFindingEdges}
        isBusy={editor.isGeneratingPreview || editor.isFindingEdges}
        onOpenSettings={() => setSettingsOpen(true)}
        onNavigate={(index) => void editor.navigateToImage(index)}
        onZoomChange={editor.handleZoomChange}
        onZoomFit={editor.handleFit}
        onZoomReset={() => editor.setZoom(1)}
        onGridToggle={() => editor.setGridVisible((visible) => !visible)}
        onFindEdges={() => void editor.findEdges(currentImage)}
      />

      <div className="region-editor__workspace">
        <div className="region-editor__main">
          <div className="region-editor__canvas">
            <CanvasImage
              key={currentImage.imageId}
              currentImage={currentImage}
              gridVisible={editor.gridVisible}
              zoom={editor.zoom}
              onFitZoomChange={editor.handleFitZoomChange}
              onRegionsChange={onRegionsChange}
              onSaveFailure={editor.handleSaveFailure}
              onSaveSuccess={editor.handleSaveSuccess}
            />
            {editor.hasPreviewError && (
              <p className="region-editor__error" role="alert">
                {t("image.regions.previewError")}
              </p>
            )}
            {editor.hasDetectionError && (
              <p className="region-editor__error" role="alert">
                {t("image.regions.detectionError")}
              </p>
            )}
            {editor.hasSaveError && (
              <p className="region-editor__error" role="alert">
                {t("image.regions.save.error")}
              </p>
            )}
          </div>
        </div>

        <aside
          className="region-editor__preview-panel"
          aria-label={t("image.regions.previewTitle")}
        >
          <RegionPreviewList
            imageId={currentImage.imageId}
            regionCount={currentImage.regions.length}
            previewUrls={editor.images}
            isGeneratingPreview={editor.isGeneratingPreview}
            previewDimensions={editor.previewDimensions}
            onImageLoad={editor.handlePreviewLoad}
          />
        </aside>
      </div>

      <RegionEditorFooter
        previewImages={previewImages}
        currentImageId={currentImage.imageId}
        totalRegions={editor.totalRegions}
        isSaving={editor.isSaving}
        isCompleting={editor.isCompleting}
        hasSaveError={editor.hasSaveError}
        onReturnToImport={() => void editor.handleReturnToImport()}
        onComplete={() => void editor.handleComplete()}
      />

      <div className="region-editor__attribution">
        {t("image.regions.attribution")}
      </div>
      {settingsOpen && (
        <PhotoDetectionSettingsDialog onClose={() => setSettingsOpen(false)} />
      )}
    </section>
  );
};
