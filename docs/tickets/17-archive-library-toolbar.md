# UI-017 — Add archive library actions and bulk selection

**Priority:** P1  
**Design source:** “Zapisane Archiwa (IndexedDB)”  
**Dependencies:** [I18N-001](./00-internationalization-and-tests.md), [UI-016](./16-persist-exported-session.md)

## Summary

Implement the archive page's storage summary, new-scan action, select-all behavior, bulk ZIP download, bulk deletion, and clear-database action.

## User story

As a user managing saved sessions, I want to select and manage archives efficiently while understanding the impact of destructive actions.

## Acceptance criteria

- Derive archive count and storage usage from the local repository and show loading, unavailable, and empty states.
- Support select-all, selection count, bulk download, and bulk deletion with accurate selection state.
- Require clear confirmation before deleting selected sessions or clearing the entire local database; communicate that browser storage deletion may be permanent.
- Make the new-scan action return to import without accidentally deleting saved work.
- Localize all actions and provide accessible names and confirmation dialogs.

## Technical references

- Current application routes: [App.tsx](../../src/App.tsx)
- Existing worker-managed image workflow: [imageOperationsWorkerService.ts](../../src/services/imageOperationsWorkerService.ts)
- Local persistence prerequisite: [UI-016](./16-persist-exported-session.md)
