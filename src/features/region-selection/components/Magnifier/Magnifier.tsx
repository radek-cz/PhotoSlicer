import { Image as KonvaImage, Rect } from "react-konva";
import type { Coord } from "../../../../types/imageOperations";
import { getMagnifierGeometry } from "../../../../lib/canvasGeometry";

interface Props {
  image: HTMLImageElement;
  magnifierPoint: Coord;
}

export const MAGNIFIER_SIZE = 120;
const MAGNIFIER_ZOOM = 4;

export const Magnifier = ({ image, magnifierPoint }: Props) => {
  const magnifierHalf = MAGNIFIER_SIZE / 2;
  const geometry = getMagnifierGeometry(
    image.width,
    image.height,
    magnifierPoint,
    MAGNIFIER_SIZE,
    MAGNIFIER_ZOOM,
  );

  return (
    <>
      <KonvaImage
        image={image}
        x={0}
        y={0}
        width={MAGNIFIER_SIZE}
        height={MAGNIFIER_SIZE}
        crop={{
          x: geometry.cropX,
          y: geometry.cropY,
          width: geometry.cropWidth,
          height: geometry.cropHeight,
        }}
      />

      <Rect
        x={0}
        y={0}
        width={MAGNIFIER_SIZE}
        height={MAGNIFIER_SIZE}
        stroke="white"
        strokeWidth={3}
        shadowColor="black"
        shadowBlur={6}
        listening={false}
      />

      <Rect
        x={magnifierHalf - 1}
        y={0}
        width={2}
        height={MAGNIFIER_SIZE}
        fill="rgba(255, 0, 0, 0.5)"
        listening={false}
      />

      <Rect
        x={0}
        y={magnifierHalf - 1}
        width={MAGNIFIER_SIZE}
        height={2}
        fill="rgba(255, 0, 0, 0.5)"
        listening={false}
      />
    </>
  );
};