# UI-019 — Add archive privacy, import, and backup controls

**Priority:** P1  
**Design source:** “Zapisane Archiwa (IndexedDB)”  
**Dependencies:** [I18N-001](./00-internationalization-and-tests.md), [UI-016](./16-persist-exported-session.md)

## Summary

Implement the archive view's local-data explanation and its database export/import controls, with accurate privacy and recovery messaging.

## User story

As a user protecting historical scans, I want to understand where data is stored and create or restore a portable backup.

## Acceptance criteria

- Explain local storage accurately; do not describe the app as air-gapped or guarantee data retention beyond the browser's storage behavior.
- Support the designed JSON restore action and full-database `.tar` backup export, using documented/versioned formats; validate imported files before mutating the current database.
- Preserve existing records on invalid import and offer a clear replace/merge decision when an import could overwrite data.
- Warn users about browser-data clearing and recommend verified backups without implying that a backup exists.
- Localize privacy, import, export, validation, and confirmation messages.

## Technical references

- Current local processing and export workflow: [imageOperationsWorkerService.ts](../../src/services/imageOperationsWorkerService.ts), [imageWorkflow.ts](../../src/lib/imageWorkflow.ts)
- Current application data types: [image.ts](../../src/types/image.ts), [imageOperations.ts](../../src/types/imageOperations.ts)
- Local persistence prerequisite: [UI-016](./16-persist-exported-session.md)
