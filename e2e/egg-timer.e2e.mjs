// The egg timer page, driven in a real browser: a person picks a doneness, presses Start,
// watches the countdown, and reads the ready message when it reaches zero.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp } from './support/browser.mjs';

// The fake clock fires a one-second interval once per fastForward, so advance one second at a time.
async function advanceSeconds(app, seconds) {
  for (let i = 0; i < seconds; i++) {
    await app.page.clock.fastForward(1000);
  }
}

test('axm-6f68a945 Start begins a countdown for the selected doneness', async (t) => {
  const app = await openApp(t);
  await app.page.clock.install();
  await app.page.getByRole('radio', { name: 'Soft' }).check();
  await app.page.getByRole('button', { name: 'Start' }).click();
  await app.page.getByText('6 minutes 00 seconds').waitFor();
  await app.screenshot('start begins countdown');
});

test('axm-c752f094 the page shows a message that the egg is ready when the countdown reaches zero', async (t) => {
  const app = await openApp(t);
  await app.page.clock.install();
  await app.page.getByRole('radio', { name: 'Soft' }).check();
  await app.page.getByRole('button', { name: 'Start' }).click();
  // Run to 0 minutes 01 second, then let one more second pass.
  await advanceSeconds(app, 359);
  await app.page.getByText('0 minutes 01 second').waitFor();
  await advanceSeconds(app, 1);
  await app.page.getByText('Your egg is ready.').waitFor();
  await app.screenshot('ready message at zero');
});
