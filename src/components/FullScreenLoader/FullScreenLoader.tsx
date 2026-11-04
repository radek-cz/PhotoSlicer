import { useLocalization } from "../../lib/i18n/useLocalization";
import "./FullScreenLoader.css";

type FullScreenLoaderProps = {
  text?: string;
  opacity?: number;
  visible?: boolean;
};

export const FullScreenLoader = ({
  text,
  opacity = 0.6,
  visible = true,
}: FullScreenLoaderProps) => {
  const { t } = useLocalization();
  const loadingText = text ?? t("common.loading");

  if (!visible) {
    return null;
  }

  return (
    <div
      className="full-screen-loader"
      style={{
        backgroundColor: `rgba(0, 0, 0, ${opacity})`,
      }}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={loadingText}
    >
      <div
        className="full-screen-loader__spinner"
        aria-hidden="true"
      />

      {loadingText && (
        <p className="full-screen-loader__text">
          {loadingText}
        </p>
      )}
    </div>
  );
};