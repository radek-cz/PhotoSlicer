# UI-007 — Implement the interactive region editor canvas

**Priority:** P1  
**Design source:** “2. Detekcja & Kadrowanie (Canvas & Lupa)”  
**Dependencies:** [I18N-001](./00-internationalization-and-tests.md)

## Summary

Complete the scan canvas for reviewing detected photo regions and correcting their perspective with draggable corners, edges, and region translation.

## User story

As a user, I want to review automatic detections and precisely adjust, add, or remove crop regions before generating previews.

## Acceptance criteria

- Render the source scan and every detected region with visible, usable corner and edge handles.
- Support dragging corners, edges, and the region body while preserving the existing region geometry model and saving changes through the worker service.
- Support adding a region manually and deleting an unwanted region with clear focus, hover, and confirmation behavior where appropriate.
- Keep the canvas usable at different image sizes and expose controls to keyboard/screen-reader users where feasible.
- Preserve edits when navigating between scans and report save failures instead of implying unsaved changes were persisted.

## Technical references

- Existing Konva canvas: [CanvasImage.tsx](../../src/components/CanvasImage.tsx)
- Existing draggable region controls: [DraggableRegion.tsx](../../src/components/DraggableRegion.tsx)
- Region model and geometry helpers: [imageOperations.ts](../../src/types/imageOperations.ts), [canvasGeometry.ts](../../src/lib/canvasGeometry.ts)
- Region persistence: [imageOperationsWorkerService.ts](../../src/services/imageOperationsWorkerService.ts)
