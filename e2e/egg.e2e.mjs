// The egg page: one egg emoji centered on the page, the word 'Eggs' below it in sans-serif text.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { openApp } from './support/browser.mjs';

test('axm-8d3fe7ec a single egg emoji appears centered on the page', async (t) => {
  const app = await openApp(t);
  const egg = app.page.getByText('🥚');
  await egg.waitFor();
  assert.equal(await egg.count(), 1);
  const box = await egg.boundingBox();
  const viewport = app.page.viewportSize();
  assert.ok(Math.abs(box.x + box.width / 2 - viewport.width / 2) <= 2, 'the egg emoji is centered horizontally');
  assert.equal(await app.page.locator('input, select, textarea, button').count(), 0, 'the page has no inputs');
  assert.equal(await app.page.evaluate(() => Object.keys(localStorage).length), 0, 'the page mutates no state');
  await app.screenshot('centered egg emoji');
});

test('axm-cf360075 the word Eggs appears below the emoji in sans-serif text', async (t) => {
  const app = await openApp(t);
  const word = app.page.getByText('Eggs', { exact: true });
  await word.waitFor();
  const egg = app.page.getByText('🥚');
  const eggBox = await egg.boundingBox();
  const wordBox = await word.boundingBox();
  assert.ok(wordBox.y > eggBox.y + eggBox.height, 'the word Eggs sits below the emoji');
  const family = await word.evaluate((el) => getComputedStyle(el).fontFamily);
  assert.ok(/sans-serif/i.test(family), `the word Eggs is sans-serif text, got: ${family}`);
  assert.equal(await app.page.locator('input, select, textarea, button').count(), 0, 'the page has no inputs');
  assert.equal(await app.page.evaluate(() => Object.keys(localStorage).length), 0, 'the page mutates no state');
  await app.screenshot('eggs text below emoji');
});

test('axm-b30e430d eggs adopts the eggs-web blueprint', async (t) => {
  const app = await openApp(t);
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(/<script\s+type="module"\s+src="src\/app\.mjs">/.test(html), 'index.html loads src/app.mjs as a module');
  const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  for (const token of ['--bg', '--surface', '--text', '--muted', '--accent', '--line', '--space', '--radius', '--font']) {
    assert.ok(css.includes(token), `styles.css defines the ${token} token`);
  }
  assert.ok(css.includes('prefers-color-scheme: dark'), 'styles.css carries the dark values');
  assert.ok(existsSync(new URL('../src/app.mjs', import.meta.url)), 'src/app.mjs exists');
  assert.ok(await app.page.locator('header').count() >= 1, 'the page has a header landmark');
  assert.ok(await app.page.locator('main').count() >= 1, 'the page has a main landmark');
  assert.equal(await app.page.locator('script[src*="http"]').count(), 0, 'no CDN script');
  await app.screenshot('blueprint adoption');
});

test('axm-e6342065 each end-to-end test takes a screenshot of its outcome', async (t) => {
  const app = await openApp(t);
  const file = await app.screenshot('screenshot of the outcome');
  assert.ok(existsSync(file), 'the screenshot of the outcome exists');
});
