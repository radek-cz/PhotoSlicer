import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Thanks } from "../Thanks/Thanks";
import type { GenerateSlicesContext } from "../../useGenerateSlicesWorkflow";

export const ExportStep = () => {
  const context = useOutletContext<GenerateSlicesContext>();
  const { retryExport } = context;

  useEffect(() => {
    void retryExport();
  }, [retryExport]);

  return <Thanks {...context} />;
};
