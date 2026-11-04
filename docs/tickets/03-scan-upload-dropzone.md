# UI-003 — Implement the scan upload dropzone and format guidance

**Priority:** P1  
**Design source:** Overview and “1. Import & Wrzucanie Skanów”  
**Dependencies:** [I18N-001](./00-internationalization-and-tests.md)

## Summary

Replace the plain file input with the designed upload area, supporting click-to-select and drag-and-drop for multiple scans, with concise format and processing guidance.

## User story

As a user, I want to add one or more scans in a clear, forgiving way and know which files the application can process.

## Acceptance criteria

- Support multiple files via both file picker and drag-and-drop, with visible hover, focus, loading, and rejected-file states.
- Validate file type and size before processing. Target the design's uncompressed TIFF, 16-bit PNG, and JPEG inputs; if a particular encoding cannot be decoded, reject it with a specific explanation rather than advertising it as supported.
- Preserve the existing `importImageFiles` workflow and surface per-file import failures without silently discarding other selected files.
- Provide localized instructions and accessible keyboard-operable input semantics.

## Technical references

- Current upload flow and accepted types: [Upload.tsx](../../src/components/Upload.tsx)
- File processing orchestration: [imageWorkflow.ts](../../src/lib/imageWorkflow.ts)
- Worker service entry point: [imageOperationsWorkerService.ts](../../src/services/imageOperationsWorkerService.ts)
