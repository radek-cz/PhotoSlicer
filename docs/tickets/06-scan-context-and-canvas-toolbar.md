# UI-006 — Add scan context and canvas controls

**Priority:** P1  
**Design source:** “2. Detekcja & Kadrowanie (Canvas & Lupa)”  
**Dependencies:** [I18N-001](./00-internationalization-and-tests.md)

## Summary

Build the editor toolbar showing the current scan, position in the batch, image details, previous/next scan navigation, and view controls such as fit, zoom, and grid.

## User story

As a user editing a batch, I want to identify the current scan and control its canvas view without losing my edits.

## Acceptance criteria

- Show the current scan name and available dimensions, batch position, and navigation state.
- Provide working fit/zoom/grid controls represented in the design; expose current zoom and toggle state accessibly.
- Disable previous/next actions at batch boundaries and retain each scan's region edits when switching scans.
- Keep physical measurement/ruler labels consistent with image scale; do not imply physical accuracy when DPI is unknown.
- Localize labels and tooltips.

## Technical references

- Current editor shell and scan state: [SelectRegions.tsx](../../src/components/SelectRegions.tsx)
- Canvas and image dimensions: [CanvasImage.tsx](../../src/components/CanvasImage.tsx)
- Scale and preview model: [image.ts](../../src/types/image.ts)
