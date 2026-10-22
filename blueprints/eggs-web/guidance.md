# Guidance

## The files

| Path | Holds |
|---|---|
| `index.html` | The one page. Landmarks: `header`, `main`, and a `nav` where there is more than one view. |
| `styles.css` | All style. Custom properties on `:root` for colour, space and type, as [tokens.md](tokens.md) gives them. |
| `src/app.mjs` | Draws the page from the store and listens for what a person does. |
| `src/store.mjs` | The only module that touches `localStorage`. |
| `src/<record>.mjs` | The rules of one record kind, as pure functions. |

Keep each file under 300 lines. Split a view out of `src/app.mjs` into `src/views/<view>.mjs` when it passes that.

## Markup

- Every control is a real `button`, `input`, `select` or `a`, with a visible label or an `aria-label`.
- A list of records is a `ul` or a `table` with a header row. An empty list says so in words, for example "No time tracked today."
- Durations show as `h:mm`, for example `1:05`. Dates show as the person's locale writes them.
- A running timer shows its elapsed time and updates at least once a second.

## Behaviour

- A change a person makes is saved at once. Reloading the page shows the same state.
- Nothing is deleted without a second step: an Undo, or a confirmation.
- The page works from 360px wide upward without horizontal scrolling.

## What not to do

- Do not add a framework, a bundler, a package or a CDN script.
- Do not read or write `localStorage` outside `src/store.mjs`.
- Do not select elements in tests by class or id; tests select by role and visible text.
