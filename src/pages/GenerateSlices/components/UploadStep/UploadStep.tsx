import { useOutletContext } from "react-router-dom";
import { Upload } from "../../../../features/image-upload/components/Upload/Upload";
import type { GenerateSlicesContext } from "../../useGenerateSlicesWorkflow";

export const UploadStep = () => {
  const { handleUploadComplete } =
    useOutletContext<GenerateSlicesContext>();

  return <Upload onComplete={handleUploadComplete} />;
};
