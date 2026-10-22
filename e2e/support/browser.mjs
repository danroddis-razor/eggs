// The one way an end-to-end test reaches the app: serve the repository, open it in headless
// Chromium, and take a screenshot a person can look at afterwards.
//
//   import { test } from 'node:test';
//   import { openApp } from './support/browser.mjs';
//
//   test('axm-1234abcd a visitor sees the timer', async (t) => {
//     const app = await openApp(t);
//     await app.page.getByRole('button', { name: 'Start' }).click();
//     await app.screenshot('timer-started');
//   });
//
// openApp closes the browser and the server when the test ends. Screenshots land in
// reports/screenshots, which the end-to-end gate declares as its artifacts.
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const require = createRequire(import.meta.url);

// Playwright is not a dependency of this repository: the worker image carries it globally, and a
// person running locally points EGGS_PLAYWRIGHT at an installed copy.
function playwright() {
  const places = [process.env.EGGS_PLAYWRIGHT, 'playwright', '/usr/local/lib/node_modules/playwright'].filter(Boolean);
  for (const place of places) {
    try {
      return require(place);
    } catch {
      // try the next place
    }
  }
  throw new Error(`Playwright was not found in ${places.join(', ')}. Set EGGS_PLAYWRIGHT to an installed copy.`);
}

const shots = fileURLToPath(new URL('../../reports/screenshots/', import.meta.url));

export async function openApp(t, { path = '', viewport = { width: 1280, height: 800 } } = {}) {
  const { server, url } = await serve();
  const browser = await playwright().chromium.launch();
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  t.after(async () => {
    await browser.close();
    server.close();
  });
  await page.goto(new URL(path, url).href);

  const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return {
    page,
    url,
    errors,
    async screenshot(name) {
      await mkdir(shots, { recursive: true });
      const file = `${shots}${slug(t.name)}--${slug(name)}.png`;
      await page.screenshot({ path: file, fullPage: true });
      return file;
    },
  };
}
