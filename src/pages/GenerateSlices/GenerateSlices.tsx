import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useLocalization } from "../../lib/i18n/useLocalization";
import { useGenerateSlicesWorkflow } from "./useGenerateSlicesWorkflow";
import "./GenerateSlices.css";

const GenerateSlices = () => {
  const { formatNumber, t } = useLocalization();
  const location = useLocation();
  const workflow = useGenerateSlicesWorkflow();
  const [now, setNow] = useState(Date.now);
  const isRegionEditor = location.pathname === "/generate/regions";
  const isMetadataEditor = location.pathname === "/generate/metadata";
  const showDraftTimer =
    location.pathname !== "/" &&
    location.pathname !== "/generate/regions" &&
    location.pathname !== "/generate/metadata" &&
    location.pathname !== "/generate/export";

  useEffect(() => {
    if (!showDraftTimer || workflow.draftExpiresAt === null) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [showDraftTimer, workflow.draftExpiresAt]);

  if (!workflow.isDraftReady) {
    return <p role="status">{t("common.loading")}</p>;
  }

  const remainingSeconds =
    workflow.draftExpiresAt === null
      ? null
      : Math.max(0, Math.ceil((workflow.draftExpiresAt - now) / 1000));
  const remainingTime =
    remainingSeconds === null
      ? null
      : `${formatNumber(Math.floor(remainingSeconds / 60))}:${String(
          remainingSeconds % 60,
        ).padStart(2, "0")}`;

  return (
    <>
      {location.pathname !== "/" && !isRegionEditor && !isMetadataEditor && (
        <h1>{t("workflow.title")}</h1>
      )}
      {workflow.hasDraftLoadError && (
        <p role="alert">{t("workflow.draftLoadError")}</p>
      )}
      {workflow.hasDraftSaveError && (
        <p role="alert">{t("workflow.draftSaveError")}</p>
      )}
      {workflow.hasDraftExpired && (
        <p role="status">{t("workflow.draftExpired")}</p>
      )}
      {workflow.hasPreviewError && (
        <p role="alert">{t("image.regions.previewError")}</p>
      )}
      {remainingTime !== null && showDraftTimer && (
        <p className="workflow-draft-timer" role="timer">
          {t("workflow.draftExpiresIn", { time: remainingTime })}
        </p>
      )}
      <Outlet context={workflow.context} />
    </>
  );
};

export default GenerateSlices;
