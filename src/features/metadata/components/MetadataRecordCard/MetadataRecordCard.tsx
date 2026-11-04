import { useState } from "react";
import type { ImageMetadata } from "../../../../types/imageOperations";
import { useLocalization } from "../../../../lib/i18n/useLocalization";
import {
  getDatePrecision,
  getDateValue,
  type MetadataRecord,
} from "../../utils/metadataUtils";
import { TagInput } from "../TagInput/TagInput";
import "./MetadataRecordCard.css";

interface Props {
  record: MetadataRecord;
  disabled: boolean;
  operationFailed: boolean;
  onChange: (patch: Partial<ImageMetadata>) => void;
  onRotate: (direction: -90 | 90 | 180) => void;
  onFlip: () => void;
  onReset: () => void;
  onRetry: () => void;
}

const DATE_PRECISIONS = ["exact", "year", "decade"] as const;
export const MetadataRecordCard = ({
  record,
  disabled,
  operationFailed,
  onChange,
  onRotate,
  onFlip,
  onReset,
  onRetry,
}: Props) => {
  const { imageIndex, image, metadata, previewUrl, regionId } = record;
  const { formatNumber, t } = useLocalization();
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const id = `${image.imageId}-${regionId}`;
  const precision = getDatePrecision(metadata.datePrecision);
  const dateValue = getDateValue(metadata, precision);
  return (
    <article className="metadata-record">
      <div className="record-preview">
        <div className="record-heading">
          <strong>
            {t("image.metadata.recordHeading", {
              regionId,
              imageIndex: formatNumber(imageIndex + 1),
            })}
          </strong>
          <span className={metadata.title.trim() ? "record-complete" : "record-incomplete"}>
            {metadata.title.trim()
              ? t("image.metadata.status.complete")
              : t("image.metadata.status.incomplete")}
          </span>
        </div>
        <img
          className="preview-image"
          src={previewUrl}
          alt={t("image.metadata.previewAlt", {
            regionId,
            imageIndex: formatNumber(imageIndex + 1),
          })}
          onLoad={(event) => {
            const { naturalWidth, naturalHeight } = event.currentTarget;
            setDimensions({ width: naturalWidth, height: naturalHeight });
          }}
        />
        <p className="image-dimensions">
          {dimensions
            ? t("image.metadata.dimensions", {
                width: formatNumber(dimensions.width),
                height: formatNumber(dimensions.height),
              })
            : t("image.metadata.dimensionsLoading")}
        </p>
        <div
          className="orientation-controls"
          role="group"
          aria-label={t("image.metadata.orientation.label")}
        >
          <button aria-label={t("image.metadata.orientation.leftLabel")} disabled={disabled} type="button" onClick={() => onRotate(-90)}>
            {t("image.metadata.orientation.left")}
          </button>
          <button aria-label={t("image.metadata.orientation.rightLabel")} disabled={disabled} type="button" onClick={() => onRotate(90)}>
            {t("image.metadata.orientation.right")}
          </button>
          <button aria-label={t("image.metadata.orientation.halfTurnLabel")} disabled={disabled} type="button" onClick={() => onRotate(180)}>
            {t("image.metadata.orientation.halfTurn")}
          </button>
          <button
            aria-pressed={metadata.mirrorHorizontal ?? false}
            aria-label={t("image.metadata.orientation.flipLabel")}
            disabled={disabled}
            type="button"
            onClick={onFlip}
          >
            {t("image.metadata.orientation.flip")}
          </button>
          <button aria-label={t("image.metadata.orientation.resetLabel")} disabled={disabled} type="button" onClick={onReset}>
            {t("image.metadata.orientation.reset")}
          </button>
        </div>
        {operationFailed && (
          <div
            className="record-operation-error"
            role="group"
            aria-label={t("image.metadata.rotateError")}
          >
            <span>{t("image.metadata.rotateError")}</span>
            <button disabled={disabled} type="button" onClick={onRetry}>
              {t("image.metadata.retry")}
            </button>
          </div>
        )}
      </div>
      <div className="metadata-fields">
        <label htmlFor={`${id}-title`}>
          {t("image.metadata.title")} <span aria-hidden="true">*</span>
          <input
            id={`${id}-title`}
            aria-required="true"
            aria-invalid={!metadata.title.trim()}
            required
            value={metadata.title}
            onChange={(event) => onChange({ title: event.target.value })}
          />
        </label>
        <label htmlFor={`${id}-description`}>
          {t("image.metadata.description")}
          <textarea
            id={`${id}-description`}
            rows={3}
            value={metadata.description}
            onChange={(event) => onChange({ description: event.target.value })}
          />
        </label>
        <fieldset className="date-field">
          <legend>{t("image.metadata.date.label")}</legend>
          <div className="date-precision">
            {DATE_PRECISIONS.map((option) => (
              <button
                aria-pressed={precision === option}
                className={precision === option ? "active" : ""}
                key={option}
                type="button"
                onClick={() => onChange({
                  datePrecision: option,
                  dateValue: getDateValue(metadata, option),
                })}
              >
                {t(`image.metadata.date.${option}`)}
              </button>
            ))}
          </div>
          <input
            aria-label={t(`image.metadata.date.${precision}`)}
            max={precision === "year" ? "9999" : undefined}
            maxLength={precision === "exact" ? undefined : 4}
            min={precision === "year" ? "1" : undefined}
            pattern={precision === "decade" ? "\\d{4}" : precision === "year" ? "\\d{1,4}" : undefined}
            placeholder={t(`image.metadata.date.placeholder.${precision}`)}
            type={precision === "exact" ? "date" : "text"}
            inputMode={precision === "exact" ? undefined : "numeric"}
            value={dateValue}
            onChange={(event) =>
              onChange({
                dateValue: event.target.value,
                dateValues: {
                  ...metadata.dateValues,
                  [precision]: event.target.value,
                },
              })
            }
          />
        </fieldset>
        <div className="metadata-tags">
          <TagInput
            label={t("image.metadata.tags.people")}
            inputLabel={t("image.metadata.tags.addPerson")}
            tags={metadata.people ?? []}
            onChange={(people) => onChange({ people })}
          />
          <TagInput
            label={t("image.metadata.tags.locations")}
            inputLabel={t("image.metadata.tags.addLocation")}
            tags={metadata.locations ?? []}
            onChange={(locations) => onChange({ locations })}
          />
          <TagInput
            label={t("image.metadata.tags.topics")}
            inputLabel={t("image.metadata.tags.addTopic")}
            tags={metadata.topics ?? []}
            onChange={(topics) => onChange({ topics })}
          />
        </div>
      </div>
    </article>
  );
};
