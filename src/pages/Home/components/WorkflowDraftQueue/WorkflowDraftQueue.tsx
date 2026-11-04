import { useEffect, useState } from "react";
import { FaEye, FaTrash } from "react-icons/fa";
import { useLocalization } from "../../../../lib/i18n/useLocalization";
import {
  areWorkflowDraftsEnabled,
  onWorkflowDraftChanged,
  onWorkflowDraftSettingsChanged,
  setWorkflowDraftsEnabled,
  workflowDraftRepository,
  type WorkflowDraftSummary,
} from "../../../../lib/workflowDraft";
import type { WorkflowStep } from "../../../../lib/workflowDraft";
import "./WorkflowDraftQueue.css";

type WorkflowDraftQueueProps = {
  onResumeDraft: (id: string, step: WorkflowStep) => void;
};

export const WorkflowDraftQueue = ({
  onResumeDraft,
}: WorkflowDraftQueueProps) => {
  const { locale, formatNumber, t } = useLocalization();
  const [drafts, setDrafts] = useState<WorkflowDraftSummary[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [draftsEnabled, setDraftsEnabled] = useState(
    areWorkflowDraftsEnabled,
  );
  const [isUpdatingSetting, setIsUpdatingSetting] = useState(false);
  const [hasSettingError, setHasSettingError] = useState(false);
  const [hasDeleteError, setHasDeleteError] = useState(false);
  const [deletingDraftIds, setDeletingDraftIds] = useState<Set<string>>(
    new Set(),
  );
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    let active = true;
    let expiryTimeout: number | undefined;

    const loadDrafts = async () => {
      try {
        const nextDrafts = areWorkflowDraftsEnabled()
          ? await workflowDraftRepository.list()
          : [];
        if (!active) return;
        setDrafts(nextDrafts);
        setHasLoadError(false);
        setLoading(false);

        if (expiryTimeout !== undefined) {
          window.clearTimeout(expiryTimeout);
        }
        const nextExpiry = nextDrafts.reduce(
          (nearest, draft) => Math.min(nearest, draft.expiresAt),
          Number.POSITIVE_INFINITY,
        );
        if (Number.isFinite(nextExpiry)) {
          expiryTimeout = window.setTimeout(
            () => void loadDrafts(),
            Math.max(0, nextExpiry - Date.now()),
          );
        }
      } catch (error) {
        if (!active) return;
        console.error("Couldn't load workflow draft queue", error);
        setHasLoadError(true);
        setLoading(false);
      }
    };

    void loadDrafts();
    const unsubscribe = onWorkflowDraftChanged(() => {
      void loadDrafts();
    });
    const unsubscribeSettings = onWorkflowDraftSettingsChanged(() => {
      setDraftsEnabled(areWorkflowDraftsEnabled());
      void loadDrafts();
    });
    const countdownInterval = window.setInterval(() => setNow(Date.now()), 1000);

    return () => {
      active = false;
      if (expiryTimeout !== undefined) {
        window.clearTimeout(expiryTimeout);
      }
      unsubscribe();
      unsubscribeSettings();
      window.clearInterval(countdownInterval);
    };
  }, []);

  const handleDraftsEnabledChange = async (enabled: boolean) => {
    setIsUpdatingSetting(true);
    setHasSettingError(false);
    try {
      await setWorkflowDraftsEnabled(enabled);
      setDraftsEnabled(enabled);
    } catch (error) {
      console.error("Couldn't update workflow draft settings", error);
      setHasSettingError(true);
    } finally {
      setIsUpdatingSetting(false);
    }
  };

  const handleDeleteDraft = async (id: string) => {
    setDeletingDraftIds((current) => new Set(current).add(id));
    setHasDeleteError(false);
    try {
      await workflowDraftRepository.delete(id);
    } catch (error) {
      console.error("Couldn't delete workflow draft", error);
      setHasDeleteError(true);
    } finally {
      setDeletingDraftIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  };

  const formatActivityTime = (timestamp: number) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(timestamp);

  const formatRemainingTime = (expiresAt: number) => {
    const remainingSeconds = Math.max(
      0,
      Math.ceil((expiresAt - now) / 1000),
    );
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${formatNumber(minutes)}:${String(seconds).padStart(2, "0")}`;
  };

  return (
    <section
      className="workflow-draft-queue"
      aria-labelledby="workflow-draft-queue-title"
    >
      <h2 id="workflow-draft-queue-title">{t("home.workQueueTitle")}</h2>
      <p>{t("home.workQueueDescription")}</p>
      <label className="workflow-draft-queue__setting">
        <span>{t("home.workQueueToggle")}</span>
        <input
          type="checkbox"
          role="switch"
          checked={draftsEnabled}
          disabled={isUpdatingSetting}
          onChange={(event) =>
            void handleDraftsEnabledChange(event.currentTarget.checked)
          }
        />
        <span className="workflow-draft-queue__switch" aria-hidden="true" />
      </label>
      {hasSettingError && (
        <p role="alert">{t("home.workQueueSettingError")}</p>
      )}
      {hasDeleteError && <p role="alert">{t("home.workQueueDeleteError")}</p>}
      {isLoading ? (
        <p role="status">{t("common.loading")}</p>
      ) : hasLoadError ? (
        <p role="alert">{t("home.workQueueLoadError")}</p>
      ) : !draftsEnabled ? (
        <p>{t("home.workQueueDisabled")}</p>
      ) : drafts.length === 0 ? (
        <p>{t("home.workQueueEmpty")}</p>
      ) : (
        <ul className="workflow-draft-queue__list">
          {drafts.map((draft) => {
            const firstFileName = draft.fileNames[0] ?? "";
            const extraFileCount = draft.imageCount - 1;
            return (
              <li className="workflow-draft-queue__item" key={draft.id}>
                <div className="workflow-draft-queue__details">
                  <h3 title={draft.fileNames.join(", ")}>
                    {firstFileName}
                    {extraFileCount > 0 &&
                      ` ${t("home.workQueueMoreFiles", {
                        count: formatNumber(extraFileCount),
                      })}`}
                  </h3>
                  <p>
                    {t("home.workQueueStep", {
                      step: t(`navigation.steps.${draft.availableThrough}`),
                    })}
                    {" · "}
                    {t("home.workQueueUpdated", {
                      date: formatActivityTime(draft.lastActivityAt),
                    })}
                    {" · "}
                    {t("home.workQueueExpiresIn", {
                      time: formatRemainingTime(draft.expiresAt),
                    })}
                  </p>
                </div>
                <div className="workflow-draft-queue__actions">
                  <button
                    className="workflow-draft-queue__resume"
                    type="button"
                    aria-label={t("home.resumeDraft", {
                      filename: firstFileName,
                    })}
                    onClick={() =>
                      onResumeDraft(draft.id, draft.availableThrough)
                    }
                  >
                    <FaEye aria-hidden="true" />
                  </button>
                  <button
                    className="workflow-draft-queue__delete"
                    type="button"
                    aria-label={t("home.deleteDraft", {
                      filename: firstFileName,
                    })}
                    disabled={deletingDraftIds.has(draft.id)}
                    onClick={() => void handleDeleteDraft(draft.id)}
                  >
                    <FaTrash aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
