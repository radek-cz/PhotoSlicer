import { useState, type ReactNode } from "react";
import "./BottomPanel.css";
import { useLocalization } from "../../lib/i18n/useLocalization";

type BottomPanelProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

export function BottomPanel({
  title,
  children,
  defaultOpen = true,
}: BottomPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { t } = useLocalization();

  return (
    <div className={`bottom-panel ${isOpen ? "is-open" : "is-closed"}`}>
      <div className="bottom-panel__header">
        <div className="bottom-panel__title">
          {title}
        </div>

        <button
          type="button"
          className="bottom-panel__toggle"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-label={isOpen ? t("panel.collapse") : t("panel.expand")}
        >
          {isOpen ? "⌄" : "⌃"}
        </button>
      </div>

      <div className="bottom-panel__content">
        {children}
      </div>
    </div>
  );
}