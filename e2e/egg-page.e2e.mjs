// The egg page's static display, driven in a real browser: a centered egg emoji with the word
// 'Eggs' below it in sans-serif, three doneness options, and the selected option marked as the
// current choice, all adopting the eggs-web blueprint.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp } from './support/browser.mjs';

test('axm-ddaa8fee a single egg emoji appears centered on the page', async (t) => {
  const app = await openApp(t);
  const emoji = app.page.getByText('🥚', { exact: true });
  await emoji.waitFor();
  // Exactly one egg emoji on the page.
  assert.equal(await emoji.count(), 1);
  // Its horizontal center sits at the viewport's horizontal center.
  const box = await emoji.boundingBox();
  const viewport = app.page.viewportSize();
  const centerX = box.x + box.width / 2;
  assert.ok(Math.abs(centerX - viewport.width / 2) <= 2, `emoji center ${centerX} not at ${viewport.width / 2}`);
  await app.screenshot('centered egg emoji');
});

test('axm-46bfab12 the word Eggs appears below the emoji in sans-serif text', async (t) => {
  const app = await openApp(t);
  const emoji = app.page.getByText('🥚', { exact: true });
  const label = app.page.getByText('Eggs', { exact: true });
  await label.waitFor();
  // The word sits below the emoji.
  const emojiBox = await emoji.boundingBox();
  const labelBox = await label.boundingBox();
  assert.ok(labelBox.y >= emojiBox.y + emojiBox.height, 'Eggs label is not below the emoji');
  // It is set in a sans-serif typeface.
  const fontFamily = await label.evaluate((el) => getComputedStyle(el).fontFamily);
  assert.ok(/sans-serif/i.test(fontFamily), `font-family ${fontFamily} is not sans-serif`);
  await app.screenshot('eggs text below emoji');
});

test('axm-dfe772b8 the page shows three options labelled soft, medium, and hard boiled', async (t) => {
  const app = await openApp(t);
  const soft = app.page.getByRole('radio', { name: 'Soft boiled' });
  const medium = app.page.getByRole('radio', { name: 'Medium boiled' });
  const hard = app.page.getByRole('radio', { name: 'Hard boiled' });
  await soft.waitFor();
  assert.equal(await soft.count(), 1);
  assert.equal(await medium.count(), 1);
  assert.equal(await hard.count(), 1);
  await app.screenshot('three doneness options');
});

test('axm-713a8aca selecting an option marks it as the current choice', async (t) => {
  const app = await openApp(t);
  const medium = app.page.getByRole('radio', { name: 'Medium boiled' });
  await medium.check();
  assert.equal(await medium.isChecked(), true);
  await app.screenshot('medium boiled marked as current choice');
});

test('axm-5fd0de43 the egg timer page adopts the eggs-web blueprint', async (t) => {
  const app = await openApp(t);
  // The blueprint's tokens are declared on :root and drive the page.
  const tokens = await app.page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    return {
      bg: root.getPropertyValue('--bg').trim(),
      font: root.getPropertyValue('--font').trim(),
    };
  });
  assert.equal(tokens.bg, '#fbf8f3');
  assert.ok(/sans-serif/i.test(tokens.font), `--font ${tokens.font} is not sans-serif`);
  // The page is the one blueprint page: a header and main landmark, and the app module.
  const structure = await app.page.evaluate(() => ({
    header: Boolean(document.querySelector('header')),
    main: Boolean(document.querySelector('main')),
    module: Boolean(document.querySelector('script[type="module"][src="src/app.mjs"]')),
  }));
  assert.equal(structure.header, true);
  assert.equal(structure.main, true);
  assert.equal(structure.module, true);
  await app.screenshot('eggs-web blueprint adoption');
});
