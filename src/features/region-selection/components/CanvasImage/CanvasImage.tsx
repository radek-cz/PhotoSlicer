import { useCallback, useEffect, useRef, useState } from "react";
import {
  Image as KonvaImage,
  Layer,
  Line,
  Stage,
} from "react-konva";

import { DraggableRegion } from "../DraggableRegion/DraggableRegion";
import type { PreviewImage } from "../../../../types/image";
import { imageOperationsWorkerService } from "../../../../services/imageOperationsWorkerService";
import type { Coord, Region } from "../../../../types/imageOperations";
import { Magnifier, MAGNIFIER_SIZE } from "../Magnifier/Magnifier";
import { createRegionAt } from "../../../../lib/canvasGeometry";
import { useLocalization } from "../../../../lib/i18n/useLocalization";

interface CanvasImageProps {
  currentImage: PreviewImage;
  gridVisible: boolean;
  zoom: number;
  onFitZoomChange: (zoom: number) => void;
  onRegionsChange: (imageId: string, regions: Region[]) => void;
  onSaveFailure: () => void;
  onSaveSuccess: () => void;
}

type SaveState = "saving" | "saved" | "error";

const VIEWPORT_PADDING = 32;
const SCALED_IMAGE_BORDER = 2;
const SCALED_IMAGE_TOP_MARGIN = 20;
const MAGNIFIER_VIEWPORT_PADDING = 16;
const MAGNIFIER_OFFSET = 20;

export const CanvasImage = ({
  currentImage,
  gridVisible,
  zoom,
  onFitZoomChange,
  onRegionsChange,
  onSaveFailure,
  onSaveSuccess,
}: CanvasImageProps) => {
  const { t } = useLocalization();
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageError, setImageError] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("saving");
  const [magnifierPoint, setMagnifierPoint] = useState<Coord | null>(null);
  const [magnifierPosition, setMagnifierPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const magnifierPointRef = useRef<Coord | null>(null);
  const [regions, setRegions] = useState<Region[]>(currentImage.regions);
  const regionsRef = useRef(regions);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const scaledImageRef = useRef<HTMLDivElement>(null);

  const getMagnifierPosition = useCallback((point: Coord) => {
    const workspace = workspaceRef.current;
    const viewport = viewportRef.current;
    const scaledImage = scaledImageRef.current;
    if (!image || !workspace || !viewport || !scaledImage) return null;

    const workspaceBounds = workspace.getBoundingClientRect();
    const viewportBounds = viewport.getBoundingClientRect();
    const imageBounds = scaledImage.getBoundingClientRect();
    const scale = imageBounds.width / (image.width + SCALED_IMAGE_BORDER);
    const imageOriginX = imageBounds.left + scale * (SCALED_IMAGE_BORDER / 2);
    const imageOriginY = imageBounds.top + scale * (SCALED_IMAGE_BORDER / 2);
    const viewportOriginX = viewportBounds.left + viewport.clientLeft;
    const viewportOriginY = viewportBounds.top + viewport.clientTop;
    const pointX = imageOriginX + point.x * scale - viewportOriginX;
    const pointY = imageOriginY + point.y * scale - viewportOriginY;
    const maxX = Math.max(
      MAGNIFIER_VIEWPORT_PADDING,
      viewport.clientWidth - MAGNIFIER_VIEWPORT_PADDING - MAGNIFIER_SIZE,
    );
    const maxY = Math.max(
      MAGNIFIER_VIEWPORT_PADDING,
      viewport.clientHeight - MAGNIFIER_VIEWPORT_PADDING - MAGNIFIER_SIZE,
    );
    const x = Math.max(
      MAGNIFIER_VIEWPORT_PADDING,
      Math.min(maxX, pointX + MAGNIFIER_OFFSET),
    );
    const y = Math.max(
      MAGNIFIER_VIEWPORT_PADDING,
      Math.min(maxY, pointY - MAGNIFIER_SIZE - MAGNIFIER_OFFSET),
    );

    return {
      x: viewportBounds.left - workspaceBounds.left + viewport.clientLeft + x,
      y: viewportBounds.top - workspaceBounds.top + viewport.clientTop + y,
    };
  }, [image]);

  const updateMagnifierPoint = (point: Coord | null) => {
    magnifierPointRef.current = point;
    setMagnifierPoint(point);
    setMagnifierPosition(point ? getMagnifierPosition(point) : null);
  };

  useEffect(() => {
    let cancelled = false;
    const img = new Image();

    img.onload = () => {
      if (!cancelled) setImage(img);
    };
    img.onerror = () => {
      if (!cancelled) setImageError(true);
    };
    img.src = currentImage.blobUrl;

    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [currentImage.blobUrl]);

  useEffect(() => {
    const workspace = workspaceRef.current;
    const viewport = viewportRef.current;
    if (!image || !workspace || !viewport) return;

    const updateFitZoom = () => {
      const availableWidth = Math.max(
        0,
        viewport.clientWidth - VIEWPORT_PADDING,
      );
      const availableHeight = Math.max(
        0,
        viewport.clientHeight - VIEWPORT_PADDING - SCALED_IMAGE_TOP_MARGIN,
      );
      const fitZoom = Math.min(
        1,
        availableWidth / (image.width + SCALED_IMAGE_BORDER),
        availableHeight / (image.height + SCALED_IMAGE_BORDER),
      );
      onFitZoomChange(Math.max(0.05, fitZoom));
      const activePoint = magnifierPointRef.current;
      if (activePoint) {
        setMagnifierPosition(getMagnifierPosition(activePoint));
      }
    };

    updateFitZoom();
    const observer = new ResizeObserver(updateFitZoom);
    observer.observe(workspace);
    return () => observer.disconnect();
  }, [getMagnifierPosition, image, onFitZoomChange]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSaveState("saving");
      void imageOperationsWorkerService
        .saveImageRegions(currentImage.imageId, regions)
        .then(() => {
          setSaveState("saved");
          onSaveSuccess();
        })
        .catch((error: unknown) => {
          console.error("Couldn't update selected regions", error);
          setSaveState("error");
          onSaveFailure();
        });
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [currentImage.imageId, onSaveFailure, onSaveSuccess, regions]);

  useEffect(() => {
    return () => {
      void imageOperationsWorkerService
        .saveImageRegions(currentImage.imageId, regionsRef.current)
        .catch((error: unknown) => {
          console.error("Couldn't save regions while leaving the scan", error);
          onSaveFailure();
        });
    };
  }, [currentImage.imageId, onSaveFailure]);

  const updateRegions = (nextRegions: Region[]) => {
    regionsRef.current = nextRegions;
    setRegions(nextRegions);
    onRegionsChange(currentImage.imageId, nextRegions);
  };

  if (imageError) {
    return <p className="canvas-image__error" role="alert">{t("image.regions.imageError")}</p>;
  }

  if (!image) {
    return <p className="canvas-image__loading" role="status">{t("common.loading")}</p>;
  }

  const addNewRegion = () => {
    const region = createRegionAt(crypto.randomUUID(), {
      x: image.width / 2,
      y: image.height / 2,
    });
    updateRegions([...regionsRef.current, region]);
  };

  const deleteRegion = (region: Region) => {
    if (!window.confirm(t("image.regions.deleteConfirmation"))) return;
    updateRegions(regionsRef.current.filter((item) => item.id !== region.id));
  };

  const gridLines: ReturnType<typeof Line>[] = [];
  for (let x = 0; x <= image.width; x += 100) {
    gridLines.push(
      <Line
        key={`grid-v-${x}`}
        points={[x, 0, x, image.height]}
        stroke="#a1a1aa"
        strokeWidth={1}
        opacity={0.25}
        listening={false}
      />,
    );
  }
  for (let y = 0; y <= image.height; y += 100) {
    gridLines.push(
      <Line
        key={`grid-h-${y}`}
        points={[0, y, image.width, y]}
        stroke="#a1a1aa"
        strokeWidth={1}
        opacity={0.25}
        listening={false}
      />,
    );
  }

  const rulerTicks = [];
  for (let x = 0; x <= image.width; x += 100) {
    rulerTicks.push(
      <span
        className={`canvas-image__tick${x % 200 === 0 ? " canvas-image__tick--major" : ""}`}
        key={x}
        style={{ left: `${x}px` }}
      >
        {x % 200 === 0 ? x : ""}
      </span>,
    );
  }

  return (
    <div className="canvas-image__workspace" ref={workspaceRef}>
      <div className="canvas-image__toolbar">
        <button
          className="canvas-image__add"
          type="button"
          onClick={addNewRegion}
        >
          <span aria-hidden="true">＋</span>
          {t("image.regions.add")}
        </button>
        <span className="canvas-image__snap-hint">
          {t("image.regions.snapHint")}
        </span>
        <span className="canvas-image__region-count" aria-live="polite">
          {t("image.regions.detectedCount", {
            count: regions.length,
          })}
        </span>
        <span className="canvas-image__dimensions">
          {t("image.regions.size", {
            width: image.width,
            height: image.height,
          })}
        </span>
        <div className="canvas-image__region-actions">
          {regions.map((region, index) => (
            <button
              key={region.id}
              type="button"
              aria-label={t("image.regions.deleteRegion", {
                index: index + 1,
              })}
              title={t("image.regions.deleteRegion", {
                index: index + 1,
              })}
              onClick={() => deleteRegion(region)}
            >
              #{String(index + 1).padStart(2, "0")} ×
            </button>
          ))}
        </div>
        <span
          className={`canvas-image__save-status canvas-image__save-status--${saveState}`}
          role={saveState === "error" ? "alert" : "status"}
        >
          {t(`image.regions.save.${saveState}`)}
        </span>
      </div>

      <div
        className="canvas-image__viewport"
        ref={viewportRef}
        onScroll={() => {
          const point = magnifierPointRef.current;
          if (point) {
            setMagnifierPosition(getMagnifierPosition(point));
          }
        }}
      >
        <div
          className="canvas-image__scaled-container"
          style={{
            width: (image.width + SCALED_IMAGE_BORDER) * zoom,
            height: (image.height + SCALED_IMAGE_BORDER) * zoom,
          }}
        >
          <div
            className="canvas-image__scaled"
            ref={scaledImageRef}
            style={{
              width: image.width,
              height: image.height,
              transform: `scale(${zoom})`,
            }}
          >
            <div
              className="canvas-image__ruler"
              style={{ width: image.width }}
              aria-hidden="true"
            >
              {rulerTicks}
            </div>
            <Stage
              width={image.width}
              height={image.height}
              aria-label={t("image.regions.canvasLabel")}
              role="application"
              tabIndex={0}
            >
              <Layer>
                <KonvaImage image={image} x={0} y={0} />
                {gridVisible && gridLines}
                {regions.map((region, index) => (
                  <DraggableRegion
                    key={region.id}
                    region={region}
                    canvasWidth={image.width}
                    canvasHeight={image.height}
                    onChange={(updatedRegion) => {
                      updateRegions(
                        regionsRef.current.map((item) =>
                          item.id === region.id ? updatedRegion : item,
                        ),
                      );
                    }}
                    onPointDragStart={(_, point) => updateMagnifierPoint(point)}
                    onPointDragMove={(_, point) => updateMagnifierPoint(point)}
                    onPointDragEnd={() => updateMagnifierPoint(null)}
                    onRegionDragStart={() => setSaveState("saving")}
                    onRegionDragEnd={() => setSaveState("saving")}
                    onDelete={() => deleteRegion(region)}
                    regionLabel={t("image.regions.regionLabel", {
                      index: index + 1,
                    })}
                  />
                ))}
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
      {magnifierPoint && magnifierPosition && (
        <div
          className="canvas-image__magnifier"
          style={{
            left: magnifierPosition.x,
            top: magnifierPosition.y,
          }}
        >
          <Stage
            width={MAGNIFIER_SIZE}
            height={MAGNIFIER_SIZE}
            listening={false}
          >
            <Layer listening={false}>
              <Magnifier image={image} magnifierPoint={magnifierPoint} />
            </Layer>
          </Stage>
        </div>
      )}
    </div>
  );
};
