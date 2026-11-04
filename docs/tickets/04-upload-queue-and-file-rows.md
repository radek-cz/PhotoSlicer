# UI-004 — Show the upload queue and scan file details

**Priority:** P1  
**Design source:** Overview and “1. Import & Wrzucanie Skanów”  
**Dependencies:** [I18N-001](./00-internationalization-and-tests.md)

## Summary

Show selected scans as a manageable queue with filename, available image dimensions/file details, and an explicit import/analysis state.

## User story

As a user importing several scans, I want to check and manage the queue before proceeding.

## Acceptance criteria

- Render each selected file once and show its name, supported metadata when available, and a clear queued/processing/ready/failed state.
- Allow removing an individual queued file and clearing the queue without deleting already-saved archives.
- Keep file-level failures visible and let the user retry or remove a failed item.
- Do not display fabricated DPI, dimensions, or completion status when the browser cannot determine them.
- Localize the queue, actions, and states.

## Technical references

- Current upload state: [Upload.tsx](../../src/components/Upload.tsx)
- Import result type: [imageOperations.ts](../../src/types/imageOperations.ts)
- Existing file-to-worker workflow: [imageWorkflow.ts](../../src/lib/imageWorkflow.ts)
