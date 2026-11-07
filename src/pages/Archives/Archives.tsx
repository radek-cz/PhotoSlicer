import { useCallback, useEffect, useReducer } from "react";
import { downloadBlob } from "../../lib/browserImageOperations";
import { useLocalization } from "../../lib/i18n/useLocalization";
import {
  archiveSessionRepository,
  type ArchiveSessionSummary,
} from "../../features/archive-sessions/services/archiveSessionRepository";
import "./Archives.css";

interface ArchivesState {
  sessions: ArchiveSessionSummary[];
  isLoading: boolean;
  hasLoadError: boolean;
  hasDownloadError: boolean;
  hasDeleteError: boolean;
  deletingId: string | null;
}

type ArchivesAction =
  | { type: "load-start" }
  | { type: "load-success"; sessions: ArchiveSessionSummary[] }
  | { type: "load-error" }
  | { type: "download-start" }
  | { type: "download-error" }
  | { type: "delete-start"; id: string }
  | { type: "delete-success"; id: string }
  | { type: "delete-error" };

const initialState: ArchivesState = {
  sessions: [],
  isLoading: true,
  hasLoadError: false,
  hasDownloadError: false,
  hasDeleteError: false,
  deletingId: null,
};

function archivesReducer(
  state: ArchivesState,
  action: ArchivesAction,
): ArchivesState {
  switch (action.type) {
    case "load-start":
      return { ...state, isLoading: true, hasLoadError: false };
    case "load-success":
      return { ...state, sessions: action.sessions, isLoading: false };
    case "load-error":
      return { ...state, isLoading: false, hasLoadError: true };
    case "download-start":
      return { ...state, hasDownloadError: false };
    case "download-error":
      return { ...state, hasDownloadError: true };
    case "delete-start":
      return {
        ...state,
        deletingId: action.id,
        hasDeleteError: false,
      };
    case "delete-success":
      return {
        ...state,
        sessions: state.sessions.filter((session) => session.id !== action.id),
        deletingId: null,
      };
    case "delete-error":
      return { ...state, deletingId: null, hasDeleteError: true };
  }
}

const Archives = () => {
  const { formatFileSize, formatNumber, locale, t } = useLocalization();
  const [state, dispatch] = useReducer(archivesReducer, initialState);

  const loadSessions = useCallback(
    async (isActive: () => boolean = () => true) => {
      dispatch({ type: "load-start" });
      try {
        const sessions = await archiveSessionRepository.list();
        if (isActive()) dispatch({ type: "load-success", sessions });
      } catch (error) {
        console.error("Couldn't load saved archive sessions", error);
        if (isActive()) dispatch({ type: "load-error" });
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    void loadSessions(() => !cancelled);
    return () => {
      cancelled = true;
    };
  }, [loadSessions]);

  const handleDownload = async (id: string) => {
    dispatch({ type: "download-start" });
    try {
      const session = await archiveSessionRepository.get(id);
      if (!session) throw new Error(`Saved archive session not found: ${id}`);
      downloadBlob(
        new Blob([session.zipData], { type: "application/zip" }),
        session.filename,
      );
    } catch (error) {
      console.error("Couldn't download saved archive", error);
      dispatch({ type: "download-error" });
    }
  };

  const handleDelete = async (session: ArchiveSessionSummary) => {
    if (!window.confirm(t("archives.deleteConfirmation", { filename: session.filename }))) {
      return;
    }
    dispatch({ type: "delete-start", id: session.id });
    try {
      await archiveSessionRepository.delete(session.id);
      dispatch({ type: "delete-success", id: session.id });
    } catch (error) {
      console.error("Couldn't delete saved archive session", error);
      dispatch({ type: "delete-error" });
    }
  };

  return (
    <section className="archives-page" aria-labelledby="archives-title">
      <header className="archives-page__header">
        <p className="archives-page__eyebrow">{t("archives.eyebrow")}</p>
        <div className="archives-page__title-row">
          <h1 id="archives-title">{t("archives.title")}</h1>
        </div>
        <p>{t("archives.description")}</p>
      </header>
      {state.isLoading ? (
        <p role="status">{t("common.loading")}</p>
      ) : state.hasLoadError ? (
        <div>
          <p role="alert">{t("archives.loadError")}</p>
          <button type="button" onClick={() => void loadSessions()}>
            {t("workflow.export.retry")}
          </button>
        </div>
      ) : state.sessions.length ? (
        <div className="archives-page__list">
          {state.sessions.map((session) => (
            <article className="archives-page__item" key={session.id}>
              <div className="archives-page__details">
                <h2>{session.filename}</h2>
                <dl>
                  <div>
                    <dt>{t("workflow.export.crops")}</dt>
                    <dd>{formatNumber(session.cropCount)}</dd>
                  </div>
                  <div>
                    <dt>{t("workflow.export.fileSize")}</dt>
                    <dd>{formatFileSize(session.zipSize)}</dd>
                  </div>
                  <div>
                    <dt>{t("archives.savedAt")}</dt>
                    <dd>
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(session.createdAt)}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="archives-page__actions">
                <button
                  type="button"
                  className="archives-page__download"
                  onClick={() => void handleDownload(session.id)}
                >
                  {t("workflow.export.download")}
                </button>
                <button
                  type="button"
                  className="archives-page__delete"
                  disabled={state.deletingId === session.id}
                  onClick={() => void handleDelete(session)}
                >
                  {state.deletingId === session.id
                    ? t("archives.deleting")
                    : t("archives.delete")}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="archives-page__empty">{t("archives.empty")}</p>
      )}
      {state.hasDownloadError && <p role="alert">{t("archives.downloadError")}</p>}
      {state.hasDeleteError && <p role="alert">{t("archives.deleteError")}</p>}
      <p className="archives-page__safe-note">{t("archives.deleteSafeNote")}</p>
    </section>
  );
};

export default Archives;
