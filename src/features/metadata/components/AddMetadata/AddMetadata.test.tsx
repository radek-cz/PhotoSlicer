import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MetadataEditorImage } from "../../../../types/image";
import type { ImageMetadata, RegionId } from "../../../../types/imageOperations";
import { LocalizationProvider } from "../../../../lib/i18n/components/LocalizationProvider/LocalizationProvider";
import i18n from "../../../../lib/i18n/i18n";
import { loadMetadataEditorImages } from "../../../../lib/imageWorkflow";
import { AddMetadata } from "./AddMetadata";

vi.mock("../../../../lib/imageWorkflow", () => ({
  cloneSavedImageData: (images: readonly MetadataEditorImage[]) =>
    images.map((image) => ({
      imageId: image.imageId,
      metadatas: new Map(
        Array.from(image.metadatas, ([id, metadata]) => [id, { ...metadata }]),
      ),
    })),
  loadMetadataEditorImages: vi.fn(),
  patchMetadataForImage: (
    images: readonly MetadataEditorImage[],
    imageIndex: number,
    regionId: RegionId,
    patch: Partial<ImageMetadata>,
  ) =>
    images.map((image, index) => {
      if (index !== imageIndex) return image;
      const metadatas = new Map(image.metadatas);
      const metadata = metadatas.get(regionId);
      if (metadata) metadatas.set(regionId, { ...metadata, ...patch });
      return { ...image, metadatas };
    }),
}));

vi.mock("../../../../lib/browserImageOperations", () => ({
  createObjectUrl: vi.fn(),
  orientImageBlob: vi.fn(),
  revokeObjectUrls: vi.fn(),
}));

function createEditorImage(): MetadataEditorImage {
  const images = new Map<RegionId, Blob>([
    ["a", new Blob(["a"])],
    ["b", new Blob(["b"])],
  ]);
  return {
    imageId: "scan-1",
    images,
    blobUrls: new Map([
      ["a", "blob:crop-a"],
      ["b", "blob:crop-b"],
    ]),
    metadatas: new Map([
      ["a", { title: "", description: "", rotation: 0 }],
      ["b", { title: "Portrait", description: "", rotation: 0 }],
    ]),
  };
}

describe("AddMetadata", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    vi.mocked(loadMetadataEditorImages).mockResolvedValue([createEditorImage()]);
  });

  it("filters records without losing edits and requires titles before export", async () => {
    const onSave = vi.fn();
    render(
      <LocalizationProvider>
        <AddMetadata onSave={onSave} />
      </LocalizationProvider>,
    );

    expect(await screen.findByText("All 2 crop records")).toBeTruthy();
    const save = screen.getByRole("button", { name: "Continue to export (1 crop ready)" });
    expect(save.hasAttribute("disabled")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Incomplete (1)" }));
    expect(screen.getByText("Image 1 · crop a")).toBeTruthy();
    expect(screen.queryByText("Image 1 · crop b")).toBeNull();

    fireEvent.change(screen.getByRole("textbox", { name: "Photo title" }), {
      target: { value: "A newly catalogued crop" },
    });
    fireEvent.click(screen.getByRole("button", { name: "All (2)" }));

    const yearButtons = screen.getAllByRole("button", { name: "Year" });
    fireEvent.click(yearButtons[0]);
    fireEvent.change(screen.getAllByRole("textbox", { name: "Year" })[0], {
      target: { value: "1950" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Decade" })[0]);
    fireEvent.change(screen.getAllByRole("textbox", { name: "Decade" })[0], {
      target: { value: "1960" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Year" })[0]);
    const personTag = screen.getAllByRole("textbox", { name: "Add a person tag" })[0];
    fireEvent.change(personTag, { target: { value: "Ada" } });
    fireEvent.keyDown(personTag, { key: "Enter" });

    await i18n.changeLanguage("pl");
    const localizedTitles = screen.getAllByRole("textbox", { name: "Tytuł fotografii" });
    expect(localizedTitles[0]).toHaveProperty("value", "A newly catalogued crop");
    await i18n.changeLanguage("en");
    const titles = screen.getAllByRole("textbox", { name: "Photo title" });
    expect(titles[0]).toHaveProperty("value", "A newly catalogued crop");
    expect(screen.getByRole("button", { name: "Continue to export (2 crops ready)" }).hasAttribute("disabled")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Continue to export (2 crops ready)" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(onSave.mock.calls[0][0][0].metadatas.get("a")?.title).toBe("A newly catalogued crop");
    expect(onSave.mock.calls[0][0][0].metadatas.get("a")?.dateValues).toEqual({
      year: "1950",
      decade: "1960",
    });
    expect(onSave.mock.calls[0][0][0].metadatas.get("a")?.people).toEqual(["Ada"]);
  });
});
