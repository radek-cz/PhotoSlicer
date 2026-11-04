import type { PreviewImage } from "../../../../types/image";
import { useLocalization } from "../../../../lib/i18n/useLocalization";

interface Props {
  previewImages: PreviewImage[];
  currentImageId: string;
  totalRegions: number;
  isSaving: boolean;
  isCompleting: boolean;
  hasSaveError: boolean;
  onReturnToImport: () => void;
  onComplete: () => void;
}

export const RegionEditorFooter = ({
  previewImages,
  currentImageId,
  totalRegions,
  isSaving,
  isCompleting,
  hasSaveError,
  onReturnToImport,
  onComplete,
}: Props) => {
  const { t } = useLocalization();

  return (
    <footer className="region-editor__footer">
      <button
        className="region-editor__back"
        type="button"
        onClick={onReturnToImport}
        disabled={isSaving || isCompleting}
      >
        <span aria-hidden="true">←</span>
        {t("image.regions.backToImport")}
      </button>
      <div
        className="region-editor__batch"
        role="list"
        aria-label={t("image.regions.batchStatus")}
      >
        <span className="region-editor__batch-label">
          {t("image.regions.batchStatus")}
        </span>
        {previewImages.map((image, index) => (
          <span
            className={`region-editor__batch-item${image.imageId === currentImageId ? " is-current" : ""}`}
            key={image.imageId}
            role="listitem"
          >
            <span aria-hidden="true" />
            {t("image.regions.batchItem", {
              current: index + 1,
              count: image.regions.length,
            })}
          </span>
        ))}
      </div>
      <button
        className="region-editor__complete"
        type="button"
        onClick={onComplete}
        disabled={isCompleting || isSaving || hasSaveError}
      >
        {t("image.regions.complete", { count: totalRegions })}
        <span aria-hidden="true">→</span>
      </button>
    </footer>
  );
};
