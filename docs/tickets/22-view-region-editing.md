# VIEW-003 — Implement the region detection and crop editing view

**Priority:** P1  
**Design source:** “2. Detekcja & Kadrowanie (Canvas & Lupa)”  
**Dependencies:** [I18N-001](./00-internationalization-and-tests.md), [UI-001](./01-app-shell-navigation.md), [UI-006](./06-scan-context-and-canvas-toolbar.md), [UI-007](./07-region-editor-canvas.md), [UI-008](./08-canvas-magnifier.md), [UI-009](./09-crop-preview-gallery.md), [UI-010](./10-batch-review-and-continue.md)

## Summary

Implement the second workflow step for inspecting detected regions, manually correcting crop geometry, previewing slices, and accepting the batch.

## User story

As a user, I want to correct automatic crop detections and verify all resulting images before I proceed to metadata.

## Acceptance criteria

- Render selected-scan context/navigation, canvas controls, editable region canvas, magnifier, and generated crop previews.
- Keep the current scan selection and saved region geometry synchronized when navigating across the batch.
- Show actual batch/region totals and provide separate return-to-import and accept-and-continue actions.
- Disable acceptance while required edits are unsaved or preview generation is in an error state; show actionable localized errors.
- Preserve the current worker-service and object-URL lifecycle, and verify the full desktop/mobile view is navigable by keyboard.

## Technical references

- Current workflow transitions and scan switching: [GenerateSlices.tsx](../../src/pages/GenerateSlices.tsx), [SelectRegions.tsx](../../src/components/SelectRegions.tsx)
- Current editor implementation: [CanvasImage.tsx](../../src/components/CanvasImage.tsx), [DraggableRegion.tsx](../../src/components/DraggableRegion.tsx), [Magnifier.tsx](../../src/components/Magnifier.tsx)
- Existing region and preview workflow: [imageWorkflow.ts](../../src/lib/imageWorkflow.ts), [canvasGeometry.ts](../../src/lib/canvasGeometry.ts)
