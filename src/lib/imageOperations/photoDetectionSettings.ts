import type { PhotoDetectionSettings } from "../../types/imageOperations";

export type { PhotoDetectionSettings } from "../../types/imageOperations";

export const DEFAULT_PHOTO_DETECTION_SETTINGS: PhotoDetectionSettings = {
  morphKernelSize: 7,
  gaussianBlurSize: 5,
  cannyLowThreshold: 50,
  cannyHighThreshold: 150,
  minContourArea: 5000,
  approxPolyEpsilon: 0.02,
  minRectangularity: 0.7,
  maxAspectRatio: 2.5,
};

export const PHOTO_DETECTION_SETTINGS_STORAGE_KEY =
  "photoslicer.photo-detection-settings";

export function isPhotoDetectionSettings(
  value: unknown,
): value is PhotoDetectionSettings {
  if (typeof value !== "object" || value === null) return false;
  const settings = value as Record<string, unknown>;

  return (
    isOddInteger(settings.morphKernelSize, 3, 15) &&
    isOddInteger(settings.gaussianBlurSize, 1, 15) &&
    isNumberInRange(settings.cannyLowThreshold, 0, 149, true) &&
    isNumberInRange(settings.cannyHighThreshold, 150, 300, true) &&
    isNumberInRange(settings.minContourArea, 500, 50000, true) &&
    isNumberInRange(settings.approxPolyEpsilon, 0.005, 0.1) &&
    isNumberInRange(settings.minRectangularity, 0.3, 1) &&
    isNumberInRange(settings.maxAspectRatio, 1, 5)
  );
}

export function readPhotoDetectionSettings(): PhotoDetectionSettings {
  const stored = window.localStorage.getItem(
    PHOTO_DETECTION_SETTINGS_STORAGE_KEY,
  );
  if (stored === null) return { ...DEFAULT_PHOTO_DETECTION_SETTINGS };

  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch (error) {
    throw new Error("Saved photo detection settings are not valid JSON", {
      cause: error,
    });
  }

  if (!isPhotoDetectionSettings(parsed)) {
    throw new Error("Saved photo detection settings are invalid");
  }
  return parsed;
}

export function savePhotoDetectionSettings(
  settings: PhotoDetectionSettings,
): void {
  if (!isPhotoDetectionSettings(settings)) {
    throw new Error("Photo detection settings are invalid");
  }
  window.localStorage.setItem(
    PHOTO_DETECTION_SETTINGS_STORAGE_KEY,
    JSON.stringify(settings),
  );
}

export function resetPhotoDetectionSettings(): PhotoDetectionSettings {
  const defaults = { ...DEFAULT_PHOTO_DETECTION_SETTINGS };
  savePhotoDetectionSettings(defaults);
  return defaults;
}

function isOddInteger(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= minimum &&
    value <= maximum &&
    value % 2 === 1
  );
}

function isNumberInRange(
  value: unknown,
  minimum: number,
  maximum: number,
  integer = false,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum &&
    (!integer || Number.isInteger(value))
  );
}
