import { Link, useLocation } from "react-router-dom";
import { useLocalization } from "../../../../lib/i18n/useLocalization";
import type { GenerateSlicesContext } from "../../useGenerateSlicesWorkflow";
import "./Thanks.css";

type ThanksProps = Pick<
  GenerateSlicesContext,
  | "exportStatus"
  | "exportDetails"
  | "hasDownloadError"
  | "archiveSaveStatus"
  | "retryExport"
  | "downloadArchive"
  | "saveArchiveSession"
>;

export const Thanks = ({
  exportStatus,
  exportDetails,
  hasDownloadError,
  archiveSaveStatus,
  retryExport,
  downloadArchive,
  saveArchiveSession,
}: ThanksProps) => {
  const { formatFileSize, formatNumber, t } = useLocalization();
  const location = useLocation();

  return (
    <section className="export-completion" aria-labelledby="export-title">
      <header className="export-completion__header">
        <p className="export-completion__eyebrow">
          {t("workflow.export.eyebrow")}
        </p>
        <h1 id="export-title">{t("workflow.export.title")}</h1>
        <p>{t("workflow.export.description")}</p>
        <Link
          className="export-completion__back"
          to={`/generate/metadata${location.search}`}
        >
          {t("workflow.export.backToMetadata")}
        </Link>
      </header>

      <div className="export-completion__panel">
        {exportStatus === "generating" && (
          <p className="export-completion__status" role="status" aria-live="polite">
            <span className="export-completion__spinner" aria-hidden="true" />
            {t("workflow.export.generating")}
          </p>
        )}

        {exportStatus === "error" && (
          <div className="export-completion__error" role="alert">
            <p>{t("workflow.export.generateError")}</p>
            <button type="button" onClick={() => void retryExport()}>
              {t("workflow.export.retry")}
            </button>
          </div>
        )}

        {exportStatus === "success" && exportDetails && (
          <>
            <p className="export-completion__status export-completion__status--success" role="status">
              {t("workflow.export.ready")}
            </p>
            <dl className="export-completion__details">
              <div>
                <dt>{t("workflow.export.filename")}</dt>
                <dd>{exportDetails.filename}</dd>
              </div>
              <div>
                <dt>{t("workflow.export.crops")}</dt>
                <dd>{formatNumber(exportDetails.cropCount)}</dd>
              </div>
              <div>
                <dt>{t("workflow.export.fileSize")}</dt>
                <dd>{formatFileSize(exportDetails.size)}</dd>
              </div>
            </dl>

            <div className="export-completion__actions">
              <section
                className="export-completion__card"
                aria-labelledby="export-package-title"
              >
                <h2 id="export-package-title">
                  {t("workflow.export.packageTitle")}
                </h2>
                <p className="export-completion__card-description">
                  {t("workflow.export.packageDescription")}
                </p>
                <button
                  className="export-completion__primary"
                  type="button"
                  onClick={downloadArchive}
                >
                  {t("workflow.export.download")}
                </button>
              </section>

              <section
                className="export-completion__card"
                aria-labelledby="export-storage-title"
              >
                <h2 id="export-storage-title">
                  {t("workflow.export.storageTitle")}
                </h2>
                <p className="export-completion__card-description">
                  {t("workflow.export.storageDescription")}
                </p>
                <div className="export-completion__card-actions">
                  <button
                    type="button"
                    disabled={
                      archiveSaveStatus === "saving" ||
                      archiveSaveStatus === "saved"
                    }
                    onClick={() => void saveArchiveSession()}
                  >
                    {t(
                      archiveSaveStatus === "saving"
                        ? "workflow.export.saving"
                        : archiveSaveStatus === "saved"
                          ? "workflow.export.saved"
                          : "workflow.export.saveSession",
                    )}
                  </button>
                </div>
                {archiveSaveStatus === "saved" && (
                  <p className="export-completion__notice" role="status">
                    {t("workflow.export.savedNotice")}
                  </p>
                )}
                {archiveSaveStatus === "error" && (
                  <p className="export-completion__error" role="alert">
                    {t("workflow.export.saveError")}
                  </p>
                )}
              </section>
            </div>

            <section
              className="export-completion__library"
              aria-labelledby="export-library-title"
            >
              <div>
                <h2 id="export-library-title">
                  {t("workflow.export.manageArchives")}
                </h2>
                <p>{t("workflow.export.manageArchivesDescription")}</p>
              </div>
              <Link
                className="export-completion__library-link"
                to="/archives"
              >
                {t("workflow.export.manageArchivesCta")}
              </Link>
            </section>

            {hasDownloadError && (
              <p className="export-completion__error" role="alert">
                {t("workflow.export.downloadError")}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
};
