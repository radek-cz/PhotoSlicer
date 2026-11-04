# UI-013 — Build each metadata record card and orientation controls

**Priority:** P1  
**Design source:** “3. Metadane & Korekta Orientacji”  
**Dependencies:** [I18N-001](./00-internationalization-and-tests.md)

## Summary

Create the repeated crop record card with preview, identifier/status, dimensions, and per-record rotate, flip, and reset controls.

## User story

As a user cataloguing a crop, I want to verify its geometry and orientation and correct it without changing other records.

## Acceptance criteria

- Show a stable record identifier, current completion state, preview, and available dimensions for each crop.
- Provide clearly labeled per-record orientation actions and keep the displayed image and exported image orientation consistent.
- Extend the image model and export path deliberately for any design behavior not supported by the current rotation-only type, including mirroring; do not simulate unsupported actions in the UI.
- Keep the original crop available so repeated edits do not cause cumulative quality loss.
- Disable conflicting controls during an operation and surface failures with a retry path.

## Technical references

- Current preview, per-record rotation, and operation state: [AddMetadata.tsx](../../src/components/AddMetadata.tsx)
- Current editor styles: [AddMetadata.css](../../src/components/AddMetadata.css)
- Rotation model and export implementation: [imageOperations.ts](../../src/types/imageOperations.ts), [exportImageSlicesAsZip.ts](../../src/lib/imageOperations/exportImageSlicesAsZip.ts)
- Existing rotation helper: [browserImageOperations.ts](../../src/lib/browserImageOperations.ts)
