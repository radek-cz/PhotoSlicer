import { useLocalization } from "../../../../lib/i18n/useLocalization";

interface Props {
  imageId: string;
  regionCount: number;
  previewUrls: string[];
  isGeneratingPreview: boolean;
  previewDimensions: Record<string, string>;
  onImageLoad: (
    imageId: string,
    index: number,
    naturalWidth: number,
    naturalHeight: number,
  ) => void;
}

export const RegionPreviewList = ({
  imageId,
  regionCount,
  previewUrls,
  isGeneratingPreview,
  previewDimensions,
  onImageLoad,
}: Props) => {
  const { formatNumber, t } = useLocalization();

  return (
    <section className="region-previews" aria-labelledby="region-previews-title">
      <div className="region-previews__heading">
        <h2 id="region-previews-title">{t("image.regions.previewTitle")}</h2>
        <span className="region-previews__count">
          {t("image.regions.detectedCount", { count: regionCount })}
        </span>
      </div>
      {isGeneratingPreview && (
        <p className="region-previews__status" role="status">
          {t("image.regions.previewLoading")}
        </p>
      )}
      {previewUrls.length > 0 && (
        <div className="region-previews__cards">
          {previewUrls.map((previewUrl, index) => {
            const key = `${imageId}-${index}`;
            return (
              <article className="region-preview-card" key={key}>
                <div className="region-preview-card__image">
                  <img
                    src={previewUrl}
                    alt={t("image.regions.previewAlt", {
                      index: formatNumber(index + 1),
                    })}
                    onLoad={(event) => {
                      const { naturalWidth, naturalHeight } = event.currentTarget;
                      onImageLoad(imageId, index, naturalWidth, naturalHeight);
                    }}
                  />
                  <span>#{String(index + 1).padStart(2, "0")}</span>
                </div>
                <div className="region-preview-card__details">
                  <strong>#{String(index + 1).padStart(2, "0")}</strong>
                  <small>{previewDimensions[key] ?? ""}</small>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
