// The static server the end-to-end tests stand on: it serves the repository, and nothing outside it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serve } from '../e2e/support/serve.mjs';

test('the harness serves a file of the repository', async (t) => {
  const { server, url } = await serve();
  t.after(() => server.close());
  const response = await fetch(new URL('package.json', url));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).name, 'eggs');
});

test('the harness answers 404 for a path outside the repository', async (t) => {
  const { server, url } = await serve();
  t.after(() => server.close());
  const response = await fetch(new URL('/../../etc/hosts', url));
  assert.equal(response.status, 404);
});
