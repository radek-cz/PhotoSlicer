import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LanguageSwitcher } from "../LanguageSwitcher/LanguageSwitcher";
import { useLocalization } from "../../lib/i18n/useLocalization";
import {
  isWorkflowStep,
  onWorkflowDraftChanged,
  workflowStepIndex,
  WORKFLOW_STEPS,
  workflowDraftRepository,
  type WorkflowStep,
} from "../../lib/workflowDraft";
import "./Header.css";

const Header = () => {
  const { t } = useLocalization();
  const location = useLocation();
  const requestedDraftId = new URLSearchParams(location.search).get("draft");
  const [availableThrough, setAvailableThrough] =
    useState<WorkflowStep>("upload");

  useEffect(() => {
    let cancelled = false;

    const refreshDraft = async () => {
      if (!requestedDraftId) {
        setAvailableThrough("upload");
        return;
      }
      try {
        const step =
          await workflowDraftRepository.getAvailableThrough(requestedDraftId);
        if (!cancelled) {
          setAvailableThrough(step ?? "upload");
        }
      } catch (error) {
        console.error("Couldn't read workflow draft status", error);
        if (!cancelled) setAvailableThrough("upload");
      }
    };

    void refreshDraft();

    const unsubscribe = onWorkflowDraftChanged(() => {
      void refreshDraft();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [requestedDraftId]);

  const requestedStep = location.pathname.split("/").at(-1) ?? "";
  const activeStep =
    location.pathname === "/"
      ? "upload"
      : location.pathname.startsWith("/generate/") &&
          isWorkflowStep(requestedStep)
        ? requestedStep
        : null;

  return (
    <header className="header">
      <div
        className="header__identity"
        role="group"
        aria-label={t("navigation.productName")}
      >
        <span className="header__brand-mark" aria-hidden="true" />
        <span className="header__product-name">
          {t("navigation.productName")}
        </span>
        <span className="header__product-tag">
          {t("navigation.productTag")}
        </span>
      </div>

      <nav className="nav" aria-label={t("navigation.workflowLabel")}>
        {WORKFLOW_STEPS.map((step, index) => {
          const isActive = activeStep === step;
          const isCompleted =
            activeStep !== null &&
            workflowStepIndex(step) < workflowStepIndex(activeStep);
          const isUnavailable =
            workflowStepIndex(step) > workflowStepIndex(availableThrough);
          const label = t(`navigation.steps.${step}`);
          const className = [
            "nav__step",
            isActive && "nav__step--active",
            isCompleted && "nav__step--completed",
            isUnavailable && "nav__step--unavailable",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <span className="nav__item" key={step}>
              {isUnavailable ? (
                <button
                  type="button"
                  aria-disabled="true"
                  aria-label={`${String(index + 1).padStart(2, "0")}. ${label} — ${t("navigation.unavailable")}`}
                  className={className}
                  disabled
                  title={t("navigation.unavailable")}
                >
                  <span className="nav__step-number" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {label}
                </button>
              ) : (
                <Link
                  aria-current={isActive ? "step" : undefined}
                  aria-label={
                    isActive
                      ? `${String(index + 1).padStart(2, "0")}. ${label} — ${t("navigation.active")}`
                      : isCompleted
                        ? `${String(index + 1).padStart(2, "0")}. ${label} — ${t("navigation.completed")}`
                        : undefined
                  }
                  className={className}
                  to={
                    step === "upload"
                      ? "/"
                      : requestedDraftId
                        ? `/generate/${step}?draft=${encodeURIComponent(requestedDraftId)}`
                        : `/generate/${step}`
                  }
                >
                  <span className="nav__step-number" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {label}
                </Link>
              )}
              {index < WORKFLOW_STEPS.length - 1 && (
                <span className="nav__separator" aria-hidden="true">
                  /
                </span>
              )}
            </span>
          );
        })}
      </nav>

      <div className="header__actions">
        <Link to="/archives" className="archive-link">
          {t("navigation.archives")}
        </Link>
        <span className="header__divider" aria-hidden="true" />
        <LanguageSwitcher />
      </div>
    </header>
  );
};

export default Header;
