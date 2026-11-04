# UI-001 — Build the shared application header and workflow navigation

**Priority:** P1  
**Design source:** Shared by all Stitch views  
**Dependencies:** [I18N-001](./00-internationalization-and-tests.md)

## Summary

Replace the current placeholder header with the shared dark application chrome shown throughout Stitch: product identity, four workflow steps, a saved-archives destination, and local-storage readiness.

## User story

As a user, I want a consistent header that shows where I am in the scan workflow and lets me navigate to the archive library.

## Acceptance criteria

- Show the product name/identity, active workflow step, links to the four workflow stages, and a saved-archives link on every applicable view.
- Indicate local storage readiness without implying that data has been saved when it has not.
- Make the active, completed, unavailable, and keyboard-focus states distinguishable and accessible.
- Route links to implemented application views; do not leave dead links such as the current `/about` destination.
- Use translation keys for all labels and status text; remain usable at narrow viewport widths.

## Technical references

- Current navigation component: [Header.tsx](../../src/components/Header.tsx)
- Route definitions: [App.tsx](../../src/App.tsx)
- Existing visual styles: [App.css](../../src/App.css)
