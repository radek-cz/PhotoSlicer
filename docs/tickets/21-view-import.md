# VIEW-002 — Implement the scan import view

**Priority:** P1  
**Design source:** “1. Import & Wrzucanie Skanów”  
**Dependencies:** [I18N-001](./00-internationalization-and-tests.md), [UI-001](./01-app-shell-navigation.md), [UI-003](./03-scan-upload-dropzone.md), [UI-004](./04-upload-queue-and-file-rows.md), [UI-005](./05-import-archive-shortcut.md)

## Summary

Implement the dedicated first workflow step, including scan intake, queue review, local-processing guidance, and transition to automatic detection and crop editing.

## User story

As a user with one or more flatbed scans, I want to import supported images, confirm the batch, and begin region detection.

## Acceptance criteria

- Render the shared workflow header with import as the active step.
- Support multi-file selection, queue review/removal, per-file progress/error states, and a clear start-detection action.
- Show format and processing claims only when the runtime supports them; do not use the example files and sizes as real queue entries.
- Keep the upload-to-worker flow in the existing image workflow layer and preserve recoverable failures.
- Provide a localized path to the overview and saved archives, and verify the transition works at desktop and mobile widths.

## Technical references

- Current workflow page: [GenerateSlices.tsx](../../src/pages/GenerateSlices.tsx)
- Current upload component: [Upload.tsx](../../src/components/Upload.tsx)
- Existing import and preview mapping: [imageWorkflow.ts](../../src/lib/imageWorkflow.ts)
