# JapApp Learning — React version

React 18 + Vite + React Router conversion of the `learning/` library:
38 study guides, 2 tips libraries, 2 Q&A ledgers, flashcards, MCQ practice and 94 case problems.

## Layout

```
react-version/
  scripts/migrate.mjs   one-time migration: ../learning/*.html -> src/content/*.json
  src/data/guides.json  hub metadata (shelves, routes, search index)
  src/content/          per-page JSON chunks (lazy-loaded, one per route)
  src/pages/            Home, Guide, Tips, Qa, Quiz, Mcq, Problems
  src/components/       Chrome (sidebar shell), doc hooks
  src/lib/              content loaders, theme/localStorage hooks
  public/lib public/assets   vendored Bootstrap / fonts / icons (copied)
```

HashRouter is used on purpose: the whole app is static-file safe
(`file://`, any sub-path, GitHub Pages project sites) and in-page
`#anchors` keep working through click interception.

## Commands

```bash
npm install     # install deps
npm run migrate # re-run the HTML -> JSON migration after editing ../learning
npm run dev     # local dev server
npm run build   # production build -> dist/ (portable, base './')
```

## Performance notes (Vercel React rules applied)

- `bundle-dynamic-imports` — every route is `lazy()`; every guide/tips/quiz
  JSON chunk loads only when its route opens (`import.meta.glob` loaders).
- `async-parallel` — migration and data loads use parallel promise maps.
- `rerender-*` — filters/search are memoized; search input is debounced;
  lists render from derived data, no subscriptions in callbacks.
- `rendering-conditional-render` — ternaries throughout, no `&&` conditionals
  that could render `0`.
- `server-*`/`client-swr` — N/A (fully static, no server, no fetching layer).

## Known v1 limits

- Guide demos that relied on page `<head>` scripts (e.g. htmx live demos)
  render statically — content is intact, the demo wiring is not ported.
- `practice.html` fetches `problems.json`, which does not exist in the repo;
  the MCQ page runs on its embedded question set instead.
- Original per-page `<style>` was not migrated; one shared stylesheet
  implements the design-system pattern generically (accent per page).
