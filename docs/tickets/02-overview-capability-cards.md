# UI-002 — Add overview hero and workflow capability cards

**Priority:** P1  
**Design source:** “PhotoSlicer Scan Cutter & Archive Flow” overview  
**Dependencies:** [I18N-001](./00-internationalization-and-tests.md)

## Summary

Implement the overview's product introduction, four concise workflow capability cards (ingestion, computer vision, metadata, and storage), and offline-processing assurance.

## User story

As a first-time user, I want to understand the scan-to-archive workflow and its local-processing model before selecting scans.

## Product direction

- Make this screen available from the Import menu item and use it as the default landing page.
- Place the file drag-and-drop field on this screen.

## Acceptance criteria

- Present the workflow purpose and four capability cards in the order shown by the overview design.
- Explain supported workflow capabilities without promising formats, resolution, processing acceleration, or privacy behavior that the implementation does not actually support.
- Link the primary call to action to the import workflow and provide a clear path to saved archives.
- Ensure this informational block remains understandable in both locales and at mobile widths.

## Technical references

- Current overview placeholder: [Home.tsx](../../src/pages/Home.tsx)
- Current route shell: [App.tsx](../../src/App.tsx)
- Design copy is Polish; use the localization resources established in I18N-001.
