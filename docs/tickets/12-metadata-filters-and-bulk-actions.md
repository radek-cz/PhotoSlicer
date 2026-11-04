# UI-012 — Add metadata filters and bulk orientation actions

**Priority:** P1  
**Design source:** “3. Metadane & Korekta Orientacji”  
**Dependencies:** [I18N-001](./00-internationalization-and-tests.md)

## Summary

Implement filters for all, incomplete, and completed records, plus the designed bulk rotate and reset actions.

## User story

As a user working through many crops, I want to focus on incomplete records and apply safe orientation changes to selected or all records.

## Acceptance criteria

- Provide filters with live result counts and preserve entered metadata while changing filters.
- Make bulk actions' target explicit; provide a confirmation or reversible path for destructive resets.
- Apply orientation updates to every intended record, reflect progress while operations are running, and report partial failures.
- Support the design's rotate/reset behavior without confusing a reset with deletion or metadata clearing.
- Localize filter names, counts, action labels, and confirmation/error messages.

## Technical references

- Current metadata state and rotation behavior: [AddMetadata.tsx](../../src/components/AddMetadata.tsx)
- Current rotation type and image metadata: [imageOperations.ts](../../src/types/imageOperations.ts), [image.ts](../../src/types/image.ts)
- Existing image rotation helper: [browserImageOperations.ts](../../src/lib/browserImageOperations.ts)
