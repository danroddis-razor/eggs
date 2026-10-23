// Clients and projects adopt the eggs-web blueprint: the rules live in their own modules
// under src/ as pure functions over plain objects, storage lives in src/store.mjs only,
// and the clients page loads its module as a plain ES module.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { makeClient, isValidClientName, clientsWithProjects } from '../src/clients.mjs';
import { makeProject, archiveProject, activeProjects, pickerGroups, firstPickerProject } from '../src/projects.mjs';

test('axm-9dc1a131 clients and projects adopt the eggs-web blueprint', () => {
  const srcDir = fileURLToPath(new URL('../src/', import.meta.url));
  assert.ok(existsSync(`${srcDir}clients.mjs`), 'src/clients.mjs exists');
  assert.ok(existsSync(`${srcDir}projects.mjs`), 'src/projects.mjs exists');
  assert.ok(existsSync(`${srcDir}store.mjs`), 'src/store.mjs exists');

  // Storage lives in src/store.mjs only: no other module touches localStorage.
  for (const file of readdirSync(srcDir)) {
    if (!file.endsWith('.mjs') || file === 'store.mjs') continue;
    const source = readFileSync(`${srcDir}${file}`, 'utf8');
    assert.ok(!/localStorage/.test(source), `src/${file} does not touch localStorage; only src/store.mjs does`);
  }

  // The clients page loads its module as a plain ES module, with no CDN script.
  const html = readFileSync(new URL('../clients.html', import.meta.url), 'utf8');
  assert.ok(/<script\s+type="module"\s+src="src\/clients-page\.mjs">/.test(html), 'clients.html loads src/clients-page.mjs as a module');
  assert.ok(!/src="http/.test(html), 'clients.html loads no CDN script');

  // The rules are pure functions over plain objects: they build and change records
  // without touching the page or storage.
  const client = makeClient({ name: 'Acme' });
  assert.equal(client.name, 'Acme', 'makeClient sets the name');
  assert.equal(typeof client.id, 'string', 'makeClient assigns an id');
  assert.ok(isValidClientName('Acme'), 'a client name is valid');
  const project = makeProject({ name: 'Design', clientId: client.id, rate: 75, billable: true });
  assert.equal(project.clientId, client.id, 'makeProject sets the clientId');
  assert.equal(project.rate, 75, 'makeProject sets the rate');
  assert.equal(project.billable, true, 'makeProject sets the billable flag');
  assert.equal(project.archived, false, 'a new project is not archived');
  const archived = archiveProject(project);
  assert.equal(archived.archived, true, 'archiveProject sets the archived flag');
  assert.equal(project.archived, false, 'archiveProject does not mutate the original');
  assert.equal(activeProjects([archived]).length, 0, 'activeProjects excludes the archived project');
  const other = makeProject({ name: 'Development', clientId: client.id, rate: 50, billable: true });
  assert.deepEqual(
    pickerGroups([client], [archived, other]).flatMap((g) => g.projects.map((p) => p.name)),
    ['Development'],
    'the picker hides the archived project and offers the active one',
  );
  assert.equal(firstPickerProject([client], [project]), 'Design', 'the picker offers the client\'s project');
  const withProjects = clientsWithProjects([client], [project]);
  assert.equal(withProjects[0].projects.length, 1, 'clientsWithProjects attaches the client\'s projects');
});
