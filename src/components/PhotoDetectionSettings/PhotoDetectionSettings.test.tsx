import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocalizationProvider } from "../../lib/i18n/components/LocalizationProvider/LocalizationProvider";
import i18n from "../../lib/i18n/i18n";
import {
  DEFAULT_PHOTO_DETECTION_SETTINGS,
  PHOTO_DETECTION_SETTINGS_STORAGE_KEY,
} from "../../lib/imageOperations/photoDetectionSettings";
import { PhotoDetectionSettingsDialog } from "./PhotoDetectionSettings";

beforeEach(async () => {
  window.localStorage.clear();
  await i18n.changeLanguage("en");
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    },
  });
});

afterEach(cleanup);

describe("PhotoDetectionSettingsDialog", () => {
  it("saves slider changes and restores the persisted defaults", () => {
    render(
      <LocalizationProvider>
        <PhotoDetectionSettingsDialog onClose={() => undefined} />
      </LocalizationProvider>,
    );

    const lowThreshold = screen.getByRole("slider", {
      name: /Canny lower threshold/i,
    });
    fireEvent.change(lowThreshold, { target: { value: "75" } });

    expect(
      JSON.parse(
        window.localStorage.getItem(PHOTO_DETECTION_SETTINGS_STORAGE_KEY) ?? "",
      ).cannyLowThreshold,
    ).toBe(75);

    fireEvent.click(screen.getByRole("button", { name: "Restore defaults" }));

    expect(lowThreshold).toHaveProperty("value", "50");
    expect(
      JSON.parse(
        window.localStorage.getItem(PHOTO_DETECTION_SETTINGS_STORAGE_KEY) ?? "",
      ),
    ).toEqual(DEFAULT_PHOTO_DETECTION_SETTINGS);
  });
});
