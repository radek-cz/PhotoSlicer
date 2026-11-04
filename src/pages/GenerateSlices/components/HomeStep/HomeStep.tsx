import { useOutletContext } from "react-router-dom";
import Home from "../../../Home/Home";
import type { GenerateSlicesContext } from "../../useGenerateSlicesWorkflow";

export const HomeStep = () => {
  const { handleUploadComplete, startImport, resumeWorkflowDraft } =
    useOutletContext<GenerateSlicesContext>();

  return (
    <Home
      onComplete={handleUploadComplete}
      onStartImport={startImport}
      onResumeDraft={resumeWorkflowDraft}
    />
  );
};
