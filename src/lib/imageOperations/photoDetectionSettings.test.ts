import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_PHOTO_DETECTION_SETTINGS,
  PHOTO_DETECTION_SETTINGS_STORAGE_KEY,
  readPhotoDetectionSettings,
  resetPhotoDetectionSettings,
  savePhotoDetectionSettings,
} from "./photoDetectionSettings";

describe("photo detection settings", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns defaults when no settings have been saved", () => {
    expect(readPhotoDetectionSettings()).toEqual(
      DEFAULT_PHOTO_DETECTION_SETTINGS,
    );
  });

  it("persists and reads user settings", () => {
    const settings = {
      ...DEFAULT_PHOTO_DETECTION_SETTINGS,
      cannyLowThreshold: 80,
      cannyHighThreshold: 180,
    };

    savePhotoDetectionSettings(settings);

    expect(readPhotoDetectionSettings()).toEqual(settings);
  });

  it("restores and persists defaults", () => {
    savePhotoDetectionSettings({
      ...DEFAULT_PHOTO_DETECTION_SETTINGS,
      minContourArea: 10000,
    });

    expect(resetPhotoDetectionSettings()).toEqual(
      DEFAULT_PHOTO_DETECTION_SETTINGS,
    );
    expect(
      window.localStorage.getItem(PHOTO_DETECTION_SETTINGS_STORAGE_KEY),
    ).toBe(JSON.stringify(DEFAULT_PHOTO_DETECTION_SETTINGS));
  });

  it("rejects malformed or out-of-range stored settings", () => {
    window.localStorage.setItem(PHOTO_DETECTION_SETTINGS_STORAGE_KEY, "{");
    expect(() => readPhotoDetectionSettings()).toThrow(
      "Saved photo detection settings are not valid JSON",
    );

    window.localStorage.setItem(
      PHOTO_DETECTION_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_PHOTO_DETECTION_SETTINGS,
        morphKernelSize: 4,
      }),
    );
    expect(() => readPhotoDetectionSettings()).toThrow(
      "Saved photo detection settings are invalid",
    );
  });

  it("rejects invalid settings before saving", () => {
    expect(() =>
      savePhotoDetectionSettings({
        ...DEFAULT_PHOTO_DETECTION_SETTINGS,
        cannyLowThreshold: 150,
      }),
    ).toThrow("Photo detection settings are invalid");
  });
});
