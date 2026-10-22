// Clients and projects adopt the eggs-web blueprint: rules as pure functions in their own
// modules, storage in src/store.mjs, no reference to the page.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { makeProject, archiveProject, activeProjects, projectsForClient } from '../src/projects.mjs';
import { makeClient, clientsWithProjects } from '../src/clients.mjs';
import { loadProjects, saveProjects, loadClients, saveClients } from '../src/store.mjs';

test('axm-496ce038 clients and projects adopt the eggs-web blueprint', (t) => {
  // The modules exist under src/ as the blueprint requires.
  const srcDir = fileURLToPath(new URL('../src/', import.meta.url));
  assert.ok(existsSync(`${srcDir}projects.mjs`), 'src/projects.mjs exists');
  assert.ok(existsSync(`${srcDir}clients.mjs`), 'src/clients.mjs exists');
  assert.ok(existsSync(`${srcDir}store.mjs`), 'src/store.mjs exists');

  // Clients: rules are pure functions over plain objects.
  const client = makeClient({ name: 'Acme' });
  assert.equal(client.name, 'Acme', 'makeClient sets the name');
  assert.equal(typeof client.id, 'string', 'makeClient assigns an id');

  // Projects: rules are pure functions over plain objects.
  const project = makeProject({ name: 'Client work', clientId: client.id, rate: 50, billable: true });
  assert.equal(project.name, 'Client work', 'makeProject sets the name');
  assert.equal(project.clientId, client.id, 'makeProject sets the clientId');
  assert.equal(project.rate, 50, 'makeProject sets the rate');
  assert.equal(project.billable, true, 'makeProject sets the billable flag');
  assert.equal(typeof project.id, 'string', 'makeProject assigns an id');
  assert.equal(project.archived, false, 'a new project is not archived');

  // Archiving a project hides it from the picker but keeps its entries.
  const archived = archiveProject(project);
  assert.equal(archived.archived, true, 'archiveProject sets the archived flag');
  assert.equal(archived.id, project.id, 'archiveProject keeps the project identity');
  assert.equal(project.archived, false, 'archiveProject does not mutate the original');

  // Active projects are those not archived.
  const all = [project, archived];
  const active = activeProjects(all);
  assert.equal(active.length, 1, 'activeProjects excludes archived projects');
  assert.equal(active[0].id, project.id, 'activeProjects keeps the non-archived project');

  // Projects for a client.
  const other = makeProject({ name: 'Internal', clientId: 'c2', rate: 0, billable: false });
  const forClient = projectsForClient([project, other], client.id);
  assert.equal(forClient.length, 1, 'projectsForClient returns only the matching client\'s projects');
  assert.equal(forClient[0].name, 'Client work', 'projectsForClient returns the right project');

  // Clients with their projects.
  const clients = [client, makeClient({ name: 'Beta' })];
  const withProjects = clientsWithProjects(clients, [project, other]);
  assert.equal(withProjects.length, 2, 'clientsWithProjects returns all clients');
  const acme = withProjects.find((c) => c.id === client.id);
  assert.equal(acme.projects.length, 1, 'clientsWithProjects attaches the client\'s projects');
  assert.equal(acme.projects[0].name, 'Client work', 'clientsWithProjects attaches the right project');

  // Storage: src/store.mjs reads and writes localStorage under one key per record kind.
  assert.equal(typeof loadProjects, 'function', 'store.mjs exports loadProjects');
  assert.equal(typeof saveProjects, 'function', 'store.mjs exports saveProjects');
  assert.equal(typeof loadClients, 'function', 'store.mjs exports loadClients');
  assert.equal(typeof saveClients, 'function', 'store.mjs exports saveClients');
});
