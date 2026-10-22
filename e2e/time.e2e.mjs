// The time page: the egg header, today's entries with durations and the day's total,
// the empty state, and starting a timer on a new entry that defaults to Admin.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp } from './support/browser.mjs';

// Two entries for today, 5 and 10 minutes, so the day's total is 0:15.
function seedTwoEntries() {
  const startedAt = new Date().toISOString();
  return [
    { id: 'seed-one', work: 'Write the spec', project: 'Admin', startedAt, running: false, duration: 300 },
    { id: 'seed-two', work: 'Review the pull request', project: 'Client A', startedAt, running: false, duration: 600 },
  ];
}

test('axm-064fda01 the list shows each of today\'s entries with its duration and the day\'s total', async (t) => {
  const app = await openApp(t, { path: 'time.html' });
  await app.page.evaluate((entries) => localStorage.setItem('eggs.entries', JSON.stringify(entries)), seedTwoEntries());
  await app.page.reload();

  const list = app.page.getByRole('list');
  await list.waitFor();
  const items = app.page.getByRole('listitem');
  assert.equal(await items.count(), 2, 'the list shows both of today\'s entries');

  const first = app.page.getByRole('listitem').filter({ hasText: 'Write the spec' });
  assert.ok(await first.getByText('0:05').isVisible(), 'the first entry shows its duration 0:05');
  const second = app.page.getByRole('listitem').filter({ hasText: 'Review the pull request' });
  assert.ok(await second.getByText('0:10').isVisible(), 'the second entry shows its duration 0:10');

  const total = app.page.getByText('0:15');
  await total.waitFor();
  assert.ok(await total.isVisible(), 'the day\'s total equals the sum of the entries\' durations');
  await app.screenshot('todays entries and the day total');
});

test('axm-10d3c252 a person types what they are working on and starts the timer, and Admin is chosen first', async (t) => {
  const app = await openApp(t, { path: 'time.html' });
  await app.page.evaluate(() => localStorage.clear());
  await app.page.reload();

  await app.page.getByRole('textbox').fill('Fix the login bug');
  await app.page.getByRole('button', { name: 'Start' }).click();

  const entry = app.page.getByRole('listitem').filter({ hasText: 'Fix the login bug' });
  await entry.waitFor();
  assert.ok(await entry.getByText('Admin').isVisible(), 'Admin is chosen first for the entry');
  assert.ok(await entry.getByText('Fix the login bug').isVisible(), 'the entry shows the typed work');

  const duration = entry.getByText(/\d+:\d{2}:\d{2}/);
  await duration.waitFor();
  const first = await duration.textContent();
  await app.page.waitForFunction(
    (initial) => {
      const match = document.querySelector('#entry-list').textContent.match(/\d+:\d{2}:\d{2}/);
      return match && match[0] !== initial;
    },
    first,
    { timeout: 5000 },
  );
  const second = await duration.textContent();
  assert.notEqual(first, second, 'the entry appears with a running timer that keeps counting');
  await app.screenshot('a typed entry with a running timer');
});

test('axm-23e754d4 the page header shows one egg emoji and the word Eggs together, centered', async (t) => {
  const app = await openApp(t, { path: 'time.html' });
  const header = app.page.getByRole('banner');
  await header.waitFor();

  const egg = header.getByText('\uD83E\uDD5A');
  await egg.waitFor();
  assert.equal(await egg.count(), 1, 'the header shows one egg emoji');
  const word = header.getByText('Eggs', { exact: true });
  await word.waitFor();
  assert.ok(await word.isVisible(), 'the header shows the word Eggs');

  const headerBox = await header.boundingBox();
  const viewport = app.page.viewportSize();
  assert.ok(Math.abs(headerBox.x + headerBox.width / 2 - viewport.width / 2) <= 2, 'the header is centered');
  await app.screenshot('the egg header on the time page');
});

test('axm-c94eff98 when today has no entries the list says No time tracked today and the total reads 0:00', async (t) => {
  const app = await openApp(t, { path: 'time.html' });
  await app.page.evaluate(() => localStorage.clear());
  await app.page.reload();

  const empty = app.page.getByText('No time tracked today.');
  await empty.waitFor();
  assert.ok(await empty.isVisible(), 'the list says No time tracked today.');
  const total = app.page.getByText('0:00');
  await total.waitFor();
  assert.ok(await total.isVisible(), 'the total reads 0:00');
  await app.screenshot('the empty state');
});
