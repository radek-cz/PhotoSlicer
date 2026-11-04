# UI-014 — Expand crop metadata fields and controlled tags

**Priority:** P1  
**Design source:** “3. Metadane & Korekta Orientacji”  
**Dependencies:** [I18N-001](./00-internationalization-and-tests.md)

## Summary

Implement the record editor fields shown in Stitch: required title, description/transcription, date precision, and person/location/topic tags.

## User story

As a user preserving historical scans, I want to record searchable context for each crop and know which records still need required information.

## Acceptance criteria

- Persist title and description/transcription per crop and validate the required title consistently with progress filters.
- Support the design's date choices (exact date, year, or decade) without coercing incomplete dates into misleading values.
- Allow adding and removing person, location, and topic tags with keyboard-accessible input behavior.
- Extend metadata types and export serialization intentionally; retain compatibility for existing saved data and empty metadata.
- Keep user-authored values unchanged when switching application language.

## Technical references

- Current title/description controls: [AddMetadata.tsx](../../src/components/AddMetadata.tsx)
- Current metadata types and ZIP metadata writing: [imageOperations.ts](../../src/types/imageOperations.ts), [exportImageSlicesAsZip.ts](../../src/lib/imageOperations/exportImageSlicesAsZip.ts)
- Existing metadata transformation helpers: [imageWorkflow.ts](../../src/lib/imageWorkflow.ts)
