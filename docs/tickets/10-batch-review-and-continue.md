# UI-010 — Add batch review status and continue action

**Priority:** P1  
**Design source:** “2. Detekcja & Kadrowanie (Canvas & Lupa)”  
**Dependencies:** [I18N-001](./00-internationalization-and-tests.md)

## Summary

Add the editor's batch summary and final action so users can see the scan/crop totals and explicitly accept reviewed regions before metadata editing.

## User story

As a user reviewing several scans, I want to understand the batch contents and know what the next step will include.

## Acceptance criteria

- Summarize the number of scans and regions using actual current workflow data, including pluralized localized labels.
- Keep the action to return to import separate from the action that accepts crops and advances to metadata.
- Prevent progression while a region save or required preview operation is pending or has failed; explain how to recover.
- Preserve the batch data and region edits when progressing or returning to the editor.

## Technical references

- Current workflow step transitions: [GenerateSlices.tsx](../../src/pages/GenerateSlices.tsx)
- Current scan selection and completion action: [SelectRegions.tsx](../../src/components/SelectRegions.tsx)
- Preview and saved region workflows: [imageWorkflow.ts](../../src/lib/imageWorkflow.ts)
