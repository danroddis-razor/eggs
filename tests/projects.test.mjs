// Clients and projects adopt the eggs-web blueprint: rules as pure functions in their own
// modules, storage in src/store.mjs, no reference to the page.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { makeProject, archiveProject, activeProjects, projectsForClient, pickerGroups, firstPickerProject, formatRate, billableAmount, PROJECTS, isValidProjectName, isValidRate } from '../src/projects.mjs';
import { makeClient, clientsWithProjects, isValidClientName } from '../src/clients.mjs';
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

test('the picker lists projects grouped by client and the first listed project is chosen first', (t) => {
  const acme = makeClient({ name: 'Acme' });
  const beta = makeClient({ name: 'Beta' });
  const design = makeProject({ name: 'Design', clientId: acme.id, rate: 75, billable: true });
  const dev = makeProject({ name: 'Development', clientId: acme.id, rate: 50, billable: true });
  const support = makeProject({ name: 'Support', clientId: beta.id, rate: 30, billable: false });

  // The picker shows projects grouped by client, in the order the clients were added.
  const groups = pickerGroups([acme, beta], [design, dev, support]);
  assert.equal(groups.length, 2, 'the picker has one group per client');
  assert.equal(groups[0].client.name, 'Acme', 'the first group is the first client');
  assert.deepEqual(groups[0].projects.map((p) => p.name), ['Design', 'Development'], 'the first group lists Acme\'s projects');
  assert.equal(groups[1].client.name, 'Beta', 'the second group is the second client');
  assert.deepEqual(groups[1].projects.map((p) => p.name), ['Support'], 'the second group lists Beta\'s projects');

  // When projects exist, the first listed project is chosen first.
  assert.equal(firstPickerProject([acme, beta], [design, dev, support]), 'Design', 'the first listed project is chosen first');
});

test('when there are no projects yet the picker offers Admin, Client work and Internal under a client called Eggs', (t) => {
  // No projects: the default Eggs client offers the short list, with Admin first.
  const groups = pickerGroups([], []);
  assert.equal(groups.length, 1, 'the picker has one group');
  assert.equal(groups[0].client.name, 'Eggs', 'the group is under a client called Eggs');
  assert.deepEqual(groups[0].projects.map((p) => p.name), ['Admin', 'Client work', 'Internal'], 'the group offers Admin, Client work and Internal');
  assert.equal(firstPickerProject([], []), 'Admin', 'Admin is chosen first');

  // No clients either: the same default.
  const noClients = pickerGroups(null, null);
  assert.equal(noClients[0].client.name, 'Eggs', 'the default client is Eggs when there are no clients');
  assert.deepEqual(noClients[0].projects.map((p) => p.name), PROJECTS, 'the default group offers the short list');
});

test('archiving a project hides it from the picker but keeps its entries', (t) => {
  const acme = makeClient({ name: 'Acme' });
  const design = makeProject({ name: 'Design', clientId: acme.id, rate: 75, billable: true });
  const dev = makeProject({ name: 'Development', clientId: acme.id, rate: 50, billable: true });

  // Before archiving, both projects are in the picker.
  assert.deepEqual(pickerGroups([acme], [design, dev]).flatMap((g) => g.projects.map((p) => p.name)), ['Design', 'Development'], 'both projects are in the picker');

  // Archive Design: it is hidden from the picker.
  const archived = archiveProject(design);
  const groups = pickerGroups([acme], [archived, dev]);
  assert.deepEqual(groups.flatMap((g) => g.projects.map((p) => p.name)), ['Development'], 'the archived project is hidden from the picker');
  assert.equal(activeProjects([archived, dev]).length, 1, 'activeProjects excludes the archived project');

  // The archived project's entries remain: the project is still in the list, and its
  // entries still count toward the billable amount.
  const startedAt = new Date().toISOString();
  const entries = [
    { id: 'one', work: 'Design the logo', project: 'Design', startedAt, running: false, duration: 3600 },
    { id: 'two', work: 'Write the code', project: 'Development', startedAt, running: false, duration: 3600 },
  ];
  const all = [archived, dev];
  assert.equal(all.find((p) => p.id === design.id), archived, 'the archived project is still in the project list');
  assert.equal(billableAmount(entries, all), 125, 'the archived project\'s entries still count toward the billable amount');
});

test('the outputs include the client list, the project list grouped by client, the default Eggs client, and the billable amount', (t) => {
  const acme = makeClient({ name: 'Acme' });
  const design = makeProject({ name: 'Design', clientId: acme.id, rate: 75, billable: true });
  const dev = makeProject({ name: 'Development', clientId: acme.id, rate: 50, billable: false });

  // The client list: the added client name as plain text.
  const clients = [acme];
  assert.equal(clients[0].name, 'Acme', 'the client list shows the added client name');

  // The project list grouped by client.
  const groups = pickerGroups(clients, [design, dev]);
  assert.equal(groups.length, 1, 'the project list has one group for the client');
  assert.equal(groups[0].client.name, 'Acme', 'the group is under the client');
  assert.deepEqual(groups[0].projects.map((p) => p.name), ['Design', 'Development'], 'the group lists the client\'s projects');

  // The default Eggs client with Admin, Client work and Internal.
  const defaultGroups = pickerGroups([], []);
  assert.equal(defaultGroups[0].client.name, 'Eggs', 'the default client is Eggs');
  assert.deepEqual(defaultGroups[0].projects.map((p) => p.name), ['Admin', 'Client work', 'Internal'], 'the default group offers Admin, Client work and Internal');

  // The billable amount: billable hours times each project's rate, added together.
  const startedAt = new Date().toISOString();
  const entries = [
    { id: 'one', work: 'Design the logo', project: 'Design', startedAt, running: false, duration: 3600 },
    { id: 'two', work: 'Write the code', project: 'Development', startedAt, running: false, duration: 3600 },
  ];
  assert.equal(billableAmount(entries, [design, dev]), 75, 'the billable amount is the billable hours times the billable project\'s rate');

  // A non-billable project does not count.
  const nonBillable = [{ id: 'three', work: 'Write the code', project: 'Development', startedAt, running: false, duration: 3600 }];
  assert.equal(billableAmount(nonBillable, [design, dev]), 0, 'a non-billable project does not count toward the billable amount');

  // Two billable projects: 1 hour at £75 plus 2 hours at £50.
  const dev2 = makeProject({ name: 'Development', clientId: acme.id, rate: 50, billable: true });
  const both = [
    { id: 'one', work: 'Design the logo', project: 'Design', startedAt, running: false, duration: 3600 },
    { id: 'two', work: 'Write the code', project: 'Development', startedAt, running: false, duration: 7200 },
  ];
  assert.equal(billableAmount(both, [design, dev2]), 175, 'the billable amount adds the billable hours times each project\'s rate');

  // A running entry does not count.
  const running = [{ id: 'four', work: 'Design the logo', project: 'Design', startedAt, running: true }];
  assert.equal(billableAmount(running, [design]), 0, 'a running entry does not count toward the billable amount');
});

test('the system accepts a client name of up to 100 characters, a project name, a rate, a billable flag, and an archive choice', (t) => {
  // A client name of up to 100 characters.
  assert.ok(isValidClientName('A'), 'a one-character client name is valid');
  assert.ok(isValidClientName('A'.repeat(100)), 'a 100-character client name is valid');
  assert.ok(!isValidClientName('A'.repeat(101)), 'a 101-character client name is not valid');
  assert.ok(!isValidClientName(''), 'an empty client name is not valid');

  // A project name under a client.
  assert.ok(isValidProjectName('Design'), 'a project name is valid');
  assert.ok(isValidProjectName('A'.repeat(100)), 'a 100-character project name is valid');
  assert.ok(!isValidProjectName('A'.repeat(101)), 'a 101-character project name is not valid');
  assert.ok(!isValidProjectName(''), 'an empty project name is not valid');

  // An hourly rate in pounds.
  assert.ok(isValidRate(75), 'a whole-pound rate is valid');
  assert.ok(isValidRate(75.5), 'a rate with pence is valid');
  assert.ok(isValidRate(0), 'a zero rate is valid');
  assert.ok(!isValidRate(-1), 'a negative rate is not valid');
  assert.ok(!isValidRate('abc'), 'a non-numeric rate is not valid');

  // A billable flag and an archive choice.
  const project = makeProject({ name: 'Design', clientId: 'c1', rate: 75, billable: true });
  assert.equal(project.billable, true, 'the billable flag is set');
  const archived = archiveProject(project);
  assert.equal(archived.archived, true, 'the archive choice is set');
});

test('a rate shows in pounds with two decimals', (t) => {
  assert.equal(formatRate(75), '£75.00', 'a whole-pound rate shows with two decimals');
  assert.equal(formatRate(75.5), '£75.50', 'a rate with pence shows with two decimals');
  assert.equal(formatRate(0), '£0.00', 'a zero rate shows with two decimals');
  assert.equal(formatRate(12.345), '£12.35', 'a rate with more than two decimals rounds to two');
});


