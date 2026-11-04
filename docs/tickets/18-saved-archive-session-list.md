# UI-018 — Build saved archive session cards

**Priority:** P1  
**Design source:** “Zapisane Archiwa (IndexedDB)”  
**Dependencies:** [I18N-001](./00-internationalization-and-tests.md), [UI-016](./16-persist-exported-session.md)

## Summary

Render each saved scan session as a selectable archive card with date, crop count, stored size, and per-session download/delete actions.

## User story

As a returning user, I want to identify a saved session and download or remove it without affecting other sessions.

## Acceptance criteria

- Render cards from repository records, with localized dates and sizes and accurate crop counts.
- Provide per-session selection, ZIP download, and delete actions that integrate with the shared archive toolbar.
- Handle missing/corrupt session data and failed reads or downloads with a visible error state.
- Provide a meaningful empty state and keep card content responsive and keyboard accessible.
- Never display sample archive names, dates, or sizes as though they were the user's actual data.

## Technical references

- Current image and metadata data shapes: [image.ts](../../src/types/image.ts), [imageOperations.ts](../../src/types/imageOperations.ts)
- Current ZIP workflow: [imageWorkflow.ts](../../src/lib/imageWorkflow.ts), [exportImageSlicesAsZip.ts](../../src/lib/imageOperations/exportImageSlicesAsZip.ts)
- Archive persistence prerequisite: [UI-016](./16-persist-exported-session.md)
