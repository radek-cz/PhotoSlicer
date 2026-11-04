import { useOutletContext } from "react-router-dom";
import { SelectRegions } from "../../../../features/region-selection/components/SelectRegions/SelectRegions";
import type { GenerateSlicesContext } from "../../useGenerateSlicesWorkflow";

export const RegionsStep = () => {
  const {
    previewImages,
    handleRegionsChange,
    handleSelectRegionsComplete,
    startImport,
  } = useOutletContext<GenerateSlicesContext>();

  if (previewImages.length === 0) return null;

  return (
    <SelectRegions
      previewImages={previewImages}
      onComplete={handleSelectRegionsComplete}
      onStartImport={startImport}
      onRegionsChange={handleRegionsChange}
    />
  );
};
