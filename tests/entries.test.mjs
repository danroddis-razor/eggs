// The rules of a time entry: durations, the manual duration's bounds, and stopping a timer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  entryDuration,
  formatDuration,
  parseDuration,
  clampDuration,
  stopEntry,
  editEntry,
} from '../src/entries.mjs';

test('stopping a running timer records the elapsed time and the timer no longer runs', (t) => {
  const startedAt = new Date('2025-01-07T10:00:00.000Z');
  const stoppedAt = new Date('2025-01-07T10:05:30.000Z');
  const entry = { id: 'one', work: 'Fix the login bug', project: 'Admin', startedAt: startedAt.toISOString(), running: true };

  const stopped = stopEntry(entry, stoppedAt);

  assert.equal(stopped.running, false, 'the timer no longer runs');
  assert.equal(stopped.duration, 330, 'the entry records the elapsed time between starting and stopping');
  assert.equal(entryDuration(stopped), 330, 'the entry shows a duration equal to the elapsed time');
});

test('editing an entry changes its work and duration and keeps its identity, project and start', (t) => {
  const entry = { id: 'one', work: 'Write the spec', project: 'Admin', startedAt: '2025-01-07T10:00:00.000Z', running: false, duration: 300 };
  const edited = editEntry(entry, { work: '<b>Fix the login bug</b>', duration: 3900 });
  assert.equal(edited.id, 'one', 'the entry keeps its identity');
  assert.equal(edited.project, 'Admin', 'the entry keeps its project');
  assert.equal(edited.startedAt, '2025-01-07T10:00:00.000Z', 'the entry keeps its start');
  assert.equal(edited.work, '<b>Fix the login bug</b>', 'the entry carries the edited work');
  assert.equal(edited.duration, 3900, 'the entry carries the edited duration');
  assert.equal(entry.work, 'Write the spec', 'the original entry is not changed');
});

test('a manual entry carries the duration a person typed', (t) => {
  const entry = { id: 'two', work: 'Write the spec', project: 'Internal', startedAt: new Date().toISOString(), running: false, duration: 125 };
  assert.equal(entryDuration(entry), 125, 'the entry shows the duration it was added with');
  assert.equal(formatDuration(entryDuration(entry)), '0:02', 'the duration shows as h:mm');
});

test('a manual duration is constrained to a value from 0:01 to 24:00', (t) => {
  assert.equal(parseDuration('0:01'), 60, '0:01 parses to 60 seconds');
  assert.equal(parseDuration('1:05'), 3900, '1:05 parses to 3900 seconds');
  assert.equal(parseDuration('24:00'), 86400, '24:00 parses to 86400 seconds');
  assert.equal(parseDuration('0:00'), null, '0:00 is below the minimum and does not parse');
  assert.equal(parseDuration('24:01'), null, '24:01 is above the maximum and does not parse');
  assert.equal(parseDuration(''), null, 'an empty value does not parse');
  assert.equal(parseDuration('abc'), null, 'a non-duration value does not parse');
  assert.equal(clampDuration(0), 60, 'a duration below the minimum clamps to 0:01');
  assert.equal(clampDuration(86401), 86400, 'a duration above the maximum clamps to 24:00');
  assert.equal(clampDuration(3900), 3900, 'a duration inside the bounds is kept');
});
