# UI-016 — Persist completed sessions in IndexedDB

**Priority:** P1  
**Design source:** “4. Eksport do ZIP i IndexedDB”  
**Dependencies:** [I18N-001](./00-internationalization-and-tests.md)

## Summary

Implement the designed opt-in session persistence and truthful save status using local browser storage, with a clear boundary between a downloaded ZIP and a saved local session.

## User story

As a user, I want to keep completed scan sessions on this device so I can revisit them without reprocessing the originals.

## Acceptance criteria

- Save and retrieve session data locally using a versioned schema; handle quota, transaction, migration, and browser-storage errors explicitly.
- Make the persistence action explicit and show pending, saved, and failed states; do not imply a download automatically saves a session.
- Preserve source images, regions, metadata, and export details needed by the archive view, and define safe deletion behavior.
- Keep all processing local as represented by the product design; do not add remote uploads or telemetry.
- Add focused tests for repository persistence and failure cases.

## Technical references

- Current worker-managed image lifecycle: [imageOperationsWorkerService.ts](../../src/services/imageOperationsWorkerService.ts)
- Existing metadata and preview models: [image.ts](../../src/types/image.ts), [imageOperations.ts](../../src/types/imageOperations.ts)
- Dexie is present but not currently used: [package.json](../../package.json)
