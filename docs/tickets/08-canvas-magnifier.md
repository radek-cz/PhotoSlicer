# UI-008 — Match the precision magnifier to the design

**Priority:** P1  
**Design source:** “2. Detekcja & Kadrowanie (Canvas & Lupa)”  
**Dependencies:** [I18N-001](./00-internationalization-and-tests.md)

## Summary

Provide the pixel magnifier and crosshair shown while adjusting a crop region, with the Stitch design's 8× magnification and edge-safe positioning.

## User story

As a user fine-tuning a crop corner, I want a magnified view centered on the active pointer so I can make accurate adjustments.

## Acceptance criteria

- Show the magnifier during relevant point/edge drags and keep its crosshair aligned with the actual pointer location.
- Match the designed 8× zoom (the current component uses 4×) and prevent crop sampling outside the source image.
- Position the magnifier so it does not obscure the active target where the canvas permits.
- Hide it when dragging ends and preserve the editor's existing pointer and region behavior.
- Provide an accessible description or equivalent non-visual coordinate feedback.

## Technical references

- Current magnifier rendering and zoom constant: [Magnifier.tsx](../../src/components/Magnifier.tsx)
- Drag lifecycle and pointer state: [CanvasImage.tsx](../../src/components/CanvasImage.tsx), [DraggableRegion.tsx](../../src/components/DraggableRegion.tsx)
- Crop calculations: [canvasGeometry.ts](../../src/lib/canvasGeometry.ts)
