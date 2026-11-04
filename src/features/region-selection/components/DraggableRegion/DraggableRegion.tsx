import { Fragment, useRef, useState } from "react";
import {
  Arrow,
  Circle,
  Group,
  Line,
  Rect,
  Text,
} from "react-konva";
import type { Group as KonvaGroup } from "konva/lib/Group";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Coord, Region } from "../../../../types/imageOperations";
import {
  getRegionCenter,
  getRegionEdgeHandle,
  getRegionPointLabel,
  getRegionPoints,
  getRegionTrashPosition,
  REGION_EDGES,
  translateRegion,
  updateRegionEdge,
  updateRegionPoint,
} from "../../../../lib/canvasGeometry";

interface DraggableRegionProps {
  region: Region;
  canvasWidth: number;
  canvasHeight: number;
  regionLabel: string;

  onChange?: (region: Region) => void;

  onPointDragStart?: (
    index: number,
    point: Coord
  ) => void;

  onPointDragMove?: (
    index: number,
    point: Coord,
  ) => void;

  onPointDragEnd?: () => void;

  onRegionDragStart?: () => void;

  onRegionDragEnd?: () => void;
  
  onDelete: () => void;
}

export const DraggableRegion = ({
  region,
  canvasWidth,
  canvasHeight,
  regionLabel,
  onChange,
  onPointDragStart,
  onPointDragMove,
  onPointDragEnd,
  onRegionDragStart,
  onRegionDragEnd,
  onDelete
}: DraggableRegionProps) => {
  const [regionHovered, setRegionHovered] = useState(false);
  const [trashHovered, setTrashHovered] = useState(false);
  const regionGroup = useRef<KonvaGroup>(null);
  const points = getRegionPoints(region);
  const edgeDragStarts = useRef(
    new Map<number, { origin: Coord; first: Coord; second: Coord }>(),
  );
  const regionDragStart = useRef<{
    origin: Coord;
    points: Coord[];
  } | null>(null);
  const bodyDragStart = useRef<{
    origin: Coord;
    points: Coord[];
  } | null>(null);

  const flatPoints = points.flatMap((point) => [
    point.x,
    point.y,
  ]);
  const regionCenter = getRegionCenter(region);
  const labelX = Math.min(...points.map((point) => point.x));
  const labelY = Math.min(...points.map((point) => point.y)) - 22;

  const trashHitRadius = Math.min(20, canvasWidth / 2, canvasHeight / 2);
  const trashPosition = getRegionTrashPosition(
    points,
    canvasWidth,
    canvasHeight,
  );

  const showTrash = regionHovered || trashHovered;

  const setCursor = (
    e: KonvaEventObject<MouseEvent>,
    cursor: string
  ) => {
    e.target
      .getStage()
      ?.container()
      .style.setProperty("cursor", cursor);
  };

  return (
    <Group
      ref={regionGroup}
      name="region-drag-body"
      draggable
      onDragStart={(e) => {
        if (e.target.name() !== "region-drag-body") return;
        bodyDragStart.current = {
          origin: { x: 0, y: 0 },
          points: points.map((point) => ({ ...point })),
        };
        onRegionDragStart?.();
      }}
      onDragEnd={(e) => {
        if (e.target.name() !== "region-drag-body") return;
        const group = regionGroup.current;
        if (!group) return;
        const dragStart = bodyDragStart.current;
        if (dragStart) {
          onChange?.(
            translateRegion(region, dragStart.points, {
              x: group.x() - dragStart.origin.x,
              y: group.y() - dragStart.origin.y,
            }),
          );
        }
        bodyDragStart.current = null;
        group.position({ x: 0, y: 0 });
        onRegionDragEnd?.();
      }}
    >
      {/* REGION */}
      <Text
        x={labelX}
        y={labelY}
        text={regionLabel}
        fontFamily="monospace"
        fontSize={14}
        fill="#c4b5fd"
        listening={false}
      />
      <Line
        points={flatPoints}
        closed
        fill="rgba(167, 139, 250, 0.14)"
        stroke="#a78bfa"
        strokeWidth={2}
        hitStrokeWidth={20}
        onMouseEnter={(e) => {
          setRegionHovered(true);
          setCursor(e, "default");
        }}
        onMouseLeave={(e) => {
          setRegionHovered(false);
          setCursor(e, "default");
        }}
        onMouseDown={(e) => {
          if (e.evt.button !== 0) return;
          regionGroup.current?.startDrag();
          e.cancelBubble = true;
        }}
        onTouchStart={(e) => {
          regionGroup.current?.startDrag();
          e.cancelBubble = true;
        }}
      />

      {/* EDGE HANDLES */}
      {REGION_EDGES.map(([firstIndex, secondIndex], edgeIndex) => {
        const first = points[firstIndex];
        const second = points[secondIndex];
        const { x, y, rotation } = getRegionEdgeHandle(first, second);

        return (
          <Rect
            key={`edge-${edgeIndex}`}
            x={x}
            y={y}
            offsetX={9}
            offsetY={4}
            width={18}
            height={8}
            cornerRadius={4}
            rotation={rotation}
            fill="white"
            stroke="#a78bfa"
            strokeWidth={1.5}
            draggable
            onMouseEnter={(e) => {
              setRegionHovered(true);
              setCursor(e, "grab");
            }}
            onMouseLeave={(e) => {
              setCursor(e, "default");
            }}
            onDragStart={(e) => {
              edgeDragStarts.current.set(edgeIndex, {
                origin: { x: e.target.x(), y: e.target.y() },
                first,
                second,
              });
              onPointDragStart?.(firstIndex, { x, y });
              setCursor(e, "grabbing");
            }}
            onDragMove={(e) => {
              const dragStart = edgeDragStarts.current.get(edgeIndex);
              if (!dragStart) {
                return;
              }

              const current = { x: e.target.x(), y: e.target.y() };
              const delta = {
                x: current.x - dragStart.origin.x,
                y: current.y - dragStart.origin.y,
              };

              onChange?.(updateRegionEdge(
                region,
                firstIndex,
                {
                  x: dragStart.first.x + delta.x,
                  y: dragStart.first.y + delta.y,
                },
                secondIndex,
                {
                  x: dragStart.second.x + delta.x,
                  y: dragStart.second.y + delta.y,
                },
              ));
              onPointDragMove?.(firstIndex, current);
            }}
            onDragEnd={() => {
              edgeDragStarts.current.delete(edgeIndex);
              onPointDragEnd?.();
            }}
          />
        );
      })}

      {/* POINTS */}
      {points.map((point, index) => (
        <Fragment key={`point-${index}`}>
        <Circle
          x={point.x}
          y={point.y}
          radius={7}
          fill="white"
          stroke="#a78bfa"
          strokeWidth={2}
          draggable

          onMouseEnter={(e) => {
            setRegionHovered(true);
            setCursor(e, "crosshair");
          } }

          onMouseLeave={(e) => {
            setCursor(e, "default");
          } }

          onDragStart={(e) => {
            const currentPoint = {
              x: e.target.x(),
              y: e.target.y(),
            };

            onPointDragStart?.(
              index,
              currentPoint
            );
          } }

          onDragMove={(e) => {
            const currentPoint = {
              x: e.target.x(),
              y: e.target.y(),
            };

            const nextRegion = updateRegionPoint(
              region,
              index,
              currentPoint,
            );
            if (nextRegion) {
              onChange?.(nextRegion);
            }

            onPointDragMove?.(
              index,
              currentPoint
            );
          } }

          onDragEnd={() => {
            onPointDragEnd?.();
          } } />
        
        <Text
          x={point.x - 4.5}
          y={point.y - 4.5}
          fontSize={7}
          text={
            getRegionPointLabel(index)
          }
          />
          </Fragment>
      ))}

      {/* MOVE REGION HANDLE */}
      <Group
        x={regionCenter.x}
        y={regionCenter.y}
        draggable
        onMouseEnter={(e) => {
          setCursor(e, "grab");
        }}
        onMouseLeave={(e) => {
          setCursor(e, "default");
        }}
        onDragStart={(e) => {
          regionDragStart.current = {
            origin: { ...regionCenter },
            points: points.map((point) => ({ ...point })),
          };
          onRegionDragStart?.();
          setCursor(e, "grabbing");
        }}
        onDragMove={(e) => {
          const dragStart = regionDragStart.current;
          if (!dragStart) {
            return;
          }

          const current = { x: e.target.x(), y: e.target.y() };
          const delta = {
            x: current.x - dragStart.origin.x,
            y: current.y - dragStart.origin.y,
          };
          onChange?.(translateRegion(region, dragStart.points, delta));
        }}
        onDragEnd={() => {
          regionDragStart.current = null;
          onRegionDragEnd?.();
        }}
      >
        <Circle
          radius={12}
          fill="white"
          stroke="#a78bfa"
          strokeWidth={1.5}
        />
        <Arrow
          points={[0, 0, 0, -7]}
          stroke="#7c3aed"
          fill="#7c3aed"
          strokeWidth={1.5}
          pointerLength={3}
          pointerWidth={3}
          listening={false}
        />
        <Arrow
          points={[0, 0, 0, 7]}
          stroke="#7c3aed"
          fill="#7c3aed"
          strokeWidth={1.5}
          pointerLength={3}
          pointerWidth={3}
          listening={false}
        />
        <Arrow
          points={[0, 0, -7, 0]}
          stroke="#7c3aed"
          fill="#7c3aed"
          strokeWidth={1.5}
          pointerLength={3}
          pointerWidth={3}
          listening={false}
        />
        <Arrow
          points={[0, 0, 7, 0]}
          stroke="#7c3aed"
          fill="#7c3aed"
          strokeWidth={1.5}
          pointerLength={3}
          pointerWidth={3}
          listening={false}
        />
      </Group>

      {/* TRASH */}
      {showTrash && (
        <Group
          x={trashPosition.x}
          y={trashPosition.y}

          onMouseEnter={(e) => {
            setTrashHovered(true);
            setCursor(e, "pointer");
          }}

          onMouseLeave={(e) => {
            setTrashHovered(false);
            setCursor(e, "default");
          }}

          onClick={() => {
            onDelete();
          }}

          onTap={() => {
            onDelete();
          }}
        >
          {/* większy obszar klikalny */}
          <Circle
            radius={trashHitRadius}
            fill="transparent"
          />

          {/* obwódka */}
          <Circle
            radius={14}
            fill="white"
            stroke="#dc2626"
            strokeWidth={1.5}
          />

          {/* ikona */}
          <Text
            x={-7}
            y={-9}
            width={14}
            height={18}
            text="🗑"
            fontSize={14}
            align="center"
          />
        </Group>
      )}
    </Group>
  );
};