# UI-005 — Add the saved-archive shortcut to scan intake

**Priority:** P1  
**Design source:** Overview and “1. Import & Wrzucanie Skanów”  
**Dependencies:** [I18N-001](./00-internationalization-and-tests.md), [UI-016](./16-persist-exported-session.md)

## Summary

Add the designed shortcut from scan intake to locally saved archives, including a truthful session count and storage summary when those values are available.

## User story

As a returning user, I want to open saved work directly from scan intake instead of repeating the import flow.

## Acceptance criteria

- Navigate to the saved-archives view through a real application route.
- Show archive count and storage usage only when returned by the archive repository; show loading, unavailable, and empty states explicitly.
- Do not expose placeholder totals or claim that IndexedDB is ready before initialization succeeds.
- Localize all text and provide an accessible name for the shortcut.

## Technical references

- Current route definitions: [App.tsx](../../src/App.tsx)
- Scan-intake page: [GenerateSlices.tsx](../../src/pages/GenerateSlices.tsx)
- Current worker workflow: [imageOperationsWorkerService.ts](../../src/services/imageOperationsWorkerService.ts)
- The current source has no archive repository implementation; coordinate with UI-016 and UI-017.
