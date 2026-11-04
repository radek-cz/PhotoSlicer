import type { useLocalization } from "../../../../lib/i18n/useLocalization";

export type UploadQueueProps = {
  files: File[];
  formatFileSize: (bytes: number) => string;
  formatNumber: (value: number) => string;
  isLoading: boolean;
  onRemove: (index: number) => void;
  t: ReturnType<typeof useLocalization>["t"];
};

export const UploadQueue = ({
  files,
  formatFileSize,
  formatNumber,
  isLoading,
  onRemove,
  t,
}: UploadQueueProps) => {
  if (files.length === 0) {
    return null;
  }

  return (
    <section className="upload__queue" aria-label={t("image.upload.queueLabel")}>
      <h3>
        {t("image.upload.selectedCount", {
          count: files.length,
          formatted: formatNumber(files.length),
        })}
      </h3>
      <ul className="upload__file-list">
        {files.map((file, index) => (
          <li
            className="upload__file"
            key={`${file.name}-${file.lastModified}-${index}`}
          >
            <span className="upload__file-name">{file.name}</span>
            <span className="upload__file-size">{formatFileSize(file.size)}</span>
            <button
              type="button"
              disabled={isLoading}
              aria-label={t("image.upload.removeFile", { filename: file.name })}
              onClick={() => onRemove(index)}
            >
              {t("image.upload.remove")}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};
