import { useEffect, useRef, useState } from "react";
import type { ImageMetadata, RegionId } from "../../../../types/imageOperations";
import type { MetadataEditorImage, SavedImageData } from "../../../../types/image";
import { revokeObjectUrls } from "../../../../lib/browserImageOperations";
import {
  cloneSavedImageData,
  loadMetadataEditorImages,
  patchMetadataForImage,
} from "../../../../lib/imageWorkflow";
import { useLocalization } from "../../../../lib/i18n/useLocalization";
import type { TranslationKey } from "../../../../lib/i18n/i18n";
import { useMetadataOrientation } from "../../hooks/useMetadataOrientation";
import {
  filterMetadataRecords,
  getMetadataCounts,
  getMetadataRecords,
  getOrientationTarget,
  metadataRecordId,
  resetOrientation,
  toggleMirror,
  type MetadataFilter,
  type MetadataRecord,
} from "../../utils/metadataUtils";
import { MetadataFilters } from "../MetadataFilters/MetadataFilters";
import { MetadataProgress } from "../MetadataProgress/MetadataProgress";
import { MetadataRecordCard } from "../MetadataRecordCard/MetadataRecordCard";
import "./AddMetadata.css";

interface Props {
  onSave: (data: SavedImageData[]) => void;
  initialMetadata?: SavedImageData[];
  onChange?: (data: SavedImageData[]) => void;
}

export const AddMetadata = ({ onSave, initialMetadata = [], onChange }: Props) => {
  const [images, setImages] = useState<MetadataEditorImage[]>([]);
  const activeBlobUrls = useRef(new Set<string>());
  const initialMetadataRef = useRef(initialMetadata);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MetadataFilter>("all");
  const [loadError, setLoadError] = useState<TranslationKey | null>(null);
  const { formatNumber, t } = useLocalization();
  const { operation, announcement, failedTargets, runOrientation } = useMetadataOrientation(setImages);

  useEffect(() => {
    let cancelled = false;
    void loadMetadataEditorImages(initialMetadataRef.current)
      .then((loaded) => {
        if (cancelled) {
          loaded.forEach((image) => revokeObjectUrls(image.blobUrls.values()));
          return;
        }
        setImages(loaded);
      })
      .catch((reason: unknown) => {
        console.error("Couldn't load metadata editor images", reason);
        if (!cancelled) setLoadError("image.metadata.loadError");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const nextUrls = new Set(
      images.flatMap((image) => Array.from(image.blobUrls.values())),
    );
    for (const url of activeBlobUrls.current) {
      if (!nextUrls.has(url)) revokeObjectUrls([url]);
    }
    activeBlobUrls.current = nextUrls;
    if (!loading && !loadError) onChange?.(cloneSavedImageData(images));
  }, [images, loading, loadError, onChange]);

  useEffect(() => () => revokeObjectUrls(activeBlobUrls.current), []);

  const records = getMetadataRecords(images);
  const counts = getMetadataCounts(images);
  const visibleRecords = filterMetadataRecords(records, filter);
  const updateMetadata = (imageIndex: number, regionId: RegionId, patch: Partial<ImageMetadata>) =>
    setImages((current) => patchMetadataForImage(current, imageIndex, regionId, patch));
  const runForRecords = (
    target: (record: MetadataRecord) => ReturnType<typeof getOrientationTarget>,
    selected: MetadataRecord[] = records,
  ) => void runOrientation(selected.map((record) => ({ record, target: target(record) })));
  const rotateRecord = (record: MetadataRecord, direction: -90 | 90 | 180) =>
    runForRecords((item) => getOrientationTarget(item.metadata, direction), [record]);
  const resetRecord = (record: MetadataRecord) => {
    if (window.confirm(t("image.metadata.confirmResetOne"))) {
      void runOrientation([{ record, target: resetOrientation() }]);
    }
  };
  const handleResetAll = () => {
    if (window.confirm(t("image.metadata.confirmResetAll", { count: counts.total, formatted: formatNumber(counts.total) }))) {
      void runForRecords(() => resetOrientation());
    }
  };
  const handleSave = () => {
    if (operation || counts.incomplete > 0 || counts.total === 0) {
      setFilter("incomplete");
      return;
    }
    onSave(cloneSavedImageData(images));
  };

  if (loading) return <p role="status">{t("image.metadata.loading")}</p>;

  return (
    <section className="metadata-editor" aria-labelledby="metadata-heading">
      <MetadataProgress total={counts.total} complete={counts.complete} />
      <div className="metadata-toolbar">
        <MetadataFilters {...counts} filter={filter} onChange={setFilter} />
        <div className="bulk-actions">
          <button
            disabled={operation !== null || counts.total === 0}
            type="button"
            onClick={() => void runForRecords((record) => getOrientationTarget(record.metadata, 90))}
          >
            {t("image.metadata.rotateAll")}
          </button>
          <button disabled={operation !== null || counts.total === 0} type="button" onClick={handleResetAll}>
            {t("image.metadata.resetAll")}
          </button>
        </div>
      </div>
      {operation && (
        <p className="operation-progress" aria-live="off">
          {t("image.metadata.operationProgress", {
            current: formatNumber(operation.done),
            total: formatNumber(operation.total),
          })}
        </p>
      )}
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement &&
          t("image.metadata.operationProgress", {
            current: formatNumber(announcement.done),
            total: formatNumber(announcement.total),
          })}
      </p>
      {loadError && <p className="metadata-error" role="alert">{t(loadError)}</p>}
      {failedTargets.size > 0 && (
        <p className="metadata-error" role="alert">
          {t("image.metadata.bulkFailure")}{" "}
          {t("image.metadata.operationFailedCount", {
            count: failedTargets.size,
            formatted: formatNumber(failedTargets.size),
          })}
        </p>
      )}
      <section className="metadata-record-list" aria-label={t("image.metadata.recordsLabel")}>
        {visibleRecords.map((record) => {
          const id = metadataRecordId(record.image.imageId, record.regionId);
          const retry = failedTargets.get(id);
          return (
            <MetadataRecordCard
              key={id}
              record={record}
              disabled={operation !== null}
              operationFailed={retry !== undefined}
              onChange={(patch) => updateMetadata(record.imageIndex, record.regionId, patch)}
              onRotate={(direction) => rotateRecord(record, direction)}
              onFlip={() => runForRecords((item) => toggleMirror(item.metadata), [record])}
              onReset={() => resetRecord(record)}
              onRetry={() => retry && void runOrientation([{ record, target: retry }])}
            />
          );
        })}
        {!visibleRecords.length && (
          <p className="empty-filter" role="status">
            {t(counts.total ? "image.metadata.noFilterResults" : "image.metadata.noRecords")}
          </p>
        )}
      </section>
      {counts.incomplete > 0 && (
        <p className="save-hint" role="status">
          {t("image.metadata.completeRequired")}
        </p>
      )}
      <div className="save-bar">
        <button
          disabled={operation !== null || counts.incomplete > 0 || counts.total === 0}
          type="button"
          onClick={handleSave}
        >
          {t("image.metadata.continue", {
            count: counts.complete,
            formatted: formatNumber(counts.complete),
          })}
        </button>
      </div>
    </section>
  );
};
