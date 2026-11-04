import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { MetadataEditorImage } from "../../../types/image";
import { createObjectUrl, orientImageBlob } from "../../../lib/browserImageOperations";
import { patchMetadataForImage } from "../../../lib/imageWorkflow";
import { metadataRecordId, type MetadataRecord, type OrientationTarget } from "../utils/metadataUtils";

export interface OrientationTask {
  record: MetadataRecord;
  target: OrientationTarget;
}

export function useMetadataOrientation(
  setImages: Dispatch<SetStateAction<MetadataEditorImage[]>>,
) {
  const operationLock = useRef(false);
  const isMounted = useRef(true);
  const [operation, setOperation] = useState<{ done: number; total: number } | null>(null);
  const [announcement, setAnnouncement] = useState<{ done: number; total: number } | null>(null);
  const [failedTargets, setFailedTargets] = useState<Map<string, OrientationTarget>>(new Map());

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const runOrientation = useCallback(async (tasks: OrientationTask[]) => {
    if (operationLock.current || !tasks.length) return;
    operationLock.current = true;
    setOperation({ done: 0, total: tasks.length });
    setAnnouncement({ done: 0, total: tasks.length });
    const announceEvery = Math.max(1, Math.ceil(tasks.length / 10));

    try {
      for (const [index, { record, target }] of tasks.entries()) {
        if (!isMounted.current) break;
        const id = metadataRecordId(record.image.imageId, record.regionId);
        try {
          const original = record.image.images.get(record.regionId);
          if (!original) throw new Error(`Missing original crop: ${id}`);
          const oriented = await orientImageBlob(
            original,
            target.rotation,
            target.mirrorHorizontal,
          );
          if (!isMounted.current) break;
          const previewUrl = createObjectUrl(oriented);
          setImages((current) =>
            patchMetadataForImage(current, record.imageIndex, record.regionId, target)
              .map((image, imageIndex) => {
                if (imageIndex !== record.imageIndex) return image;
                const blobUrls = new Map(image.blobUrls);
                blobUrls.set(record.regionId, previewUrl);
                return { ...image, blobUrls };
              }),
          );
          setFailedTargets((current) => {
            const next = new Map(current);
            next.delete(id);
            return next;
          });
        } catch (reason) {
          if (!isMounted.current) break;
          console.error(`Couldn't update orientation for ${id}`, reason);
          setFailedTargets((current) => new Map(current).set(id, target));
        }
        const done = index + 1;
        if (isMounted.current) setOperation({ done, total: tasks.length });
        if (isMounted.current && (done % announceEvery === 0 || done === tasks.length)) {
          setAnnouncement({ done, total: tasks.length });
        }
      }
    } finally {
      operationLock.current = false;
      if (isMounted.current) setOperation(null);
    }
  }, [setImages]);

  return { operation, announcement, failedTargets, runOrientation };
}
