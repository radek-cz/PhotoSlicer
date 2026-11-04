# VIEW-005 — Implement the export completion view

**Priority:** P1  
**Design source:** “4. Eksport do ZIP i IndexedDB”  
**Dependencies:** [I18N-001](./00-internationalization-and-tests.md), [UI-001](./01-app-shell-navigation.md), [UI-015](./15-export-completion-and-download.md), [UI-016](./16-persist-exported-session.md)

## Summary

Implement the final workflow view with truthful ZIP details, download action, optional local persistence, and a link to the archive library.

## User story

As a user finishing a batch, I want to download the result, optionally retain the session locally, and know where to find it later.

## Acceptance criteria

- Show a successful completion state only after the ZIP is generated; include its actual name, size, and crop count.
- Offer a working download action and an explicit, separate choice to save the session in browser storage.
- Show distinct progress, failure, retry, saved, and not-saved states; never report a session as persisted based only on ZIP download.
- Provide navigation back to metadata and to saved archives without discarding the current session.
- Use localized, locale-formatted details and verify archive size/error cases.

## Technical references

- Current export orchestration: [GenerateSlices.tsx](../../src/pages/GenerateSlices.tsx)
- ZIP generation: [imageWorkflow.ts](../../src/lib/imageWorkflow.ts), [exportImageSlicesAsZip.ts](../../src/lib/imageOperations/exportImageSlicesAsZip.ts)
- Current browser download helper: [browserImageOperations.ts](../../src/lib/browserImageOperations.ts)
