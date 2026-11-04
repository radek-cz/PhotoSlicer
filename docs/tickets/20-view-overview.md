# VIEW-001 — Implement the overview screen

**Priority:** P1  
**Design source:** “PhotoSlicer Scan Cutter & Archive Flow”  
**Dependencies:** [I18N-001](./00-internationalization-and-tests.md), [UI-001](./01-app-shell-navigation.md), [UI-002](./02-overview-capability-cards.md), [UI-003](./03-scan-upload-dropzone.md), [UI-004](./04-upload-queue-and-file-rows.md), [UI-005](./05-import-archive-shortcut.md)

## Summary

Implement the Stitch overview as a real application screen, combining the product/workflow introduction with the shared scan-intake entry points.

## User story

As a first-time user, I want a clear starting screen that explains the workflow and lets me begin a scan or open saved archives.

## Acceptance criteria

- Render the shared application shell, overview introduction, four workflow capability cards, scan upload area, selected-file queue, and saved-archive shortcut.
- Keep the primary action disabled until there are valid files to process; show import progress and failure states.
- Use actual runtime capabilities and archive data rather than the mockup's sample machine specifications or session totals.
- Navigate into the import workflow without losing selected files and support both `pl` and `en`.
- Match the Stitch hierarchy and dark visual direction while adapting to smaller screens and keyboard use.

## Technical references

- Current page placeholder: [Home.tsx](../../src/pages/Home.tsx)
- Current application routing and shell: [App.tsx](../../src/App.tsx)
- Existing import flow: [Upload.tsx](../../src/components/Upload.tsx), [imageWorkflow.ts](../../src/lib/imageWorkflow.ts)
