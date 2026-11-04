# UI-011 — Show metadata completion progress

**Priority:** P1  
**Design source:** “3. Metadane & Korekta Orientacji”  
**Dependencies:** [I18N-001](./00-internationalization-and-tests.md)

## Summary

Add the metadata step heading, total crop count, and live completion summary shown above the metadata records.

## User story

As a user cataloguing crops, I want to see how many records are complete and how much work remains.

## Acceptance criteria

- Derive total, complete, and incomplete counts from the current metadata records rather than fixed design sample values.
- Define completion consistently with required metadata fields and reflect edits immediately.
- Announce progress updates accessibly without making the page disruptive to screen-reader users.
- Format counts and progress copy using locale-aware plural rules and support both locales.

## Technical references

- Current metadata editor state and save flow: [AddMetadata.tsx](../../src/components/AddMetadata.tsx)
- Existing metadata shape: [imageOperations.ts](../../src/types/imageOperations.ts), [image.ts](../../src/types/image.ts)
- Current metadata page composition: [GenerateSlices.tsx](../../src/pages/GenerateSlices.tsx)
