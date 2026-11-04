import { useLocalization } from "../../../../lib/i18n/useLocalization";
import type { MetadataFilter } from "../../utils/metadataUtils";
import "./MetadataFilters.css";

interface Props {
  filter: MetadataFilter;
  total: number;
  incomplete: number;
  complete: number;
  onChange: (filter: MetadataFilter) => void;
}

export const MetadataFilters = ({
  filter,
  total,
  incomplete,
  complete,
  onChange,
}: Props) => {
  const { formatNumber, t } = useLocalization();
  const filters: Array<{ id: MetadataFilter; count: number }> = [
    { id: "all", count: total },
    { id: "incomplete", count: incomplete },
    { id: "complete", count: complete },
  ];

  return (
    <nav className="metadata-filters" aria-label={t("image.metadata.filters.label")}>
      <span>{t("image.metadata.filters.heading")}</span>
      <div className="metadata-filter-list">
        {filters.map(({ id, count }) => (
          <button
            aria-pressed={filter === id}
            className={filter === id ? "active" : ""}
            key={id}
            type="button"
            onClick={() => onChange(id)}
          >
            {t(`image.metadata.filters.${id}`, {
              count: formatNumber(count),
            })}
          </button>
        ))}
      </div>
    </nav>
  );
};
