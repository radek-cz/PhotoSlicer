import { useEffect, useId, useRef, useState, type SyntheticEvent } from "react";
import { createPortal } from "react-dom";
import { useLocalization } from "../../lib/i18n/useLocalization";
import {
  DEFAULT_PHOTO_DETECTION_SETTINGS,
  readPhotoDetectionSettings,
  resetPhotoDetectionSettings,
  savePhotoDetectionSettings,
  type PhotoDetectionSettings,
} from "../../lib/imageOperations/photoDetectionSettings";
import "./PhotoDetectionSettings.css";

interface Props {
  onClose: () => void;
}

const settingFields: {
  key: keyof PhotoDetectionSettings;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: "morphKernelSize", min: 3, max: 15, step: 2 },
  { key: "gaussianBlurSize", min: 1, max: 15, step: 2 },
  { key: "cannyLowThreshold", min: 0, max: 149, step: 1 },
  { key: "cannyHighThreshold", min: 150, max: 300, step: 1 },
  { key: "minContourArea", min: 500, max: 50000, step: 500 },
  { key: "approxPolyEpsilon", min: 0.005, max: 0.1, step: 0.005 },
  { key: "minRectangularity", min: 0.3, max: 1, step: 0.01 },
  { key: "maxAspectRatio", min: 1, max: 5, step: 0.1 },
];

export const PhotoDetectionSettingsDialog = ({ onClose }: Props) => {
  const { t } = useLocalization();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [state, setState] = useState(() => {
    try {
      return {
        settings: readPhotoDetectionSettings(),
        errorKey: null as "loadError" | "saveError" | null,
      };
    } catch (loadError) {
      console.error("Couldn't load photo detection settings", loadError);
      return {
        settings: { ...DEFAULT_PHOTO_DETECTION_SETTINGS },
        errorKey: "loadError" as const,
      };
    }
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const handleChange = (
    key: keyof PhotoDetectionSettings,
    value: number,
  ) => {
    const nextSettings = { ...state.settings, [key]: value };
    try {
      savePhotoDetectionSettings(nextSettings);
      setState({ settings: nextSettings, errorKey: null });
    } catch (saveError) {
      console.error("Couldn't save photo detection settings", saveError);
      setState((current) => ({ ...current, errorKey: "saveError" }));
    }
  };

  const handleReset = () => {
    try {
      setState({
        settings: resetPhotoDetectionSettings(),
        errorKey: null,
      });
    } catch (resetError) {
      console.error("Couldn't reset photo detection settings", resetError);
      setState((current) => ({ ...current, errorKey: "saveError" }));
    }
  };

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    dialogRef.current?.close();
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      className="photo-detection-settings__dialog"
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={handleCancel}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          dialogRef.current?.close();
        }
      }}
    >
      <div className="photo-detection-settings__header">
        <h2 id={titleId}>{t("image.regions.settings.title")}</h2>
        <button
          type="button"
          className="photo-detection-settings__close"
          aria-label={t("image.regions.settings.close")}
          onClick={() => dialogRef.current?.close()}
        >
          ×
        </button>
      </div>
      <p className="photo-detection-settings__description">
        {t("image.regions.settings.description")}
      </p>
      {state.errorKey && (
        <p className="photo-detection-settings__error" role="alert">
          {t(`image.regions.settings.${state.errorKey}`)}
        </p>
      )}
      <div className="photo-detection-settings__fields">
        {settingFields.map(({ key, min, max, step }) => (
          <label className="photo-detection-settings__field" key={key}>
            <span className="photo-detection-settings__label">
              <span>{t(`image.regions.settings.fields.${key}.label`)}</span>
              <output htmlFor={`photo-detection-${key}`}>
                {formatValue(key, state.settings[key])}
              </output>
            </span>
            <input
              id={`photo-detection-${key}`}
              type="range"
              min={min}
              max={max}
              step={step}
              value={state.settings[key]}
              aria-label={t(`image.regions.settings.fields.${key}.label`)}
              aria-describedby={`photo-detection-${key}-description`}
              onChange={(event) =>
                handleChange(key, Number(event.currentTarget.value))
              }
            />
            <span
              className="photo-detection-settings__hint"
              id={`photo-detection-${key}-description`}
            >
              {t(`image.regions.settings.fields.${key}.description`)}
            </span>
          </label>
        ))}
      </div>
      <div className="photo-detection-settings__actions">
        <button
          type="button"
          className="photo-detection-settings__reset"
          onClick={handleReset}
        >
          {t("image.regions.settings.reset")}
        </button>
        <button
          type="button"
          className="photo-detection-settings__done"
          onClick={() => dialogRef.current?.close()}
        >
          {t("image.regions.settings.done")}
        </button>
      </div>
    </dialog>,
    document.body,
  );
};

function formatValue(key: keyof PhotoDetectionSettings, value: number): string {
  if (key === "approxPolyEpsilon") return value.toFixed(3);
  if (key === "minRectangularity" || key === "maxAspectRatio") {
    return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  }
  return String(value);
}
