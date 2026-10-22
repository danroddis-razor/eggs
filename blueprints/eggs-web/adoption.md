# Adoption

Read this first. It decides where each file goes before you write one.

1. Name the screens and the records the requirements describe. A record is something a person creates and changes, such as a project, a task or a time entry.
2. Put each record's rules in its own module under `src/`, with no reference to the page: `src/entries.mjs`, `src/projects.mjs`. Rules are pure functions over plain objects.
3. Put storage in `src/store.mjs` only. It reads and writes `localStorage` under one key per record kind, and every other module receives data from it.
4. Put the page in `index.html`, its style in `styles.css`, and the code that draws and listens in `src/app.mjs`. `index.html` loads `src/app.mjs` with `<script type="module">`.
5. Write the unit tests and the end-to-end tests as [testing.md](testing.md) states, in the same change as the code they prove.
6. Follow [guidance.md](guidance.md) for markup, accessibility and the look.

There is no build step, no framework and no package to install. Code runs in the browser as written.
