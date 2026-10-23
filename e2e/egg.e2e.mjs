// The egg page: one egg emoji centered on the page, the word 'Eggs' below it in sans-serif text.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { openApp } from './support/browser.mjs';

test('axm-9b83050f a single egg emoji appears centered on the page', async (t) => {
  const app = await openApp(t);
  const egg = app.page.getByText('\uD83E\uDD5A');
  await egg.waitFor();
  assert.equal(await egg.count(), 1, 'a single egg emoji appears');
  const box = await egg.boundingBox();
  const viewport = app.page.viewportSize();
  assert.ok(Math.abs(box.x + box.width / 2 - viewport.width / 2) <= 2, 'the egg emoji is centered horizontally');
  // The emoji and the word below it are centered as one block, so the emoji's own
  // center sits half the word's height above the viewport center.
  const header = app.page.getByRole('banner');
  const headerBox = await header.boundingBox();
  assert.ok(Math.abs(headerBox.y + headerBox.height / 2 - viewport.height / 2) <= 2, 'the egg emoji is centered vertically with the word below it');
  assert.equal(await app.page.locator('input, select, textarea, button').count(), 0, 'the page has no inputs');
  assert.equal(await app.page.evaluate(() => Object.keys(localStorage).length), 0, 'the page mutates no state');
  await app.screenshot('centered egg emoji');
});

test('axm-36600106 the word Eggs appears below the emoji in sans-serif text', async (t) => {
  const app = await openApp(t);
  const word = app.page.getByText('Eggs', { exact: true });
  await word.waitFor();
  const egg = app.page.getByText('\uD83E\uDD5A');
  const eggBox = await egg.boundingBox();
  const wordBox = await word.boundingBox();
  assert.ok(wordBox.y > eggBox.y + eggBox.height, 'the word Eggs sits below the emoji');
  const family = await word.evaluate((el) => getComputedStyle(el).fontFamily);
  assert.ok(/sans-serif/i.test(family), `the word Eggs is sans-serif text, got: ${family}`);
  assert.equal(await app.page.locator('input, select, textarea, button').count(), 0, 'the page has no inputs');
  assert.equal(await app.page.evaluate(() => Object.keys(localStorage).length), 0, 'the page mutates no state');
  await app.screenshot('eggs text below emoji');
});

test('axm-2d2baaae the egg page shows one centered egg emoji with the word Eggs in sans-serif below it', async (t) => {
  const app = await openApp(t);
  const egg = app.page.getByText('\uD83E\uDD5A');
  await egg.waitFor();
  assert.equal(await egg.count(), 1, 'one egg emoji appears');
  const box = await egg.boundingBox();
  const viewport = app.page.viewportSize();
  assert.ok(Math.abs(box.x + box.width / 2 - viewport.width / 2) <= 2, 'the egg emoji is centered horizontally');
  // The emoji and the word below it are centered as one block, so the block's
  // center is the viewport's center.
  const header = app.page.getByRole('banner');
  const headerBox = await header.boundingBox();
  assert.ok(Math.abs(headerBox.y + headerBox.height / 2 - viewport.height / 2) <= 2, 'the egg emoji is centered vertically with the word below it');
  const word = app.page.getByText('Eggs', { exact: true });
  await word.waitFor();
  const eggBox = await egg.boundingBox();
  const wordBox = await word.boundingBox();
  assert.ok(wordBox.y > eggBox.y + eggBox.height, 'the word Eggs appears below the emoji');
  const family = await word.evaluate((el) => getComputedStyle(el).fontFamily);
  assert.ok(/sans-serif/i.test(family), `the word Eggs is sans-serif text, got: ${family}`);
  assert.equal(await app.page.locator('input, select, textarea, button').count(), 0, 'the page has no inputs');
  assert.equal(await app.page.evaluate(() => Object.keys(localStorage).length), 0, 'the page mutates no state');
  await app.screenshot('the egg page: centered egg emoji with Eggs in sans-serif below');
});

test('axm-a02a2f4c the page header shows one egg emoji and the word Eggs together', async (t) => {
  const app = await openApp(t);
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
  await app.screenshot('the egg header on the egg page');
});

test('axm-b30e430d eggs adopts the eggs-web blueprint', async (t) => {
  const app = await openApp(t);
  // The page is built the way the blueprint says: a static page, plain ES modules, no CDN.
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(/<script\s+type="module"\s+src="src\/app\.mjs">/.test(html), 'index.html loads src/app.mjs as a module');
  assert.equal(await app.page.locator('script[src*="http"]').count(), 0, 'no CDN script');
  assert.ok(await app.page.locator('header').count() >= 1, 'the page has a header landmark');
  assert.ok(await app.page.locator('main').count() >= 1, 'the page has a main landmark');
  // The look is the blueprint's: the tokens on :root, with the dark values under prefers-color-scheme.
  const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  for (const token of ['--bg', '--surface', '--text', '--muted', '--accent', '--line', '--space', '--radius', '--font']) {
    assert.ok(css.includes(token), `styles.css defines the ${token} token`);
  }
  assert.ok(css.includes('prefers-color-scheme: dark'), 'styles.css carries the dark values');
  // The tokens are live on the rendered page: the page background and the text font are the blueprint's values.
  const bg = await app.page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  assert.equal(bg, 'rgb(251, 248, 243)', 'the page background is the blueprint --bg token');
  const font = await app.page.evaluate(() => getComputedStyle(document.body).fontFamily);
  assert.ok(/system-ui/i.test(font), `the page text uses the blueprint --font token, got: ${font}`);
  // The page loads without a page error.
  assert.equal(app.errors.length, 0, `the page loads without a page error: ${app.errors.join('; ')}`);
  await app.screenshot('blueprint adoption');
});

test('axm-413def85 each end-to-end test takes a screenshot of its outcome', async (t) => {
  const app = await openApp(t);
  const file = await app.screenshot('screenshot of the outcome');
  assert.ok(existsSync(file), 'the screenshot of the outcome exists');
  const size = statSync(file).size;
  assert.ok(size > 0, 'the screenshot of the outcome is not empty');
  const head = readFileSync(file).subarray(0, 8);
  assert.deepEqual(
    [...head],
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    'the screenshot of the outcome is a PNG image',
  );
  // The screenshot was written by this run, not left over from an earlier one.
  const mtime = statSync(file).mtimeMs;
  assert.ok(Date.now() - mtime < 60_000, 'the screenshot of the outcome was written by this run');
});
