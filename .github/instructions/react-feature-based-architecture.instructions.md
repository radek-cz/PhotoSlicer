---
description: "Use when creating, modifying, or refactoring React components, hooks, styles, tests, or feature code. Covers feature-based organization, per-component folders, colocation, and module boundaries."
applyTo: "src/**/*.{tsx,jsx,ts,js,css,scss}"
---

# React Feature-Based Architecture

Organize frontend code around user-facing features and UI responsibilities, not backend entities, database schemas, API models, or backend folder structures. Keep the frontend architecture independent of backend implementation details.

## Component folders and colocation

- Give every React component its own directory within the appropriate `components/` directory. Name the directory after the component, usually in PascalCase.
- Keep the component and all files used exclusively by it in that directory: styles, tests, types, hooks, and utility functions.
- Keep component-specific logic private. Do not move it to a shared module just because it could theoretically be reused.
- Create separate files only when they improve readability, maintainability, or reuse. Add an `index.ts` only when it provides a clear benefit.

```text
features/
  image-slicing/
    components/
      SlicePreview/
        SlicePreview.tsx
        SlicePreview.module.css
        SlicePreview.test.tsx
```

## Feature and shared boundaries

- Keep feature-specific components, hooks, utilities, and business logic within the relevant feature.
- Put generic, reusable UI components in `components/` or `shared/ui/`; give each component its own directory there too.
- Put application-wide, framework-independent utilities in `shared/lib/` or `shared/utils/`.
- Shared modules must not depend on features. Features may depend on shared modules; application-level code may compose both.
- Expose only the public API other modules need. Avoid circular dependencies and unnecessary cross-feature imports.

## Placement and refactoring

Choose the narrowest appropriate scope: component, feature, shared application code, or application-level composition. Do not mirror backend structure or create extra layers without a clear benefit.

Follow existing conventions where they do not conflict with these rules. Apply the structure incrementally: do not reorganize unrelated existing components. When moving files, update imports and tests, and preserve behavior, public APIs, styling, and business logic unless explicitly asked to change them.

References:

- React — [File Structure](https://legacy.reactjs.org/docs/faq-structure.html)
- React — [Describing the UI](https://react.dev/learn/describing-the-ui)
- Bulletproof React — [Project Structure](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md)
