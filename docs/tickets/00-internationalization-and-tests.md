# I18N-001 — Establish Polish/English localization and tests

**Priority:** P0 — execute before every other ticket  
**Design source:** [Stitch project](https://stitch.withgoogle.com/projects/6293473909980062732)  
**Dependencies:** None

## Summary

Add the localization foundation and automated tests before implementing the remaining designs. The Stitch screens are authored in Polish; every user-facing string must also be available in English.

## User story

As a Polish- or English-speaking user, I want to use the complete application in my chosen language so that navigation, workflow content, forms, status messages, and accessibility labels are understandable and consistent.

## Acceptance criteria

- Support Polish (`pl`) and English (`en`) across every user-visible string, including navigation, buttons, labels, help text, errors, loading/empty states, confirmations, and accessible names.
- Select the saved language on subsequent visits; on first use, use Polish for a Polish browser language and English otherwise.
- Provide an accessible language switcher. Changing language updates the interface without clearing uploaded images, edited regions, metadata, or workflow state.
- Keep user-entered metadata and filenames unchanged. Format dates and numbers using the active locale, and handle translated text expansion without clipping.
- Store translations in typed, namespaced resources; do not silently render missing keys. Tests must fail for missing Polish/English keys and cover locale selection, persistence, switching, interpolation/pluralization where used, and representative rendered UI strings.
- Establish or extend the smallest suitable test setup for this repository; expose a documented package script and ensure tests can run in CI and locally.
- Keep locale resources incrementally extensible so later tickets can add their Polish and English copy without introducing hard-coded UI strings.

## Technical references

- Current entry and routes: [App.tsx](../../src/App.tsx), [main.tsx](../../src/main.tsx)
- Existing user-facing text to migrate: [Header.tsx](../../src/components/Header.tsx), [Upload.tsx](../../src/components/Upload.tsx), [AddMetadata.tsx](../../src/components/AddMetadata.tsx)
- Current scripts and dependencies: [package.json](../../package.json)

## Implementation notes

Use established libraries compatible with React 19 and the existing TypeScript/Vite setup; keep translation keys stable and avoid coupling persisted image data to the selected locale.

## Tech details

Because the app is static, it cannot reliably determine a user's country without an external geolocation service; use the browser's preferred languages as a lightweight proxy, selecting Polish when a language tag starts with `pl` and English otherwise, with an explicit saved choice taking precedence. Keep translations in separate `pl.json` and `en.json` files with nested, dot-addressable keys such as `common.actions.save`; load only the selected locale through Vite's dynamic `import()` so the other language is a separate chunk and is not downloaded until needed. Use `i18next` with `react-i18next` and `i18next-resources-to-backend` to provide typed translation keys, interpolation, language detection, and lazy loading; validate both resource trees in tests rather than silently falling back when a key is absent.

## Implemented solutions

Translations are stored in `src/lib/i18n/locales/pl.json` and `src/lib/i18n/locales/en.json`; i18next configuration, language detection, and lazy loading live in `src/lib/i18n/i18n.ts`, and UI components use a small `useLocalization` adapter for locale-aware number formatting. The accessible language selector in the header saves an explicit choice in `localStorage`, which takes precedence over the browser's preferred languages on later visits; changing it updates the visible labels without remounting the editor or changing image, region, or metadata state. Keep future labels for existing components in the corresponding component namespace in both locale JSON files (for example `image.upload`, `image.metadata`, and `image.regions`), rather than scattering copy through component files. Locale-tree parity and UI behavior are covered by the `npm test` suite.
