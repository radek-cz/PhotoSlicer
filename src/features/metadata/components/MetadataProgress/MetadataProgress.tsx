import { useLocalization } from "../../../../lib/i18n/useLocalization";
import "./MetadataProgress.css";

interface Props {
  total: number;
  complete: number;
}

export const MetadataProgress = ({ total, complete }: Props) => {
  const { formatNumber, t } = useLocalization();
  const percent = total ? Math.round((complete / total) * 100) : 0;

  return (
    <header className="metadata-header">
      <p className="metadata-eyebrow">{t("image.metadata.eyebrow")}</p>
      <h2 id="metadata-heading">{t("image.metadata.heading")}</h2>
      <div className="metadata-progress-row">
        <p aria-live="polite" aria-atomic="true">
          {t("image.metadata.totalCount", {
            count: total,
            formatted: formatNumber(total),
          })}
        </p>
        <div className="completion-stat">
          <span>{t("image.metadata.progressLabel")}</span>
          <strong aria-live="polite" aria-atomic="true">
            {t("image.metadata.progressValue", {
              complete: formatNumber(complete),
              total: formatNumber(total),
              percent: formatNumber(percent),
            })}
          </strong>
          <progress
            aria-label={t("image.metadata.progressLabel")}
            max={total || 1}
            value={complete}
          />
        </div>
      </div>
    </header>
  );
};
