import { useLocalization } from "../../../../lib/i18n/useLocalization";

interface Props {
  currentFileName: string;
  currentIndex: number;
  totalImages: number;
  zoom: number;
  gridVisible: boolean;
  isSaving: boolean;
  isGeneratingPreview: boolean;
  onNavigate: (index: number) => void;
  onZoomChange: (zoom: number) => void;
  onZoomFit: () => void;
  onZoomReset: () => void;
  onGridToggle: () => void;
  onGeneratePreview: () => void;
}

export const RegionEditorToolbar = ({
  currentFileName,
  currentIndex,
  totalImages,
  zoom,
  gridVisible,
  isSaving,
  isGeneratingPreview,
  onNavigate,
  onZoomChange,
  onZoomFit,
  onZoomReset,
  onGridToggle,
  onGeneratePreview,
}: Props) => {
  const { t } = useLocalization();

  return (
    <div className="region-toolbar" role="toolbar" aria-label={t("image.regions.toolbarLabel")}>
      <div className="region-toolbar__primary">
        <div className="region-toolbar__context">
          <span className="region-toolbar__status" aria-hidden="true" />
          <strong>
            {t("image.regions.scanProgress", {
              current: currentIndex + 1,
              total: totalImages,
            })}
          </strong>
        </div>
        <div className="region-toolbar__file" title={currentFileName}>
          <span className="material-symbols-outlined" aria-hidden="true">
            ▤
          </span>
          <strong>{currentFileName}</strong>
        </div>
        <div className="region-toolbar__navigation">
          <button
            type="button"
            aria-label={t("image.regions.previous")}
            title={t("image.regions.previous")}
            disabled={currentIndex <= 0 || isSaving}
            onClick={() => onNavigate(currentIndex - 1)}
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            aria-label={t("image.regions.next")}
            title={t("image.regions.next")}
            disabled={currentIndex < 0 || currentIndex + 1 >= totalImages || isSaving}
            onClick={() => onNavigate(currentIndex + 1)}
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <div
        className="region-toolbar__view-controls"
        role="group"
        aria-label={t("image.regions.viewControlsLabel")}
      >
        <button
          type="button"
          aria-label={t("image.regions.view.zoomOut")}
          title={t("image.regions.view.zoomOut")}
          onClick={() => onZoomChange(zoom - 0.1)}
        >
          −
        </button>
        <span aria-live="polite">
          {t("image.regions.view.zoomValue", {
            value: `${Math.round(zoom * 100)}%`,
          })}
        </span>
        <button
          type="button"
          aria-label={t("image.regions.view.zoomIn")}
          title={t("image.regions.view.zoomIn")}
          onClick={() => onZoomChange(zoom + 0.1)}
        >
          +
        </button>
        <span className="region-toolbar__separator" aria-hidden="true">/</span>
        <button className="region-toolbar__text-button" type="button" onClick={onZoomFit}>
          {t("image.regions.view.fit")}
        </button>
        <button
          className="region-toolbar__zoom-reset"
          type="button"
          aria-label={t("image.regions.view.zoomReset")}
          title={t("image.regions.view.zoomReset")}
          onClick={onZoomReset}
        >
          100%
        </button>
        <span className="region-toolbar__separator" aria-hidden="true">/</span>
        <button
          className="region-toolbar__grid-button"
          type="button"
          aria-pressed={gridVisible}
          onClick={onGridToggle}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            ▦
          </span>
          {t("image.regions.view.grid")}
        </button>
      </div>

      <button
        className="region-toolbar__generate"
        type="button"
        onClick={onGeneratePreview}
        disabled={isGeneratingPreview}
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          ▧
        </span>
        {t("image.regions.generate")}
      </button>
    </div>
  );
};
