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

  await app.page.getByRole('textbox', { name: 'What are you working on?' }).nth(0).fill('Fix the login bug');
  await app.page.getByRole('button', { name: 'Start' }).click();

  const entry = app.page.getByRole('listitem').filter({ hasText: 'Fix the login bug' });
  await entry.waitFor();
  const projectSelect = entry.getByRole('combobox', { name: 'Project for Fix the login bug' });
  assert.equal(await projectSelect.inputValue(), 'Admin', 'Admin is chosen first for the entry');
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

test('axm-59d65845 stopping a running timer records the elapsed time and the timer no longer runs', async (t) => {
  const app = await openApp(t, {
    path: 'time.html',
    beforeNavigate: async (page) => {
      await page.clock.install();
      await page.clock.setFixedTime(new Date('2025-01-07T10:00:00.000Z'));
      await page.addInitScript(() => localStorage.setItem('eggs.entries', '[]'));
    },
  });

  await app.page.getByRole('textbox', { name: 'What are you working on?' }).nth(0).fill('Fix the login bug');
  await app.page.getByRole('button', { name: 'Start' }).click();

  const entry = app.page.getByRole('listitem').filter({ hasText: 'Fix the login bug' });
  await entry.waitFor();
  const stop = entry.getByRole('button', { name: 'Stop Fix the login bug' });
  await stop.waitFor();

  // Advance the clock 5 minutes 30 seconds past the start, then stop the timer.
  await app.page.clock.setFixedTime(new Date('2025-01-07T10:05:30.000Z'));
  await stop.click();
  const duration = entry.getByText('0:05');
  await duration.waitFor();
  assert.ok(await duration.isVisible(), 'the entry shows a duration equal to the elapsed time between starting and stopping');
  assert.equal(await entry.getByRole('button', { name: 'Stop Fix the login bug' }).count(), 0, 'the timer no longer runs');
  await app.screenshot('a stopped timer with its duration');
});

test('axm-6cfbe257 a person picks a project for an entry from the short list', async (t) => {
  const app = await openApp(t, { path: 'time.html' });
  const startedAt = new Date().toISOString();
  await app.page.evaluate((startedAt) => {
    localStorage.setItem('eggs.entries', JSON.stringify([
      { id: 'seed-one', work: 'Write the spec', project: 'Admin', startedAt, running: false, duration: 300 },
    ]));
  }, startedAt);
  await app.page.reload();

  const entry = app.page.getByRole('listitem').filter({ hasText: 'Write the spec' });
  await entry.waitFor();
  const projectSelect = entry.getByRole('combobox', { name: 'Project for Write the spec' });
  assert.equal(await projectSelect.inputValue(), 'Admin', 'the entry exists with Admin chosen');

  await projectSelect.selectOption('Client work');
  assert.equal(await projectSelect.inputValue(), 'Client work', 'the entry shows Client work');
  await app.screenshot('an entry with the picked project');
});

test('axm-92abe8f3 a person adds an entry by hand with a duration', async (t) => {
  const app = await openApp(t, { path: 'time.html' });
  await app.page.evaluate(() => localStorage.clear());
  await app.page.reload();

  await app.page.getByText('No time tracked today.').waitFor();
  await app.page.getByRole('button', { name: 'Add an entry by hand' }).click();
  const manualWork = app.page.getByRole('textbox', { name: 'Work', exact: true });
  await manualWork.fill('Write the spec');
  await app.page.getByRole('textbox', { name: 'Duration' }).fill('0:05');
  await app.page.getByRole('button', { name: 'Add' }).click();

  const entry = app.page.getByRole('listitem').filter({ hasText: 'Write the spec' });
  await entry.waitFor();
  assert.ok(await entry.getByText('0:05').isVisible(), 'the entry appears in today\'s list with that duration');
  await app.screenshot('a manual entry with its duration');
});

test('axm-4681e632 deleting an entry removes it and an undo appears, announced to screen readers and reachable by keyboard', async (t) => {
  const app = await openApp(t, { path: 'time.html' });
  const startedAt = new Date().toISOString();
  await app.page.evaluate((startedAt) => {
    localStorage.setItem('eggs.entries', JSON.stringify([
      { id: 'seed-one', work: 'Write the spec', project: 'Admin', startedAt, running: false, duration: 300 },
    ]));
  }, startedAt);
  await app.page.reload();

  const entry = app.page.getByRole('listitem').filter({ hasText: 'Write the spec' });
  await entry.waitFor();
  await entry.getByRole('button', { name: 'Delete Write the spec' }).click();

  assert.equal(await app.page.getByRole('listitem').filter({ hasText: 'Write the spec' }).count(), 0, 'the entry is removed from today\'s list');
  const undo = app.page.getByRole('button', { name: 'Undo' });
  await undo.waitFor();
  assert.ok(await undo.isVisible(), 'an undo appears');
  assert.ok(await undo.isEnabled(), 'the undo is a real, enabled button reachable by keyboard');
  const status = app.page.getByText('Write the spec was deleted.');
  await status.waitFor();
  const live = app.page.locator('[aria-live]');
  assert.ok(await live.filter({ hasText: 'Write the spec was deleted.' }).count() >= 1, 'the deletion is announced to screen readers through a live region');
  await app.screenshot('an entry deleted with an undo');
});

test('axm-6a917349 choosing undo after deleting an entry brings the entry back into today\'s list', async (t) => {
  const app = await openApp(t, { path: 'time.html' });
  const startedAt = new Date().toISOString();
  await app.page.evaluate((startedAt) => {
    localStorage.setItem('eggs.entries', JSON.stringify([
      { id: 'seed-one', work: 'Write the spec', project: 'Admin', startedAt, running: false, duration: 300 },
    ]));
  }, startedAt);
  await app.page.reload();

  const entry = app.page.getByRole('listitem').filter({ hasText: 'Write the spec' });
  await entry.waitFor();
  await entry.getByRole('button', { name: 'Delete Write the spec' }).click();
  assert.equal(await app.page.getByRole('listitem').filter({ hasText: 'Write the spec' }).count(), 0, 'the entry is removed from today\'s list');

  await app.page.getByRole('button', { name: 'Undo' }).click();
  const restored = app.page.getByRole('listitem').filter({ hasText: 'Write the spec' });
  await restored.waitFor();
  assert.ok(await restored.getByText('0:05').isVisible(), 'the entry reappears in today\'s list with its duration');
  await app.screenshot('an entry restored by undo');
});

test('axm-ce528f45 a person edits an entry\'s work and duration and the entry shows the escaped edited work and duration', async (t) => {
  const app = await openApp(t, { path: 'time.html' });
  const startedAt = new Date().toISOString();
  await app.page.evaluate((startedAt) => {
    localStorage.setItem('eggs.entries', JSON.stringify([
      { id: 'seed-one', work: 'Write the spec', project: 'Admin', startedAt, running: false, duration: 300 },
    ]));
  }, startedAt);
  await app.page.reload();

  const entry = app.page.getByRole('listitem').filter({ hasText: 'Write the spec' });
  await entry.waitFor();
  await entry.getByRole('button', { name: 'Edit Write the spec' }).click();

  const list = app.page.getByRole('list');
  await list.getByRole('textbox', { name: 'Work' }).fill('<b>Fix the login bug</b>');
  await list.getByRole('textbox', { name: 'Duration' }).fill('1:05');
  await list.getByRole('button', { name: 'Save' }).click();

  const edited = app.page.getByRole('listitem').filter({ hasText: 'Fix the login bug' });
  await edited.waitFor();
  assert.equal(await edited.locator('b').count(), 0, 'the edited work is escaped and shows as text, not markup');
  assert.ok(await edited.getByText('<b>Fix the login bug</b>').isVisible(), 'the entry shows the escaped edited work');
  assert.ok(await edited.getByText('1:05').isVisible(), 'the entry shows the edited duration');
  await app.screenshot('an entry with its escaped edited work and duration');
});

test('axm-c182ae03 a manual duration input is constrained to a value from 0:01 to 24:00', async (t) => {
  const app = await openApp(t, { path: 'time.html' });
  await app.page.evaluate(() => localStorage.clear());
  await app.page.reload();

  const duration = app.page.getByRole('textbox', { name: 'Duration' });
  await duration.waitFor();
  const pattern = await duration.getAttribute('pattern');
  assert.ok(pattern, 'the duration input carries a pattern');
  assert.ok(new RegExp(`^${pattern}$`).test('0:01'), 'the pattern admits 0:01');
  assert.ok(new RegExp(`^${pattern}$`).test('24:00'), 'the pattern admits 24:00');
  assert.ok(!new RegExp(`^${pattern}$`).test('0:00'), 'the pattern rejects 0:00');
  assert.ok(!new RegExp(`^${pattern}$`).test('24:01'), 'the pattern rejects 24:01');

  await app.page.getByRole('button', { name: 'Add an entry by hand' }).click();
  const work = app.page.getByRole('textbox', { name: 'Work', exact: true });
  const add = app.page.getByRole('button', { name: 'Add' });
  const error = app.page.getByText('Duration must be between 0:01 and 24:00.');

  await work.fill('Write the spec');
  await duration.fill('0:00');
  await add.click();
  await error.waitFor();
  assert.ok(await error.isVisible(), 'a duration below 0:01 is refused with an error message');
  assert.equal(await app.page.getByRole('listitem').filter({ hasText: 'Write the spec' }).count(), 0, 'no entry is added for a duration below 0:01');

  await duration.fill('24:01');
  await add.click();
  assert.ok(await error.isVisible(), 'a duration above 24:00 is refused with an error message');
  assert.equal(await app.page.getByRole('listitem').filter({ hasText: 'Write the spec' }).count(), 0, 'no entry is added for a duration above 24:00');

  await duration.fill('0:01');
  await add.click();
  const entry = app.page.getByRole('listitem').filter({ hasText: 'Write the spec' });
  await entry.waitFor();
  assert.ok(await entry.getByText('0:01').isVisible(), 'a duration of 0:01 is accepted');
  await app.screenshot('the manual duration constraint');
});
