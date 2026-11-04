import { useId, useState, type ChangeEvent, type DragEvent } from "react";
import { FullScreenLoader } from "../../../../components/FullScreenLoader/FullScreenLoader";
import { useLocalization } from "../../../../lib/i18n/useLocalization";
import { importImageFiles } from "../../../../lib/imageWorkflow";
import { imageOperationsWorkerService } from "../../../../services/imageOperationsWorkerService";
import type { LoadImageResult } from "../../../../types/imageOperations";
import { UploadQueue } from "../UploadQueue/UploadQueue";
import "./Upload.css";

const ACCEPTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg"]);

type UploadProps = {
  onComplete: (files: File[], previewImages: LoadImageResult[]) => void;
};

export const Upload = ({ onComplete }: UploadProps) => {
  const [isLoading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errorKey, setErrorKey] = useState<
    "error" | "unsupportedError" | null
  >(null);
  const [isDragActive, setDragActive] = useState(false);
  const { formatFileSize, formatNumber, t } = useLocalization();
  const inputId = useId();

  const handleFiles = (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) {
      return;
    }
    const validFiles = selectedFiles.filter((file) =>
      ACCEPTED_IMAGE_TYPES.has(file.type),
    );
    const hasUnsupportedFiles = validFiles.length !== selectedFiles.length;
    setErrorKey(hasUnsupportedFiles ? "unsupportedError" : null);
    if (validFiles.length === 0) return;
    setSelectedFiles((current) => [...current, ...validFiles]);
  };

  const handleImport = async () => {
    if (!selectedFiles.length || isLoading) return;
    setErrorKey(null);
    setLoading(true);

    try {
      await imageOperationsWorkerService.clearProcessedImages();
      const results = await importImageFiles(selectedFiles);
      const failedResults = results.flatMap((result, index) => {
        if (result.status === "fulfilled") return [];
        console.error(
          `Couldn't import selected image "${selectedFiles[index]?.name ?? index}"`,
          result.reason,
        );
        return [result];
      });

      if (failedResults.length) {
        setErrorKey("error");
        return;
      }

      const imported = results.flatMap((result) =>
        result.status === "fulfilled" ? [result.value] : [],
      );
      await onComplete(
        imported.map((item) => item.file),
        imported.map((item) => item.image),
      );
      setSelectedFiles([]);
    } catch (error) {
      console.error("Couldn't import selected images", error);
      setErrorKey("error");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";
    handleFiles(selectedFiles);
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    if (
      event.relatedTarget instanceof Node &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }
    setDragActive(false);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragActive(false);
    handleFiles(Array.from(event.dataTransfer.files));
  };

  return (
    <>
      {isLoading && <FullScreenLoader text={t("image.upload.loading")} />}
      <div className="upload" id="image-upload">
        <label
          className={`upload__dropzone${isDragActive ? " upload__dropzone--active" : ""}${isLoading ? " upload__dropzone--disabled" : ""}`}
          htmlFor={inputId}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
            <input
              id={inputId}
              className="upload__input"
              type="file"
              aria-label={t("image.upload.label")}
              accept="image/png, image/jpeg"
              multiple
              disabled={isLoading}
              onChange={handleChange}
            />
          <span className="upload__prompt">
            {isDragActive
              ? t("image.upload.dropActive")
              : t("image.upload.dropHint")}
          </span>
          <span className="upload__browse">{t("image.upload.browseHint")}</span>
        </label>
        {errorKey && (
          <p className="upload__error" role="alert">
            {t(`image.upload.${errorKey}`)}
          </p>
        )}
        <UploadQueue
          files={selectedFiles}
          formatFileSize={formatFileSize}
          formatNumber={formatNumber}
          isLoading={isLoading}
          onRemove={(index) =>
            setSelectedFiles((current) =>
              current.filter((_, fileIndex) => fileIndex !== index),
            )
          }
          t={t}
        />
        <button
          className="upload__submit"
          type="button"
          disabled={selectedFiles.length === 0 || isLoading}
          onClick={() => void handleImport()}
        >
          {isLoading ? t("image.upload.loading") : t("image.upload.importAction")}
        </button>
      </div>
    </>
  );
};