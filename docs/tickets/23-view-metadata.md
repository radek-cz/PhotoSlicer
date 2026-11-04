# VIEW-004 — Implement the metadata and orientation view

**Priority:** P1  
**Design source:** “3. Metadane & Korekta Orientacji”  
**Dependencies:** [I18N-001](./00-internationalization-and-tests.md), [UI-001](./01-app-shell-navigation.md), [UI-011](./11-metadata-progress-summary.md), [UI-012](./12-metadata-filters-and-bulk-actions.md), [UI-013](./13-metadata-record-card-and-orientation.md), [UI-014](./14-metadata-editor-fields.md)

## Summary

Implement the third workflow step as a searchable/reviewable list of crops with progress, filters, orientation tools, and per-record cataloguing fields.

## User story

As a user preparing a photo archive, I want to review each crop, correct its orientation, and complete descriptive metadata before export.

## Acceptance criteria

- Combine live progress, all/incomplete/complete filters, bulk orientation actions, crop record cards, and metadata forms.
- Bind every control to persisted workflow data and ensure filter changes, locale changes, and navigation do not discard edits.
- Validate required fields and make incomplete records discoverable before allowing export.
- Keep orientation changes consistent between preview and final exported images; show save and operation failures explicitly.
- Localize field labels, date/tag controls, status copy, validation, and counts.

## Technical references

- Current metadata editor: [AddMetadata.tsx](../../src/components/AddMetadata.tsx)
- Current metadata model and transformations: [imageOperations.ts](../../src/types/imageOperations.ts), [imageWorkflow.ts](../../src/lib/imageWorkflow.ts)
- Current workflow stage handling: [GenerateSlices.tsx](../../src/pages/GenerateSlices.tsx)
