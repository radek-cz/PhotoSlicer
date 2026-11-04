/** Detects rectangular photo contours and returns their ordered corner points. */
import type { Mat } from "@opencvjs/types/lib/opencv/Mat";
import type { RotatedRect } from "@opencvjs/types/lib/opencv/RotatedRect";
import type { Coord } from "../../types/imageOperations";
type PhotoCorners = [Coord, Coord, Coord, Coord];



// ============================================================
// PHOTO DETECTION SENSITIVITY SETTINGS
// ============================================================

// --- Image preprocessing ---

// Kernel size used by MORPH_CLOSE.
// Larger values connect gaps in edges more easily.
const MORPH_KERNEL_SIZE = 7;

// Kernel size used by GaussianBlur.
// Larger values produce stronger smoothing and reduce more noise.
const GAUSSIAN_BLUR_SIZE = 5;

// --- Canny ---

// Lower Canny threshold.
// Lower values increase sensitivity to weak edges.
const CANNY_LOW_THRESHOLD = 50;

// Upper Canny threshold.
// Lower values increase edge sensitivity.
const CANNY_HIGH_THRESHOLD = 150;

// --- Contours ---

// Minimum contour area.
// Lower values allow smaller photos or regions to be detected.
const MIN_CONTOUR_AREA = 5000;

// Contour approximation tolerance.
// Lower values preserve more contour detail; higher values simplify more.
const APPROX_POLY_EPSILON = 0.02;

// Minimum vertex count after approxPolyDP.
const MIN_APPROX_VERTICES = 4;

// Maximum vertex count after approxPolyDP.
const MAX_APPROX_VERTICES = 8;

// --- Rectangularity ---

// Minimum rectangularity; 1.0 represents a perfect rectangle.
// Lower values accept more irregular shapes.
const MIN_RECTANGULARITY = 0.70;

// --- Aspect ratio ---

// Maximum ratio of the longer side to the shorter side.
// Objects that are too wide or tall are rejected.
const MAX_ASPECT_RATIO = 2.5;


// ============================================================
// PHOTO DETECTION
// ============================================================

export const findPhotos = (
    src: Mat,
    cv: typeof import("@opencvjs/types/lib/opencv/_types")
): PhotoCorners[] => {
    const gray = new cv.Mat();
    const blurred = new cv.Mat();
    const edges = new cv.Mat();
    const closed = new cv.Mat();

    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    const kernel = cv.getStructuringElement(
        cv.MORPH_RECT,
        new cv.Size(
            MORPH_KERNEL_SIZE,
            MORPH_KERNEL_SIZE
        )
    );

    const results: PhotoCorners[] = [];

    try {
        // 1. Convert to grayscale.
        cv.cvtColor(
            src,
            gray,
            cv.COLOR_RGBA2GRAY
        );


        // 2. Remove fine-grained noise.
        cv.GaussianBlur(
            gray,
            blurred,
            new cv.Size(
                GAUSSIAN_BLUR_SIZE,
                GAUSSIAN_BLUR_SIZE
            ),
            0
        );

        // 3. Detect edges.
        cv.Canny(
            blurred,
            edges,
            CANNY_LOW_THRESHOLD,
            CANNY_HIGH_THRESHOLD
        );

        // 4. Connect gaps in edges.
        cv.morphologyEx(
            edges,
            closed,
            cv.MORPH_CLOSE,
            kernel
        );

        // 5. Find contours.
        cv.findContours(
            closed,
            contours,
            hierarchy,
            cv.RETR_EXTERNAL,
            cv.CHAIN_APPROX_SIMPLE
        );

        for (let i = 0; i < contours.size(); i++) {
            const contour = contours.get(i);

            try {
                // Reject contours that are too small.
                const area = cv.contourArea(contour);

                if (area < MIN_CONTOUR_AREA) {
                    continue;
                }

                // Approximate the contour.
                const perimeter = cv.arcLength(
                    contour,
                    true
                );

                const approx = new cv.Mat();

                try {
                    cv.approxPolyDP(
                        contour,
                        approx,
                        APPROX_POLY_EPSILON * perimeter,
                        true
                    );

                    if (
                        approx.rows < MIN_APPROX_VERTICES ||
                        approx.rows > MAX_APPROX_VERTICES
                    ) {
                        continue;
                    }
                } finally {
                    approx.delete();
                }

                // Find the minimum-area rotated rectangle.
                const rect = cv.minAreaRect(contour);

                const width = rect.size.width;
                const height = rect.size.height;

                if (width <= 0 || height <= 0) {
                    continue;
                }

                const rectArea = width * height;

                // Measure how closely the contour resembles a rectangle.
                const rectangularity =
                    area / rectArea;

                if (
                    rectangularity <
                    MIN_RECTANGULARITY
                ) {
                    continue;
                }

                // Check the photo's aspect ratio.
                const ratio =
                    Math.max(width, height) /
                    Math.min(width, height);

                if (ratio > MAX_ASPECT_RATIO) {
                    continue;
                }

                // Get the four corners.
                const corners =
                    getRotatedRectPoints(rect);

                results.push(corners);
            } finally {
                contour.delete();
            }
        }

        return results;
    } finally {
        gray.delete();
        blurred.delete();
        edges.delete();
        closed.delete();
        contours.delete();
        hierarchy.delete();
        kernel.delete();
    }
};


// ============================================================
// ORDERING ROTATED RECTANGLE CORNERS
// ============================================================

function getRotatedRectPoints(
    rect: RotatedRect
): PhotoCorners {
    const cx = rect.center.x;
    const cy = rect.center.y;

    const width = rect.size.width;
    const height = rect.size.height;

    const angle = rect.angle * Math.PI / 180;

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const halfWidth = width / 2;
    const halfHeight = height / 2;

    const rotate = (x: number, y: number): Coord => ({
        x: cx + x * cos - y * sin,
        y: cy + x * sin + y * cos,
    });

    const pts: Coord[] = [
        rotate(-halfWidth, -halfHeight),
        rotate( halfWidth, -halfHeight),
        rotate( halfWidth,  halfHeight),
        rotate(-halfWidth,  halfHeight),
    ];

    // Sort by angle around the center. With image coordinates (Y increases
    // downward), this produces the clockwise order TL -> TR -> BR -> BL.
    pts.sort((a, b) => {
        const angleA = Math.atan2(
            a.y - cy,
            a.x - cx,
        );

        const angleB = Math.atan2(
            b.y - cy,
            b.x - cx,
        );

        return angleA - angleB;
    });

    // Find the corner closest to the top-left.
    let topLeftIndex = 0;

    for (let i = 1; i < pts.length; i++) {
        const current = pts[i].x + pts[i].y;
        const best = pts[topLeftIndex].x + pts[topLeftIndex].y;

        if (current < best) {
            topLeftIndex = i;
        }
    }

    // Rotate the list so the top-left corner comes first.
    const ordered = [
        ...pts.slice(topLeftIndex),
        ...pts.slice(0, topLeftIndex),
    ];

    return [
        ordered[0], // upperLeft
        ordered[1], // upperRight
        ordered[2], // lowerRight
        ordered[3], // lowerLeft
    ];
}

 