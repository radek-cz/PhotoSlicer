# VIEW-006 — Implement the saved archives view

**Priority:** P1  
**Design source:** “Zapisane Archiwa (IndexedDB)”  
**Dependencies:** [I18N-001](./00-internationalization-and-tests.md), [UI-001](./01-app-shell-navigation.md), [UI-016](./16-persist-exported-session.md), [UI-017](./17-archive-library-toolbar.md), [UI-018](./18-saved-archive-session-list.md), [UI-019](./19-archive-privacy-and-backup.md)

## Summary

Implement the archive-library destination for locally saved sessions, combining storage status, session cards, bulk management, and backup/recovery controls.

## User story

As a returning user, I want to review and manage archives stored on this device and safely export or restore a backup.

## Acceptance criteria

- Render real repository sessions, storage usage, selection state, and appropriate loading, empty, and failure states.
- Support new scan, individual and bulk downloads, deletion, backup export/import, and clear-storage actions as separate, understandable operations.
- Confirm destructive actions and preserve existing archives when backup validation or import fails.
- Ensure all displayed claims accurately reflect local browser storage guarantees and implemented archive contents.
- Localize the complete view and verify keyboard operation, responsive layout, and both locale variants.

## Technical references

- Current route table: [App.tsx](../../src/App.tsx)
- Current image/export workflow: [imageWorkflow.ts](../../src/lib/imageWorkflow.ts), [imageOperationsWorkerService.ts](../../src/services/imageOperationsWorkerService.ts)
- Archive repository and session cards are new; coordinate with [UI-016](./16-persist-exported-session.md), [UI-017](./17-archive-library-toolbar.md), [UI-018](./18-saved-archive-session-list.md), and [UI-019](./19-archive-privacy-and-backup.md).
