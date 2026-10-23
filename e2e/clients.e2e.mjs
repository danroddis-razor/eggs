// The clients page: a person adds a client by name, adds a project under a client
// with an hourly rate in pounds and a billable flag, and archives a project to hide
// it from the picker. The time page's picker lists projects grouped by client, and
// the day's total shows the billable amount.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp } from './support/browser.mjs';

test('axm-3ebc395b a person adds a client by name and the client list shows the added client name as plain text', async (t) => {
  const app = await openApp(t, { path: 'clients.html' });
  await app.page.evaluate(() => localStorage.clear());
  await app.page.reload();

  await app.page.getByRole('textbox', { name: 'Client name' }).fill('Acme');
  await app.page.getByRole('button', { name: 'Add client' }).click();

  const client = app.page.getByRole('listitem').filter({ hasText: 'Acme' });
  await client.waitFor();
  assert.ok(await client.getByText('Acme', { exact: true }).isVisible(), 'the client list shows the added client name as plain text');
  await app.screenshot('a client added by name');
});

test('axm-4185ab41 a person adds a project under a client with a rate and a billable flag, and the project list shows it under that client', async (t) => {
  const app = await openApp(t, { path: 'clients.html' });
  await app.page.evaluate(() => localStorage.clear());
  await app.page.reload();

  await app.page.getByRole('textbox', { name: 'Client name' }).fill('Acme');
  await app.page.getByRole('button', { name: 'Add client' }).click();
  await app.page.getByRole('listitem').filter({ hasText: 'Acme' }).waitFor();

  await app.page.getByRole('textbox', { name: 'Project name' }).fill('Design');
  await app.page.getByRole('spinbutton', { name: 'Hourly rate (£)' }).fill('75');
  await app.page.getByRole('checkbox', { name: 'Billable' }).check();
  await app.page.getByRole('button', { name: 'Add project' }).click();

  const client = app.page.getByRole('listitem').filter({ hasText: 'Acme' });
  await client.waitFor();
  const project = client.getByRole('listitem').filter({ hasText: 'Design' });
  assert.ok(await project.getByText('Design', { exact: true }).isVisible(), 'the project list shows the project under that client');
  assert.ok(await project.getByText('£75.00').isVisible(), 'the project list shows the rate in pounds with two decimals');
  const billable = project.getByText('billable', { exact: true });
  assert.ok(await billable.isVisible(), 'the project list shows the billable flag');
  assert.equal(await billable.getAttribute('aria-label'), 'billable', 'the billable flag is announced to screen readers');
  await app.screenshot('a project added under a client with a rate and a billable flag');
});

test('axm-43539a78 a project can be archived, which hides it from the picker but keeps its entries', async (t) => {
  const app = await openApp(t, { path: 'clients.html' });
  const startedAt = new Date().toISOString();
  await app.page.evaluate((startedAt) => {
    const client = { id: 'c1', name: 'Acme' };
    const project = { id: 'p1', name: 'Design', clientId: 'c1', rate: 75, billable: true, archived: false };
    const entry = { id: 'e1', work: 'Design the logo', project: 'Design', startedAt, running: false, duration: 3600 };
    localStorage.setItem('eggs.clients', JSON.stringify([client]));
    localStorage.setItem('eggs.projects', JSON.stringify([project]));
    localStorage.setItem('eggs.entries', JSON.stringify([entry]));
  }, startedAt);
  await app.page.reload();

  const project = app.page.getByRole('listitem').filter({ hasText: 'Design' }).last();
  await project.waitFor();
  await project.getByRole('button', { name: 'Archive Design' }).click();

  // The archived project is hidden from the picker on the time page.
  const timeApp = await openApp(t, { path: 'time.html' });
  await timeApp.page.reload();
  const picker = timeApp.page.getByRole('combobox', { name: 'Project' });
  await picker.waitFor();
  const options = await picker.locator('option').allTextContents();
  assert.ok(!options.includes('Design'), 'the archived project is hidden from the picker');

  // Its entries remain.
  const entries = await app.page.evaluate(() => JSON.parse(localStorage.getItem('eggs.entries')));
  assert.ok(entries.some((e) => e.project === 'Design'), 'the archived project\'s entries remain');
  await app.screenshot('a project archived, hidden from the picker with its entries kept');
});

test('axm-73b4a8b7 the project picker lists projects grouped by client, in place of the fixed short list', async (t) => {
  const app = await openApp(t, { path: 'time.html' });
  await app.page.evaluate(() => {
    const clients = [{ id: 'c1', name: 'Acme' }, { id: 'c2', name: 'Beta' }];
    const projects = [
      { id: 'p1', name: 'Design', clientId: 'c1', rate: 75, billable: true, archived: false },
      { id: 'p2', name: 'Development', clientId: 'c1', rate: 50, billable: true, archived: false },
      { id: 'p3', name: 'Support', clientId: 'c2', rate: 30, billable: false, archived: false },
    ];
    localStorage.setItem('eggs.clients', JSON.stringify(clients));
    localStorage.setItem('eggs.projects', JSON.stringify(projects));
    localStorage.setItem('eggs.entries', '[]');
  });
  await app.page.reload();

  const picker = app.page.getByRole('combobox', { name: 'Project' });
  await picker.waitFor();
  const groups = await picker.locator('optgroup').all();
  assert.equal(groups.length, 2, 'the picker has one group per client');
  assert.equal(await groups[0].getAttribute('label'), 'Acme', 'the first group is the first client');
  assert.equal(await groups[1].getAttribute('label'), 'Beta', 'the second group is the second client');
  const acmeOptions = await groups[0].locator('option').allTextContents();
  assert.deepEqual(acmeOptions, ['Design', 'Development'], 'the first group lists Acme\'s projects');
  const betaOptions = await groups[1].locator('option').allTextContents();
  assert.deepEqual(betaOptions, ['Support'], 'the second group lists Beta\'s projects');
  assert.equal(await picker.inputValue(), 'Design', 'the first listed project is chosen first');
  await app.screenshot('the project picker grouped by client');
});

test('axm-fd275709 when there are no projects yet the picker offers Admin, Client work and Internal under a client called Eggs', async (t) => {
  const app = await openApp(t, { path: 'time.html' });
  await app.page.evaluate(() => localStorage.clear());
  await app.page.reload();

  const picker = app.page.getByRole('combobox', { name: 'Project' });
  await picker.waitFor();
  const groups = await picker.locator('optgroup').all();
  assert.equal(groups.length, 1, 'the picker has one group');
  assert.equal(await groups[0].getAttribute('label'), 'Eggs', 'the group is under a client called Eggs');
  const options = await groups[0].locator('option').allTextContents();
  assert.deepEqual(options, ['Admin', 'Client work', 'Internal'], 'the group offers Admin, Client work and Internal');
  assert.equal(await picker.inputValue(), 'Admin', 'Admin is chosen first');
  await app.screenshot('the picker with no projects yet, under the Eggs client');
});

test('axm-85eb1822 the page shows the client list, the project list grouped by client, the default Eggs client, today\'s entries, the day\'s total, the billable amount, and an error message', async (t) => {
  const app = await openApp(t, { path: 'clients.html' });
  await app.page.evaluate(() => localStorage.clear());
  await app.page.reload();

  // The client list and the project list grouped by client.
  await app.page.getByRole('textbox', { name: 'Client name' }).fill('Acme');
  await app.page.getByRole('button', { name: 'Add client' }).click();
  await app.page.getByRole('listitem').filter({ hasText: 'Acme' }).waitFor();
  await app.page.getByRole('textbox', { name: 'Project name' }).fill('Design');
  await app.page.getByRole('spinbutton', { name: 'Hourly rate (£)' }).fill('75');
  await app.page.getByRole('checkbox', { name: 'Billable' }).check();
  await app.page.getByRole('button', { name: 'Add project' }).click();
  const project = app.page.getByRole('listitem').filter({ hasText: 'Design' }).last();
  await project.waitFor();
  assert.ok(await project.getByText('£75.00').isVisible(), 'the project list shows the rate');

  // An error message when an action fails.
  await app.page.getByRole('textbox', { name: 'Client name' }).fill('');
  await app.page.getByRole('button', { name: 'Add client' }).click();
  const error = app.page.getByText('A client name is up to 100 characters.');
  await error.waitFor();
  assert.ok(await error.isVisible(), 'an error message appears when an action fails');
  await app.screenshot('the clients page outputs: client list, project list, and an error message');
});

test('axm-ab50b0c4 the system accepts a client name of up to 100 characters, a project name, a rate, a billable flag, an archive choice, and a project choice', async (t) => {
  const app = await openApp(t, { path: 'clients.html' });
  await app.page.evaluate(() => localStorage.clear());
  await app.page.reload();

  // A client name of up to 100 characters.
  const longName = 'A'.repeat(100);
  await app.page.getByRole('textbox', { name: 'Client name' }).fill(longName);
  await app.page.getByRole('button', { name: 'Add client' }).click();
  await app.page.getByRole('listitem').filter({ hasText: longName }).waitFor();
  assert.ok(true, 'a 100-character client name is accepted');

  // A project name, a rate, and a billable flag.
  await app.page.getByRole('textbox', { name: 'Project name' }).fill('Design');
  await app.page.getByRole('spinbutton', { name: 'Hourly rate (£)' }).fill('75.50');
  await app.page.getByRole('checkbox', { name: 'Billable' }).check();
  await app.page.getByRole('button', { name: 'Add project' }).click();
  const project = app.page.getByRole('listitem').filter({ hasText: 'Design' }).last();
  await project.waitFor();
  assert.ok(await project.getByText('£75.50').isVisible(), 'a rate with pence is accepted and shown');
  assert.ok(await project.getByText('billable', { exact: true }).isVisible(), 'the billable flag is accepted');

  // An archive choice.
  await project.getByRole('button', { name: 'Archive Design' }).click();
  const projects = await app.page.evaluate(() => JSON.parse(localStorage.getItem('eggs.projects')));
  assert.equal(projects[0].archived, true, 'the archive choice is saved');

  // A project choice from the picker.
  const timeApp = await openApp(t, { path: 'time.html' });
  await timeApp.page.evaluate(() => {
    const clients = [{ id: 'c1', name: 'Acme' }];
    const projects = [{ id: 'p1', name: 'Design', clientId: 'c1', rate: 75, billable: true, archived: false }];
    localStorage.setItem('eggs.clients', JSON.stringify(clients));
    localStorage.setItem('eggs.projects', JSON.stringify(projects));
    localStorage.setItem('eggs.entries', '[]');
  });
  await timeApp.page.reload();
  const picker = timeApp.page.getByRole('combobox', { name: 'Project' });
  await picker.waitFor();
  await picker.selectOption('Design');
  assert.equal(await picker.inputValue(), 'Design', 'a project choice from the picker is accepted');
  await app.screenshot('the inputs: client name, project name, rate, billable flag, archive choice, and project choice');
});

test('axm-ab79ff57 a rate shows in pounds with two decimals', async (t) => {
  const app = await openApp(t, { path: 'clients.html' });
  await app.page.evaluate(() => localStorage.clear());
  await app.page.reload();

  await app.page.getByRole('textbox', { name: 'Client name' }).fill('Acme');
  await app.page.getByRole('button', { name: 'Add client' }).click();
  await app.page.getByRole('listitem').filter({ hasText: 'Acme' }).waitFor();

  await app.page.getByRole('textbox', { name: 'Project name' }).fill('Design');
  await app.page.getByRole('spinbutton', { name: 'Hourly rate (£)' }).fill('75');
  await app.page.getByRole('button', { name: 'Add project' }).click();
  const project = app.page.getByRole('listitem').filter({ hasText: 'Design' }).last();
  await project.waitFor();
  assert.ok(await project.getByText('£75.00').isVisible(), 'a rate of 75 shows as £75.00');
  await app.screenshot('a rate shown in pounds with two decimals');
});

test('axm-8a77c0a8 the day\'s total shows the billable amount: billable hours times each project\'s rate', async (t) => {
  const app = await openApp(t, { path: 'time.html' });
  const startedAt = new Date().toISOString();
  await app.page.evaluate((startedAt) => {
    const clients = [{ id: 'c1', name: 'Acme' }];
    const projects = [
      { id: 'p1', name: 'Design', clientId: 'c1', rate: 75, billable: true, archived: false },
      { id: 'p2', name: 'Development', clientId: 'c1', rate: 50, billable: false, archived: false },
    ];
    const entries = [
      { id: 'e1', work: 'Design the logo', project: 'Design', startedAt, running: false, duration: 3600 },
      { id: 'e2', work: 'Write the code', project: 'Development', startedAt, running: false, duration: 3600 },
    ];
    localStorage.setItem('eggs.clients', JSON.stringify(clients));
    localStorage.setItem('eggs.projects', JSON.stringify(projects));
    localStorage.setItem('eggs.entries', JSON.stringify(entries));
  }, startedAt);
  await app.page.reload();

  const total = app.page.getByText('Total');
  await total.waitFor();
  assert.ok(await total.isVisible(), 'the day\'s total appears');
  const billable = app.page.getByText('£75.00');
  await billable.waitFor();
  assert.ok(await billable.isVisible(), 'the billable amount is the billable hours times the billable project\'s rate');
  await app.screenshot('the day\'s total with the billable amount');
});

test('axm-bd0c0c09 each saved client, project or archive saves before returning, archiving hides the project and keeps its entries', async (t) => {
  const app = await openApp(t, { path: 'clients.html' });
  await app.page.evaluate(() => localStorage.clear());
  await app.page.reload();

  // Add a client: the save happens before the action returns.
  await app.page.getByRole('textbox', { name: 'Client name' }).fill('Acme');
  await app.page.getByRole('button', { name: 'Add client' }).click();
  await app.page.getByRole('listitem').filter({ hasText: 'Acme' }).waitFor();
  const savedClients = await app.page.evaluate(() => JSON.parse(localStorage.getItem('eggs.clients')));
  assert.ok(savedClients.some((c) => c.name === 'Acme'), 'the add-client action saved the client before returning');

  // Add a project under the client: the save happens before the action returns.
  await app.page.getByRole('textbox', { name: 'Project name' }).fill('Design');
  await app.page.getByRole('spinbutton', { name: 'Hourly rate (£)' }).fill('75');
  await app.page.getByRole('checkbox', { name: 'Billable' }).check();
  await app.page.getByRole('button', { name: 'Add project' }).click();
  const project = app.page.getByRole('listitem').filter({ hasText: 'Design' }).last();
  await project.waitFor();
  const savedProjects = await app.page.evaluate(() => JSON.parse(localStorage.getItem('eggs.projects')));
  assert.ok(savedProjects.some((p) => p.name === 'Design' && p.rate === 75 && p.billable === true), 'the add-project action saved the project before returning');

  // Archive the project: the save happens before the action returns.
  await project.getByRole('button', { name: 'Archive Design' }).click();
  const archivedProjects = await app.page.evaluate(() => JSON.parse(localStorage.getItem('eggs.projects')));
  assert.equal(archivedProjects.find((p) => p.name === 'Design').archived, true, 'the archive action saved the project before returning');

  // Archiving hides the project from the picker on the time page.
  const timeApp = await openApp(t, { path: 'time.html' });
  await timeApp.page.reload();
  const picker = timeApp.page.getByRole('combobox', { name: 'Project' });
  await picker.waitFor();
  const options = await picker.locator('option').allTextContents();
  assert.ok(!options.includes('Design'), 'the archived project is hidden from the picker');

  // The archived project's entries remain.
  const startedAt = new Date().toISOString();
  await timeApp.page.evaluate((startedAt) => {
    localStorage.setItem('eggs.entries', JSON.stringify([
      { id: 'e1', work: 'Design the logo', project: 'Design', startedAt, running: false, duration: 3600 },
    ]));
  }, startedAt);
  await timeApp.page.reload();
  const entry = timeApp.page.getByRole('listitem').filter({ hasText: 'Design the logo' });
  await entry.waitFor();
  assert.ok(await entry.getByText('1:00').isVisible(), 'the archived project keeps its entries');
  const entries = await timeApp.page.evaluate(() => JSON.parse(localStorage.getItem('eggs.entries')));
  assert.ok(entries.some((e) => e.project === 'Design'), 'the archived project\'s entries remain in storage');

  // A saved entry remains after a reload.
  await timeApp.page.reload();
  const reloaded = timeApp.page.getByRole('listitem').filter({ hasText: 'Design the logo' });
  await reloaded.waitFor();
  assert.ok(await reloaded.getByText('1:00').isVisible(), 'a saved entry remains after a reload');
  await app.screenshot('saved before returning, picker hides archived, entry remains after reload');
});

test('axm-9309af5d each saved client, project, or archive is saved before the action returns, and a saved entry remains after a reload', async (t) => {
  const app = await openApp(t, { path: 'clients.html' });
  await app.page.evaluate(() => localStorage.clear());
  await app.page.reload();

  // Add a client: the save happens before the action returns.
  await app.page.getByRole('textbox', { name: 'Client name' }).fill('Acme');
  await app.page.getByRole('button', { name: 'Add client' }).click();
  await app.page.getByRole('listitem').filter({ hasText: 'Acme' }).waitFor();
  const savedClients = await app.page.evaluate(() => JSON.parse(localStorage.getItem('eggs.clients')));
  assert.ok(savedClients.some((c) => c.name === 'Acme'), 'the add-client action saved the client before returning');

  // Add a project: the save happens before the action returns.
  await app.page.getByRole('textbox', { name: 'Project name' }).fill('Design');
  await app.page.getByRole('spinbutton', { name: 'Hourly rate (£)' }).fill('75');
  await app.page.getByRole('checkbox', { name: 'Billable' }).check();
  await app.page.getByRole('button', { name: 'Add project' }).click();
  const project = app.page.getByRole('listitem').filter({ hasText: 'Design' }).last();
  await project.waitFor();
  const savedProjects = await app.page.evaluate(() => JSON.parse(localStorage.getItem('eggs.projects')));
  assert.ok(savedProjects.some((p) => p.name === 'Design'), 'the add-project action saved the project before returning');

  // Archive the project: the save happens before the action returns.
  await project.getByRole('button', { name: 'Archive Design' }).click();
  const archivedProjects = await app.page.evaluate(() => JSON.parse(localStorage.getItem('eggs.projects')));
  assert.equal(archivedProjects.find((p) => p.name === 'Design').archived, true, 'the archive action saved the project before returning');

  // A saved entry remains after a reload.
  const timeApp = await openApp(t, { path: 'time.html' });
  const startedAt = new Date().toISOString();
  await timeApp.page.evaluate((startedAt) => {
    localStorage.setItem('eggs.entries', JSON.stringify([
      { id: 'e1', work: 'Design the logo', project: 'Design', startedAt, running: false, duration: 3600 },
    ]));
  }, startedAt);
  await timeApp.page.reload();
  const entry = timeApp.page.getByRole('listitem').filter({ hasText: 'Design the logo' });
  await entry.waitFor();
  assert.ok(await entry.getByText('1:00').isVisible(), 'a saved entry remains after a reload');
  await app.screenshot('clients, projects, and archives saved before returning, and an entry remaining after a reload');
});
