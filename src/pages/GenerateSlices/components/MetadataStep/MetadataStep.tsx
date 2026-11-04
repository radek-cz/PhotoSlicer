import { useOutletContext } from "react-router-dom";
import { AddMetadata } from "../../../../features/metadata/components/AddMetadata/AddMetadata";
import type { GenerateSlicesContext } from "../../useGenerateSlicesWorkflow";

export const MetadataStep = () => {
  const {
    initialMetadata,
    saveMetadataToDraft,
    handleMetadataSave,
  } = useOutletContext<GenerateSlicesContext>();

  return (
    <AddMetadata
      initialMetadata={initialMetadata}
      onChange={saveMetadataToDraft}
      onSave={handleMetadataSave}
    />
  );
};
