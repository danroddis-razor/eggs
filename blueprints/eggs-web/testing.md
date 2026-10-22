# Testing

The repository declares two gates in `axiom.target.json`. Both use Node's own test runner, so nothing is installed.

## Unit tests

- One file per module: `tests/<module>.test.mjs`, for example `tests/entries.test.mjs`.
- Import the module under `src/` and call its functions. Do not load the page.
- `import { test } from 'node:test'` and `import assert from 'node:assert/strict'`.

## End-to-end tests

- One file per screen or journey: `e2e/<journey>.e2e.mjs`.
- Open the app only through `openApp` from `e2e/support/browser.mjs`. It serves the repository, opens Chromium, and closes both when the test ends.
- Select by role and visible text: `page.getByRole('button', { name: 'Start' })`, `page.getByText('No time tracked today.')`. Never by class or id.
- Take a screenshot at the end of each test that shows the outcome, with `await app.screenshot('<what it shows>')`. A person reviews these.
- Clear state at the start of a test that needs an empty app: `await app.page.evaluate(() => localStorage.clear()); await app.page.reload();`.
- Do not wait with fixed sleeps. Use Playwright's waiting assertions through `locator.waitFor()` or by reading after an action.

## Names

The test that proves a requirement carries the requirement's mark at the start of its name, as the work order gives it, for example `test('axm-1a2b3c4d a person starts a timer', …)`.
