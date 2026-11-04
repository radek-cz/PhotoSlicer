import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { LocalizationProvider } from "../../../../lib/i18n/components/LocalizationProvider/LocalizationProvider";
import i18n from "../../../../lib/i18n/i18n";
import { Thanks } from "./Thanks";

afterEach(cleanup);

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

function renderThanks(
  exportStatus: "idle" | "generating" | "success" | "error",
) {
  const downloadArchive = vi.fn();
  const saveArchiveSession = vi.fn();
  const retryExport = vi.fn();

  render(
    <MemoryRouter>
      <LocalizationProvider>
        <Thanks
          exportStatus={exportStatus}
          exportDetails={
            exportStatus === "success"
              ? {
                  filename: "photoslicer-export.zip",
                  size: 1024,
                  cropCount: 12,
                }
              : null
          }
          hasDownloadError={false}
          archiveSaveStatus="idle"
          downloadArchive={downloadArchive}
          saveArchiveSession={saveArchiveSession}
          retryExport={retryExport}
        />
      </LocalizationProvider>
    </MemoryRouter>,
  );

  return { downloadArchive, saveArchiveSession, retryExport };
}

describe("export completion panel", () => {
  it("announces progress and offers retry after generation failure", () => {
    const progress = renderThanks("generating");
    expect(screen.getByRole("status").textContent).toContain(
      "Preparing crops and generating the ZIP archive",
    );
    expect(screen.queryByRole("button", { name: "Download ZIP" })).toBeNull();
    cleanup();

    const failure = renderThanks("error");
    fireEvent.click(screen.getByRole("button", { name: "Retry generation" }));
    expect(failure.retryExport).toHaveBeenCalledOnce();
    expect(progress.downloadArchive).not.toHaveBeenCalled();
  });

  it("shows actual export details and keeps download separate from saving", () => {
    const { downloadArchive, saveArchiveSession } = renderThanks("success");

    expect(screen.getByText("photoslicer-export.zip")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Complete offline package" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Persistent browser storage" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Download complete ZIP package" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Save session in this browser" }),
    ).toBeTruthy();
    const libraryLink = screen.getByRole("link", { name: "Go to saved archives" });
    expect(libraryLink.getAttribute("href")).toBe("/archives");
    expect(libraryLink.parentElement?.className).toBe("export-completion__library");
    expect(libraryLink.parentElement?.previousElementSibling?.className).toBe(
      "export-completion__actions",
    );
    expect(downloadArchive).not.toHaveBeenCalled();
    expect(saveArchiveSession).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", { name: "Download complete ZIP package" }),
    );
    expect(downloadArchive).toHaveBeenCalledOnce();
    expect(saveArchiveSession).not.toHaveBeenCalled();
  });
});
