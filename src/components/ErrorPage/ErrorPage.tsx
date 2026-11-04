import {
  MdBlock,
  MdCloudOff,
  MdOutlineReportProblem,
  MdOutlineSearchOff,
} from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import { useLocalization } from "../../lib/i18n/useLocalization";
import type { TranslationKey } from "../../lib/i18n/i18n";
import "./ErrorPage.css";

export type ErrorPageType =
  | "not-found"
  | "forbidden"
  | "server-error"
  | "service-unavailable";

const errorContent: Record<
  ErrorPageType,
  { code: string; title: TranslationKey; description: TranslationKey; icon: typeof MdBlock }
> = {
  "not-found": {
    code: "404",
    title: "errors.notFound.title",
    description: "errors.notFound.description",
    icon: MdOutlineSearchOff,
  },
  forbidden: {
    code: "403",
    title: "errors.forbidden.title",
    description: "errors.forbidden.description",
    icon: MdBlock,
  },
  "server-error": {
    code: "500",
    title: "errors.serverError.title",
    description: "errors.serverError.description",
    icon: MdOutlineReportProblem,
  },
  "service-unavailable": {
    code: "503",
    title: "errors.serviceUnavailable.title",
    description: "errors.serviceUnavailable.description",
    icon: MdCloudOff,
  },
};

type ErrorPageProps = {
  type: ErrorPageType;
};

export function ErrorPage({ type }: ErrorPageProps) {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const content = errorContent[type];
  const Icon = content.icon;

  return (
    <section className="error-page" aria-labelledby="error-page-title">
      <div className="error-page__content">
        <div className="error-page__visual" aria-hidden="true">
          <span className="error-page__orbit error-page__orbit--outer" />
          <span className="error-page__orbit error-page__orbit--inner" />
          <span className="error-page__icon">
            <Icon />
          </span>
          <span className="error-page__code">{content.code}</span>
        </div>

        <p className="error-page__eyebrow">
          {t("errors.eyebrow")} <span>{content.code}</span>
        </p>
        <h1 className="error-page__title" id="error-page-title">
          {t(content.title)}
        </h1>
        <p className="error-page__description">{t(content.description)}</p>

        <div className="error-page__actions">
          <Link className="error-page__home-link" to="/">
            {t("errors.homeLink")}
          </Link>
          <button
            className="error-page__back-button"
            onClick={() => navigate(-1)}
            type="button"
          >
            {t("errors.backLink")}
          </button>
        </div>
      </div>
    </section>
  );
}
