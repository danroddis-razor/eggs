// The browser the end-to-end tests drive: Chromium opens a page the harness serves and takes a screenshot.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { openApp } from './support/browser.mjs';

test('the harness opens a served page in Chromium and keeps a screenshot', async (t) => {
  const app = await openApp(t, { path: 'e2e/support/harness.html' });
  assert.equal(await app.page.getByRole('heading').textContent(), 'Eggs test harness');
  assert.ok(existsSync(await app.screenshot('harness page')));
});
