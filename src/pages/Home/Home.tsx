
import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import { Card } from "../../components/Card/Card";
import { useLocalization } from "../../lib/i18n/useLocalization";
import { Upload } from "../../features/image-upload/components/Upload/Upload";
import type { WorkflowStep } from "../../lib/workflowDraft";
import { WorkflowDraftQueue } from "./components/WorkflowDraftQueue/WorkflowDraftQueue";
import type { LoadImageResult } from "../../types/imageOperations";
import "./Home.css";

type HomeProps = {
  onComplete: (files: File[], previewImages: LoadImageResult[]) => void;
  onStartImport?: () => Promise<boolean>;
  onResumeDraft?: (id: string, step: WorkflowStep) => void;
};

const Home = ({
  onComplete,
  onStartImport = async () => true,
  onResumeDraft = () => undefined,
}: HomeProps) => {
  const { t } = useLocalization();
  const handleImportLinkClick = (
    event: MouseEvent<HTMLAnchorElement>,
  ) => {
    event.preventDefault();
    void onStartImport()
      .then((started) => {
        if (started) {
          document
            .getElementById("image-upload")
            ?.scrollIntoView({ behavior: "smooth" });
        }
      })
      .catch((error) => {
        console.error("Couldn't start a new import", error);
      });
  };
  const capabilityCards = [
    {
      number: "01",
      title: t("home.capabilities.import.title"),
      description: t("home.capabilities.import.description"),
    },
    {
      number: "02",
      title: t("home.capabilities.detection.title"),
      description: t("home.capabilities.detection.description"),
    },
    {
      number: "03",
      title: t("home.capabilities.metadata.title"),
      description: t("home.capabilities.metadata.description"),
    },
    {
      number: "04",
      title: t("home.capabilities.storage.title"),
      description: t("home.capabilities.storage.description"),
    },
  ];

  return (
    <div className="home-page">
      <section className="home-page__hero" aria-labelledby="home-title">
        <p className="home-page__eyebrow">{t("home.eyebrow")}</p>
        <h1 id="home-title">{t("home.title")}</h1>
        <p className="home-page__intro">{t("home.description")}</p>
        <a
          className="home-page__primary-link"
          href="#image-upload"
          onClick={handleImportLinkClick}
        >
          {t("home.importCta")}
        </a>
      </section>

      <section
        className="home-page__capabilities"
        aria-label={t("home.capabilitiesLabel")}
      >
        {capabilityCards.map(({ number, title, description }) => (
          <Card className="home-page__capability-card" key={number}>
            <span className="home-page__card-number" aria-hidden="true">
              {number}
            </span>
            <h2>{title}</h2>
            <p>{description}</p>
          </Card>
        ))}
      </section>

      <section className="home-page__import" aria-labelledby="home-import-title">
        <h2 id="home-import-title">{t("home.importTitle")}</h2>
        <p>{t("home.importDescription")}</p>
        <Upload onComplete={onComplete} />
      </section>

      <aside className="home-page__local-note">
        <span className="home-page__local-mark" aria-hidden="true" />
        <p>{t("home.localProcessing")}</p>
      </aside>

      <WorkflowDraftQueue onResumeDraft={onResumeDraft} />

      <p className="home-page__archives-link">
        <Link to="/archives">{t("home.archivesCta")}</Link>
      </p>
    </div>
  );
};

export default Home;