# UI-015 — Build the export completion and ZIP download panel

**Priority:** P1  
**Design source:** “4. Eksport do ZIP i IndexedDB”  
**Dependencies:** [I18N-001](./00-internationalization-and-tests.md), [UI-016](./16-persist-exported-session.md)

## Summary

Replace the generic completion message with the designed export summary, showing actual output details and a reliable download action.

## User story

As a user who has finished metadata entry, I want to download the generated archive and verify what it contains.

## Acceptance criteria

- Generate the archive from the current crop and metadata state; show progress, success, failure, and retry states.
- Show the actual filename, crop count, and file size only after generation succeeds.
- Include the design's full-resolution crops, per-crop JSON metadata (including available region coordinates and timestamps), and consolidated searchable text index in the ZIP; document any data that is unavailable rather than fabricating it.
- Download the ZIP through the existing browser helper and provide clear feedback if generation or download setup fails.
- Localize the full panel, including status and file-size formatting.

## Technical references

- Current export transition and download flow: [GenerateSlices.tsx](../../src/pages/GenerateSlices.tsx)
- ZIP generation and metadata output: [imageWorkflow.ts](../../src/lib/imageWorkflow.ts), [exportImageSlicesAsZip.ts](../../src/lib/imageOperations/exportImageSlicesAsZip.ts)
- Browser download helper: [browserImageOperations.ts](../../src/lib/browserImageOperations.ts)
- Coordinate the added session metadata with [UI-016](./16-persist-exported-session.md).
