import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "./locales/en.json";
import pl from "./locales/pl.json";
import i18n, { LANGUAGE_STORAGE_KEY } from "./i18n";
import { LocalizationProvider } from "./components/LocalizationProvider/LocalizationProvider";
import Header from "../../components/Header/Header";
import Home from "../../pages/Home/Home";

vi.mock("../../services/imageOperationsWorkerService", () => ({
  imageOperationsWorkerService: {},
}));

afterEach(cleanup);

function StatefulWorkflow() {
  const [metadata, setMetadata] = useState("");

  return (
    <input
      aria-label="workflow-metadata"
      value={metadata}
      onChange={(event) => setMetadata(event.target.value)}
    />
  );
}

beforeEach(async () => {
  const values = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
  };

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage,
  });
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
  await i18n.changeLanguage("en");
});

describe("localization resources", () => {
  it("keeps Polish and English translation trees in sync", () => {
    const keys = (resource: unknown): string[] => {
      if (resource === null || typeof resource !== "object") {
        return [];
      }
      return Object.entries(resource).flatMap(([key, value]) =>
        typeof value === "string"
          ? [key]
          : keys(value).map((nestedKey) => `${key}.${nestedKey}`),
      );
    };

    expect(keys(en).sort()).toEqual(keys(pl).sort());
  });
});

describe("localization", () => {
  it("interpolates resource values and formats numbers for the active locale", async () => {
    expect(
      i18n.t("image.metadata.rotate", { lng: "en", rotation: 90 }),
    ).toBe("Rotate 90° (current: 90°)");
    expect(new Intl.NumberFormat("pl").format(1234.5)).toContain(",");
    expect(new Intl.NumberFormat("en").format(1234.5)).toContain(".");
  });
});

describe("localized React UI", () => {
  beforeEach(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
  });

  it("renders translated navigation and page content and switches immediately", async () => {
    render(
      <MemoryRouter>
        <LocalizationProvider>
          <Header />
        <Home onComplete={() => undefined} />
        </LocalizationProvider>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: "From scan to archive" }),
    ).toBeTruthy();
    expect(screen.getByLabelText("Choose PNG or JPEG images")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Image import" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Detection and cropping" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Metadata and correction" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Export and archive" })).toBeTruthy();
    const languageSelect = await screen.findByRole("combobox", {
      name: "Language",
    });
    fireEvent.change(languageSelect, { target: { value: "pl" } });

    expect(
      await screen.findByRole("heading", { name: "Od skanu do archiwum" }),
    ).toBeTruthy();
    expect(screen.getByLabelText("Wybierz obrazy PNG lub JPEG")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Import/ }).getAttribute("href"),
    ).toBe("/");
    expect(
      screen.getByRole("link", { name: "Przejdź do importu" }).getAttribute("href"),
    ).toBe("#image-upload");
    await waitFor(() => {
      expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("pl");
    });
    expect(document.documentElement.lang).toBe("pl");
  });

  it("shows unavailable workflow destinations as disabled and links to archives", async () => {
    render(
      <MemoryRouter>
        <LocalizationProvider>
          <Header />
        </LocalizationProvider>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("link", { name: /Import/ }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: "02. Detection & cropping — Unavailable",
      }).hasAttribute("disabled"),
    ).toBe(true);
    expect(
      screen.getByRole("link", { name: "Saved archives" }).getAttribute("href"),
    ).toBe("/archives");
    expect(
      screen.queryByText(/IndexedDB available/i),
    ).toBeNull();
  });

  it("rejects unsupported files dropped into the import area", () => {
    render(
      <MemoryRouter>
        <LocalizationProvider>
          <Home onComplete={() => undefined} />
        </LocalizationProvider>
      </MemoryRouter>,
    );

    const dropzone = screen
      .getByText("Drag and drop photos here")
      .closest("label");
    if (!dropzone) throw new Error("Import dropzone label was not rendered");

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [new File(["text"], "notes.txt", { type: "text/plain" })],
      },
    });

    expect(screen.getByRole("alert").textContent).toBe(
      "Unsupported files were skipped. Choose PNG or JPEG files.",
    );
  });

  it("keeps the import action disabled until a valid file is queued", () => {
    render(
      <MemoryRouter>
        <LocalizationProvider>
          <Home onComplete={() => undefined} />
        </LocalizationProvider>
      </MemoryRouter>,
    );

    const importButton = screen.getByRole("button", { name: "Start import" });
    expect(importButton.hasAttribute("disabled")).toBe(true);

    const dropzone = screen
      .getByText("Drag and drop photos here")
      .closest("label");
    if (!dropzone) throw new Error("Import dropzone label was not rendered");
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [new File(["image"], "photo.png", { type: "image/png" })],
      },
    });

    expect(importButton.hasAttribute("disabled")).toBe(false);
    expect(screen.getByText("photo.png")).toBeTruthy();
  });

  it("keeps the editor mounted when the language changes", async () => {
    render(
      <MemoryRouter>
        <LocalizationProvider>
          <Header />
          <StatefulWorkflow />
        </LocalizationProvider>
      </MemoryRouter>,
    );

    const metadataInput = await screen.findByLabelText("workflow-metadata");
    fireEvent.change(metadataInput, {
      target: { value: "User-entered title" },
    });
    const languageSelect = await screen.findByRole("combobox", {
      name: "Language",
    });
    fireEvent.change(languageSelect, { target: { value: "pl" } });

    expect(screen.getByLabelText("workflow-metadata")).toBe(metadataInput);
    expect(metadataInput).toHaveProperty("value", "User-entered title");
  });
});
