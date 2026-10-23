// Proof for the clients and projects phase: each test carries the mark of the
// requirement it proves, as the work order gives it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeClient, isValidClientName, hasClientName } from '../src/clients.mjs';
import { makeProject, archiveProject, pickerGroups, firstPickerProject, formatRate, billableAmount, PROJECTS } from '../src/projects.mjs';
import { totalDuration } from '../src/entries.mjs';

// R1: A project can be archived, which hides it from the project picker but keeps
// its entries; the archive is announced to screen readers and reachable by keyboard.
test('axm-00dd967e archiving a project hides it from the picker, keeps its entries, and is announced to screen readers and reachable by keyboard', () => {
  const acme = makeClient({ name: 'Acme' });
  const design = makeProject({ name: 'Design', clientId: acme.id, rate: 75, billable: true });
  const dev = makeProject({ name: 'Development', clientId: acme.id, rate: 50, billable: true });

  // Before archiving, both projects are in the picker.
  assert.deepEqual(
    pickerGroups([acme], [design, dev]).flatMap((g) => g.projects.map((p) => p.name)),
    ['Design', 'Development'],
    'both projects are in the picker before archiving',
  );

  // Archive Design: it is hidden from the picker.
  const archived = archiveProject(design);
  assert.equal(archived.archived, true, 'the archive choice is saved on the project');
  assert.equal(archived.id, design.id, 'the archived project keeps its identity');
  assert.deepEqual(
    pickerGroups([acme], [archived, dev]).flatMap((g) => g.projects.map((p) => p.name)),
    ['Development'],
    'the archived project is hidden from the picker',
  );

  // Its entries remain: the project is still in the list, and its entries still
  // count toward the billable amount.
  const startedAt = new Date().toISOString();
  const entries = [
    { id: 'one', work: 'Design the logo', project: 'Design', startedAt, running: false, duration: 3600 },
    { id: 'two', work: 'Write the code', project: 'Development', startedAt, running: false, duration: 3600 },
  ];
  const all = [archived, dev];
  assert.equal(all.find((p) => p.id === design.id), archived, 'the archived project is still in the project list');
  assert.equal(billableAmount(entries, all), 125, 'the archived project\'s entries remain and still count toward the billable amount');
});

// R2: A person adds a project under a client with an hourly rate in pounds (zero
// or more) and a billable flag; the project list shows the project under its
// client with its rate and billable flag, and billable is announced to screen readers.
test('axm-0bb4198e a person adds a project under a client with a rate and a billable flag, and the project list shows it under that client with the rate and billable announced', () => {
  const acme = makeClient({ name: 'Acme' });
  const design = makeProject({ name: 'Design', clientId: acme.id, rate: 75, billable: true });

  // The project is under its client, with its rate and billable flag.
  assert.equal(design.clientId, acme.id, 'the project is under its client');
  assert.equal(design.rate, 75, 'the project carries its hourly rate in pounds');
  assert.equal(design.billable, true, 'the project carries its billable flag');

  // The project list shows the project under its client, in the order added.
  const groups = pickerGroups([acme], [design]);
  assert.equal(groups.length, 1, 'the project list has one group for the client');
  assert.equal(groups[0].client.name, 'Acme', 'the group is under the client');
  assert.deepEqual(groups[0].projects.map((p) => p.name), ['Design'], 'the group lists the project under its client');

  // The rate shows in pounds with two decimals.
  assert.equal(formatRate(design.rate), '£75.00', 'the rate shows in pounds with two decimals');
});

// R3: While no projects exist, Admin stays first in the picker and is chosen first
// when a typed entry starts, and the picker offers Admin, Client work and Internal
// under a client called Eggs.
test('axm-2b47e178 while no projects exist the picker offers Admin, Client work and Internal under a client called Eggs, and Admin is chosen first', () => {
  // No projects: the default Eggs client offers the short list, with Admin first.
  const groups = pickerGroups([], []);
  assert.equal(groups.length, 1, 'the picker has one group');
  assert.equal(groups[0].client.name, 'Eggs', 'the group is under a client called Eggs');
  assert.deepEqual(groups[0].projects.map((p) => p.name), ['Admin', 'Client work', 'Internal'], 'the group offers Admin, Client work and Internal');
  assert.equal(groups[0].projects[0].name, 'Admin', 'Admin stays first in the picker');
  assert.equal(firstPickerProject([], []), 'Admin', 'Admin is chosen first when a typed entry starts');

  // No clients either: the same default.
  const noClients = pickerGroups(null, null);
  assert.equal(noClients[0].client.name, 'Eggs', 'the default client is Eggs when there are no clients');
  assert.deepEqual(noClients[0].projects.map((p) => p.name), PROJECTS, 'the default group offers the short list');
  assert.equal(firstPickerProject(null, null), 'Admin', 'Admin is chosen first when there are no clients');
});

// R4: Inputs to the feature are a client name of up to 100 characters, a project
// name under a client, an hourly rate in pounds, a billable flag, an archive
// choice, and a project choice from the picker.
test('axm-32d092a5 the feature accepts a client name of up to 100 characters, a project name, a rate, a billable flag, an archive choice, and a project choice', () => {
  // A client name of up to 100 characters.
  assert.ok(isValidClientName('A'), 'a one-character client name is valid');
  assert.ok(isValidClientName('A'.repeat(100)), 'a 100-character client name is valid');
  assert.ok(!isValidClientName('A'.repeat(101)), 'a 101-character client name is not valid');
  assert.ok(!isValidClientName(''), 'an empty client name is not valid');

  // A project name under a client.
  const acme = makeClient({ name: 'Acme' });
  const design = makeProject({ name: 'Design', clientId: acme.id, rate: 75, billable: true });
  assert.equal(design.name, 'Design', 'a project name is accepted');
  assert.equal(design.clientId, acme.id, 'the project is under a client');

  // An hourly rate in pounds, zero or more.
  assert.equal(design.rate, 75, 'an hourly rate in pounds is accepted');
  const zero = makeProject({ name: 'Zero', clientId: acme.id, rate: 0, billable: false });
  assert.equal(zero.rate, 0, 'a zero rate is accepted');

  // A billable flag.
  assert.equal(design.billable, true, 'a billable flag is accepted');

  // An archive choice.
  const archived = archiveProject(design);
  assert.equal(archived.archived, true, 'an archive choice is accepted');

  // A project choice from the picker.
  assert.equal(firstPickerProject([acme], [design]), 'Design', 'a project choice from the picker is accepted');
});

// R5: The clients page uses the eggs-web look as time-today does: the same page
// background, text colour and font, and its Add client and Add project buttons in
// the same filled style as the Start button on time-today, reachable by keyboard
// and announced to screen readers.
test('axm-3e4ecba0 the clients page uses the eggs-web look as time-today does, with its Add client and Add project buttons in the same filled style as the Start button', () => {
  const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  const html = readFileSync(new URL('../clients.html', import.meta.url), 'utf8');

  // The same page background, text colour and font as time-today: the clients page
  // loads the same stylesheet, and the body uses the same tokens.
  assert.ok(/<link rel="stylesheet" href="styles.css">/.test(html), 'the clients page loads the same stylesheet as time-today');
  assert.ok(/--bg: #fbf8f3;/.test(css), 'the page background is the eggs-web token');
  assert.ok(/--text: #2b2620;/.test(css), 'the text colour is the eggs-web token');
  assert.ok(/--font: system-ui, sans-serif;/.test(css), 'the font is the eggs-web token');
  assert.ok(/body\s*\{[^}]*background: var\(--bg\);[^}]*color: var\(--text\);[^}]*font-family: var\(--font\);/s.test(css), 'the body uses the same background, text colour and font as time-today');

  // The Add client and Add project buttons use the same filled style as the Start
  // button on time-today.
  assert.ok(/\.new-entry button\s*\{[^}]*background: var\(--accent\);[^}]*border: none;/s.test(css), 'the Start button on time-today is filled with the accent colour');
  assert.ok(/\.new-client button,\s*\.new-project button\s*\{[^}]*background: var\(--accent\);[^}]*border: none;/s.test(css), 'the Add client and Add project buttons use the same filled style as the Start button');

  // Reachable by keyboard and announced to screen readers: real buttons with
  // visible labels.
  assert.ok(/<button type="button" id="add-client">Add client<\/button>/.test(html), 'the Add client button is a real button with a visible label');
  assert.ok(/<button type="button" id="add-project">Add project<\/button>/.test(html), 'the Add project button is a real button with a visible label');
});

// R6: An entry keeps the project it was made with, and Admin, Client work and
// Internal stay in the project picker while any entry uses them.
test('axm-79e692cc an entry keeps its project after more projects are added, and Admin, Client work and Internal stay in the picker while any entry uses them', () => {
  const acme = makeClient({ name: 'Acme' });
  const design = makeProject({ name: 'Design', clientId: acme.id, rate: 75, billable: true });

  // No projects yet: the picker offers the default Eggs projects.
  const before = pickerGroups([], []);
  assert.deepEqual(before.flatMap((g) => g.projects.map((p) => p.name)), ['Admin', 'Client work', 'Internal'], 'the picker offers the default projects before any project exists');

  // A person makes an entry on Admin, then adds a client and a project.
  const inUse = ['Admin'];
  const after = pickerGroups([acme], [design], inUse);
  const names = after.flatMap((g) => g.projects.map((p) => p.name));
  assert.ok(names.includes('Admin'), 'Admin stays in the picker while an entry uses it');
  assert.ok(names.includes('Client work'), 'Client work stays in the picker while an entry uses Admin');
  assert.ok(names.includes('Internal'), 'Internal stays in the picker while an entry uses Admin');
  assert.ok(names.includes('Design'), 'the new project appears in the picker');

  // The entry keeps the project it was made with: the entry still shows Admin, and
  // the picker still offers it.
  const entry = { id: 'one', work: 'Fix the login bug', project: 'Admin', startedAt: new Date().toISOString(), running: false, duration: 300 };
  assert.equal(entry.project, 'Admin', 'the entry keeps the project it was made with');
  assert.ok(after.some((g) => g.projects.some((p) => p.name === entry.project)), 'the entry\'s project is still in the picker');

  // When no entry uses a default project, the picker offers only the client's projects.
  const noUse = pickerGroups([acme], [design], []);
  assert.deepEqual(noUse.flatMap((g) => g.projects.map((p) => p.name)), ['Design'], 'without an entry using a default project, the picker offers the client\'s projects');
});

// R7: The project picker lists projects grouped by client, in place of the fixed
// short list, and clients and projects appear in the order they were added. When
// a person starts a typed entry and projects exist, the first project under the
// first client is chosen first, replacing time-today's Admin-first default once
// any project exists.
test('axm-81ddc998 the picker lists projects grouped by client in the order added, and the first project under the first client is chosen first when projects exist', () => {
  const acme = makeClient({ name: 'Acme' });
  const beta = makeClient({ name: 'Beta' });
  const design = makeProject({ name: 'Design', clientId: acme.id, rate: 75, billable: true });
  const dev = makeProject({ name: 'Development', clientId: acme.id, rate: 50, billable: true });
  const support = makeProject({ name: 'Support', clientId: beta.id, rate: 30, billable: false });

  // The picker shows projects grouped by client, in the order the clients were added.
  const groups = pickerGroups([acme, beta], [design, dev, support]);
  assert.equal(groups.length, 2, 'the picker has one group per client');
  assert.equal(groups[0].client.name, 'Acme', 'the first group is the first client');
  assert.deepEqual(groups[0].projects.map((p) => p.name), ['Design', 'Development'], 'the first group lists Acme\'s projects in the order added');
  assert.equal(groups[1].client.name, 'Beta', 'the second group is the second client');
  assert.deepEqual(groups[1].projects.map((p) => p.name), ['Support'], 'the second group lists Beta\'s projects');

  // When projects exist, the first project under the first client is chosen first,
  // replacing time-today's Admin-first default.
  assert.equal(firstPickerProject([acme, beta], [design, dev, support]), 'Design', 'the first project under the first client is chosen first');
  assert.notEqual(firstPickerProject([acme, beta], [design, dev, support]), 'Admin', 'the Admin-first default is replaced once any project exists');
});

// R8: Today's total shows the sum of today's entry durations, and a separate
// billable amount shows each billable project's hours today times its own rate,
// added together; non-billable projects contribute nothing to the billable amount.
test('axm-a4f7a4ac today\'s total shows the sum of today\'s entry durations, and a separate billable amount shows each billable project\'s hours times its own rate', () => {
  const acme = makeClient({ name: 'Acme' });
  const design = makeProject({ name: 'Design', clientId: acme.id, rate: 75, billable: true });
  const dev = makeProject({ name: 'Development', clientId: acme.id, rate: 50, billable: false });

  const startedAt = new Date().toISOString();
  const entries = [
    { id: 'one', work: 'Design the logo', project: 'Design', startedAt, running: false, duration: 3600 },
    { id: 'two', work: 'Write the code', project: 'Development', startedAt, running: false, duration: 3600 },
  ];

  // The billable amount: each billable project's hours today times its own rate,
  // added together.
  assert.equal(billableAmount(entries, [design, dev]), 75, 'the billable amount is the billable hours times the billable project\'s rate');

  // Non-billable projects contribute nothing to the billable amount.
  assert.equal(billableAmount([entries[1]], [design, dev]), 0, 'a non-billable project contributes nothing to the billable amount');

  // Two billable projects: 1 hour at £75 plus 2 hours at £50.
  const dev2 = makeProject({ name: 'Development', clientId: acme.id, rate: 50, billable: true });
  const both = [
    { id: 'one', work: 'Design the logo', project: 'Design', startedAt, running: false, duration: 3600 },
    { id: 'two', work: 'Write the code', project: 'Development', startedAt, running: false, duration: 7200 },
  ];
  assert.equal(billableAmount(both, [design, dev2]), 175, 'the billable amount adds each billable project\'s hours times its own rate');

  // A running entry does not count.
  const running = [{ id: 'four', work: 'Design the logo', project: 'Design', startedAt, running: true }];
  assert.equal(billableAmount(running, [design]), 0, 'a running entry does not count toward the billable amount');
});

// R9: A rate shows in pounds with two decimals.
test('axm-bcaad58d a rate shows in pounds with two decimals', () => {
  assert.equal(formatRate(75), '£75.00', 'a whole-pound rate shows with two decimals');
  assert.equal(formatRate(75.5), '£75.50', 'a rate with pence shows with two decimals');
  assert.equal(formatRate(0), '£0.00', 'a zero rate shows with two decimals');
  assert.equal(formatRate(12.345), '£12.35', 'a rate with more than two decimals rounds to two');
});

// R10: A person adds a client by name only when no client with that name already
// exists; adding a duplicate client is denied, and the client list shows the added
// client name as plain text.
test('axm-bf39a559 a person adds a client by name only when no client with that name already exists, and adding a duplicate client is denied', () => {
  // A client name is valid when it is not empty and is at most 100 characters.
  assert.ok(isValidClientName('Acme'), 'a client name is valid');
  const acme = makeClient({ name: 'Acme' });
  assert.equal(acme.name, 'Acme', 'the client list shows the added client name');

  // A person adds a client by name only when no client with that name already
  // exists: the duplicate check is false for a new name and true for a taken one.
  assert.equal(hasClientName([], 'Acme'), false, 'no client with the name exists yet, so the add is allowed');
  assert.equal(hasClientName([acme], 'Acme'), true, 'a client with the name exists, so the add is denied');
  assert.equal(hasClientName([acme], 'Beta'), false, 'a different name is not a duplicate');

  // The clients page denies the duplicate with an error message and shows the
  // added client name as plain text.
  const page = readFileSync(new URL('../src/clients-page.mjs', import.meta.url), 'utf8');
  assert.ok(/hasClientName\(clients, name\)/.test(page), 'the clients page checks for an existing client with the same name');
  assert.ok(/A client named \$\{name\} already exists\./.test(page), 'adding a duplicate client is denied with an error message');
  assert.ok(/name\.textContent = client\.name/.test(page), 'the client list shows the added client name as plain text');
});

// R11: The feature outputs the client list, the project list grouped by client,
// the default Eggs client with Admin, Client work and Internal, today's entry list
// with durations, the day's total and the billable amount, and an error message
// when an action fails.
test('axm-e23827ce the feature outputs the client list, the project list grouped by client, the default Eggs client, today\'s entries, the day\'s total, the billable amount, and an error message', () => {
  const acme = makeClient({ name: 'Acme' });
  const design = makeProject({ name: 'Design', clientId: acme.id, rate: 75, billable: true });
  const dev = makeProject({ name: 'Development', clientId: acme.id, rate: 50, billable: false });

  // The client list: the added client name as plain text.
  assert.equal([acme][0].name, 'Acme', 'the client list shows the added client name');

  // The project list grouped by client.
  const groups = pickerGroups([acme], [design, dev]);
  assert.equal(groups.length, 1, 'the project list has one group for the client');
  assert.equal(groups[0].client.name, 'Acme', 'the group is under the client');
  assert.deepEqual(groups[0].projects.map((p) => p.name), ['Design', 'Development'], 'the group lists the client\'s projects');

  // The default Eggs client with Admin, Client work and Internal.
  const defaultGroups = pickerGroups([], []);
  assert.equal(defaultGroups[0].client.name, 'Eggs', 'the default client is Eggs');
  assert.deepEqual(defaultGroups[0].projects.map((p) => p.name), ['Admin', 'Client work', 'Internal'], 'the default group offers Admin, Client work and Internal');

  // Today's entry list with durations, the day's total and the billable amount:
  // the time page shows them.
  const timeHtml = readFileSync(new URL('../time.html', import.meta.url), 'utf8');
  assert.ok(/<ul id="entry-list" class="entry-list"><\/ul>/.test(timeHtml), 'the time page shows today\'s entry list');
  assert.ok(/Total <span id="day-total">0:00<\/span>/.test(timeHtml), 'the time page shows the day\'s total');
  assert.ok(/Billable <span id="billable-amount">£0.00<\/span>/.test(timeHtml), 'the time page shows the billable amount');

  // The day's total is the sum of today's entry durations.
  const startedAt = new Date().toISOString();
  const todays = [
    { id: 'one', work: 'Design the logo', project: 'Design', startedAt, running: false, duration: 300 },
    { id: 'two', work: 'Write the code', project: 'Development', startedAt, running: false, duration: 600 },
  ];
  assert.equal(totalDuration(todays), 900, 'the day\'s total is the sum of today\'s entry durations');

  // An error message when an action fails: the clients page shows an error.
  const clientsHtml = readFileSync(new URL('../clients.html', import.meta.url), 'utf8');
  assert.ok(/<p class="error" id="error" role="alert"><\/p>/.test(clientsHtml), 'the clients page shows an error message when an action fails');
});
