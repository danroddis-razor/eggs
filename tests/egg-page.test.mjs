// End-to-end tests for the egg page.
//
// The specification promises only what a visitor sees: one egg emoji centered
// on the page, and the word 'Eggs' below it in sans-serif text. These tests
// therefore exercise the page through its public contract — the visible
// output — and select elements by what the page shows, never by internal
// classes or ids (which may change without a change to what the page shows).
//
// The page is a static document, so "driving the page" means reading the
// document a visitor would receive and asserting on the visible text it
// contains, in the order a visitor reads it, and on the stylesheet
// declarations that determine what the visitor sees.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const page = await readFile(join(root, 'index.html'), 'utf8');

// The visible text of the document, in the order a visitor reads it.
// Comments, style and script content are not visible; everything else is,
// with tags removed.
function visibleText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<head[\s\S]*?<\/head>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
}

// The stylesheet declarations the page applies to what the visitor sees.
function stylesheet(html) {
  return [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
    .map((m) => m[1])
    .join('\n');
}

const text = visibleText(page);
const css = stylesheet(page);

// The egg emoji, selected by what it is on screen.
const EGG = '\u{1F95A}';

test('axm-0afdddde elements are selected by visible output, not internal classes or ids', () => {
  // The page's visible output must carry the egg emoji and the word 'Eggs',
  // and both must be locatable by their visible text alone — the way a
  // visitor sees them — rather than by any internal class or id.
  assert.ok(text.includes(EGG), 'the visible output must contain the egg emoji');
  assert.ok(text.includes('Eggs'), "the visible output must contain the word 'Eggs'");
});

test('axm-a24431c5 the word Eggs appears below the emoji in sans-serif text', () => {
  // 'Eggs' appears in the visible output, after the emoji in reading order.
  const eggIndex = text.indexOf(EGG);
  const eggsIndex = text.indexOf('Eggs');
  assert.ok(eggIndex !== -1, 'the egg emoji must appear in the visible output');
  assert.ok(eggsIndex !== -1, "the word 'Eggs' must appear in the visible output");
  assert.ok(
    eggsIndex > eggIndex,
    "the word 'Eggs' must appear below (after) the emoji in reading order"
  );

  // The text is set in a sans-serif typeface.
  assert.ok(
    /font-family\s*:\s*[^;]*sans-serif/i.test(css),
    "the word 'Eggs' must be set in sans-serif text"
  );
});

test('axm-e060e9f6 a single egg emoji appears centered on the page', () => {
  // Exactly one egg emoji in the visible output.
  const count = text.split(EGG).length - 1;
  assert.equal(count, 1, 'a single egg emoji must appear on the page');

  // The emoji is centered on the page: the stylesheet centers its container
  // both horizontally and vertically.
  const centers =
    /display\s*:\s*flex/i.test(css) &&
    /justify-content\s*:\s*center/i.test(css) &&
    /align-items\s*:\s*center/i.test(css);
  assert.ok(
    centers,
    'the egg emoji must be centered on the page (centered horizontally and vertically)'
  );
});
