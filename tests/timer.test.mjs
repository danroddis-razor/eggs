// The rules of the egg timer, proven without a page: the doneness durations, the countdown
// display, the one-second step, and the ready check.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DONENESS, durationFor, formatRemaining, tick, isReady } from '../src/timer.mjs';

test('axm-225a62f1 the timer takes a doneness and a start and yields a countdown and a ready message with no state mutations', () => {
  // Inputs: a doneness selection and a press of Start. Outputs: a countdown of remaining
  // time in minutes and seconds, and a ready message when the countdown ends.
  const doneness = 'soft';
  const started = durationFor(doneness);
  assert.equal(started, 360);
  assert.equal(formatRemaining(started), '6 minutes 00 seconds');
  // Run the countdown to zero, one second at a time.
  let remaining = started;
  while (!isReady(remaining)) remaining = tick(remaining);
  assert.equal(remaining, 0);
  assert.equal(isReady(remaining), true);
  // No state mutations: the module's own data is untouched by the run.
  assert.equal(DONENESS.soft, 360);
  assert.equal(durationFor(doneness), 360);
});

test('axm-2911106c the countdown shows the remaining time in minutes and seconds and decreases by one second each second', () => {
  assert.equal(formatRemaining(360), '6 minutes 00 seconds');
  assert.equal(formatRemaining(tick(360)), '5 minutes 59 seconds');
  assert.equal(tick(360), 359);
});

test('axm-383f63f1 the countdown for hard boiled lasts 12 minutes, starting at 12 minutes 00 seconds', () => {
  assert.equal(durationFor('hard'), 720);
  assert.equal(formatRemaining(durationFor('hard')), '12 minutes 00 seconds');
});

test('axm-46ed2f19 the countdown for medium boiled lasts 9 minutes, starting at 9 minutes 00 seconds', () => {
  assert.equal(durationFor('medium'), 540);
  assert.equal(formatRemaining(durationFor('medium')), '9 minutes 00 seconds');
});

test('axm-732d1902 the countdown for soft boiled lasts 6 minutes, starting at 6 minutes 00 seconds', () => {
  assert.equal(durationFor('soft'), 360);
  assert.equal(formatRemaining(durationFor('soft')), '6 minutes 00 seconds');
});
