// Persistence and failure handling: every action saves before returning, saved entries
// survive a reload, and a failed action shows an error message.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp } from './support/browser.mjs';

test('axm-46838f30 each action saves the entry before it returns and a saved entry remains after a reload', async (t) => {
  const app = await openApp(t, { path: 'time.html' });
  await app.page.evaluate(() => localStorage.clear());
  await app.page.reload();

  // Add an entry by hand: the action saves before it returns.
  await app.page.getByRole('button', { name: 'Add an entry by hand' }).click();
  await app.page.getByRole('textbox', { name: 'Work', exact: true }).fill('Write the spec');
  await app.page.getByRole('textbox', { name: 'Duration' }).fill('0:05');
  await app.page.getByRole('button', { name: 'Add' }).click();

  const entry = app.page.getByRole('listitem').filter({ hasText: 'Write the spec' });
  await entry.waitFor();
  assert.ok(await entry.getByText('0:05').isVisible(), 'the added entry appears with its duration');

  // The save happened before the action returned: the entry is in storage now.
  const saved = await app.page.evaluate(() => JSON.parse(localStorage.getItem('eggs.entries')));
  assert.ok(saved.some((e) => e.work === 'Write the spec' && e.duration === 300), 'the add action saved the entry before returning');

  // Start a timer: the action saves before it returns.
  await app.page.getByRole('textbox', { name: 'What are you working on?' }).nth(0).fill('Fix the login bug');
  await app.page.getByRole('button', { name: 'Start' }).click();
  const running = app.page.getByRole('listitem').filter({ hasText: 'Fix the login bug' });
  await running.waitFor();
  const savedAfterStart = await app.page.evaluate(() => JSON.parse(localStorage.getItem('eggs.entries')));
  assert.ok(savedAfterStart.some((e) => e.work === 'Fix the login bug' && e.running === true), 'the start action saved the entry before returning');

  // Stop the timer: the action saves before it returns.
  await running.getByRole('button', { name: 'Stop Fix the login bug' }).click();
  const savedAfterStop = await app.page.evaluate(() => JSON.parse(localStorage.getItem('eggs.entries')));
  const stopped = savedAfterStop.find((e) => e.work === 'Fix the login bug');
  assert.equal(stopped.running, false, 'the stop action saved the entry before returning');
  assert.ok(typeof stopped.duration === 'number', 'the stopped entry carries its duration in storage');

  // A saved entry remains after a reload.
  await app.page.reload();
  const reloaded = app.page.getByRole('listitem').filter({ hasText: 'Write the spec' });
  await reloaded.waitFor();
  assert.ok(await reloaded.getByText('0:05').isVisible(), 'the saved entry remains after a reload');
  const reloadedStopped = app.page.getByRole('listitem').filter({ hasText: 'Fix the login bug' });
  await reloadedStopped.waitFor();
  assert.ok(await reloadedStopped.getByText('0:00').isVisible(), 'the stopped entry remains after a reload with its duration');
  await app.screenshot('entries saved before returning and remaining after a reload');
});

test('axm-a6d8cd59 the outputs include the entry list with durations, the day total, a running timer, an undo offer, and an error message', async (t) => {
  const app = await openApp(t, {
    path: 'time.html',
    beforeNavigate: async (page) => {
      await page.clock.install();
      await page.clock.setFixedTime(new Date('2025-01-07T10:00:00.000Z'));
      await page.addInitScript(() => localStorage.setItem('eggs.entries', JSON.stringify([
        { id: 'seed-one', work: 'Write the spec', project: 'Admin', startedAt: '2025-01-07T10:00:00.000Z', running: false, duration: 300 },
      ])));
    },
  });

  // The entry list with durations and the day's total.
  const list = app.page.getByRole('list');
  await list.waitFor();
  const seed = app.page.getByRole('listitem').filter({ hasText: 'Write the spec' });
  assert.ok(await seed.getByText('0:05').isVisible(), 'the entry list shows the entry with its duration');
  const total = app.page.locator('#day-total');
  await total.waitFor();
  assert.equal(await total.textContent(), '0:05', 'the day total appears');

  // A running timer display.
  await app.page.getByRole('textbox', { name: 'What are you working on?' }).nth(0).fill('Fix the login bug');
  await app.page.getByRole('button', { name: 'Start' }).click();
  const running = app.page.getByRole('listitem').filter({ hasText: 'Fix the login bug' });
  await running.waitFor();
  const timer = running.getByText(/\d+:\d{2}:\d{2}/);
  await timer.waitFor();
  assert.ok(await timer.isVisible(), 'a running timer display appears');

  // An undo offer after a delete.
  await seed.getByRole('button', { name: 'Delete Write the spec' }).click();
  const undo = app.page.getByRole('button', { name: 'Undo' });
  await undo.waitFor();
  assert.ok(await undo.isVisible(), 'an undo offer appears after a delete');

  // An error message when an action fails.
  await app.page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function () {
      throw new Error('QuotaExceededError');
    };
  });
  await app.page.getByRole('button', { name: 'Add an entry by hand' }).click();
  await app.page.getByRole('textbox', { name: 'Work', exact: true }).fill('Review the pull request');
  await app.page.getByRole('textbox', { name: 'Duration' }).fill('0:05');
  await app.page.getByRole('button', { name: 'Add' }).click();
  const error = app.page.getByText('Could not save. Your change was not saved.');
  await error.waitFor();
  assert.ok(await error.isVisible(), 'an error message appears when an action fails');
  await app.screenshot('the outputs: list, total, running timer, undo, and error');
});

test('axm-e7441746 when the page reloads an entry that exists for today still appears with its work, its project and its duration', async (t) => {
  const app = await openApp(t, { path: 'time.html' });
  const startedAt = new Date().toISOString();
  await app.page.evaluate((startedAt) => {
    localStorage.setItem('eggs.entries', JSON.stringify([
      { id: 'seed-one', work: 'Write the spec', project: 'Client work', startedAt, running: false, duration: 300 },
    ]));
  }, startedAt);
  await app.page.reload();

  const entry = app.page.getByRole('listitem').filter({ hasText: 'Write the spec' });
  await entry.waitFor();
  assert.ok(await entry.getByText('Write the spec').isVisible(), 'the entry still appears with its work');
  const projectSelect = entry.getByRole('combobox', { name: 'Project for Write the spec' });
  assert.equal(await projectSelect.inputValue(), 'Client work', 'the entry still appears with its project');
  assert.ok(await entry.getByText('0:05').isVisible(), 'the entry still appears with its duration');
  await app.screenshot('an entry that survives a reload with its work, project and duration');
});

test('axm-ebaa74a8 when an action fails the system shows an error message', async (t) => {
  const app = await openApp(t, { path: 'time.html' });
  await app.page.evaluate(() => localStorage.clear());
  await app.page.reload();

  // Make every save fail.
  await app.page.evaluate(() => {
    Storage.prototype.setItem = function () {
      throw new Error('QuotaExceededError');
    };
  });

  await app.page.getByRole('button', { name: 'Add an entry by hand' }).click();
  await app.page.getByRole('textbox', { name: 'Work', exact: true }).fill('Write the spec');
  await app.page.getByRole('textbox', { name: 'Duration' }).fill('0:05');
  await app.page.getByRole('button', { name: 'Add' }).click();

  const error = app.page.getByText('Could not save. Your change was not saved.');
  await error.waitFor();
  assert.ok(await error.isVisible(), 'the system shows an error message when an action fails');
  assert.equal(await app.page.getByRole('listitem').filter({ hasText: 'Write the spec' }).count(), 0, 'no entry is added when the save fails');
  await app.screenshot('an error message when an action fails');
});
