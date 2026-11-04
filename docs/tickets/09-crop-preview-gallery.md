# UI-009 — Build the generated crop preview gallery

**Priority:** P1  
**Design source:** “2. Detekcja & Kadrowanie (Canvas & Lupa)”  
**Dependencies:** [I18N-001](./00-internationalization-and-tests.md)

## Summary

Show generated crops for the current scan in the designed preview area, with a selected large preview and a synchronized, navigable thumbnail strip.

## User story

As a user, I want to verify every crop before accepting the batch and moving to metadata entry.

## Acceptance criteria

- Generate previews from the current saved region geometry and display an empty/loading/error state as appropriate.
- Synchronize the selected crop and thumbnail state; support mouse, touch, and keyboard selection.
- Include meaningful localized alt text and ensure preview object URLs are released according to their existing lifecycle.
- Refresh or clear previews when the current scan's regions change so stale crops are not presented as current.

## Technical references

- Current preview generation and gallery composition: [SelectRegions.tsx](../../src/components/SelectRegions.tsx)
- Existing image carousel and thumbnail behavior: [ImageGallery.tsx](../../src/components/ImageGallery.tsx), [ImageGallery.css](../../src/ImageGallery.css)
- Preview URL lifecycle: [browserImageOperations.ts](../../src/lib/browserImageOperations.ts)
