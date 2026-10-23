// The rules of the egg timer, as pure functions over plain values.
// No DOM, no storage, no state: every function takes its inputs and returns its result.

export const DONENESS = {
  soft: 6 * 60,
  medium: 9 * 60,
  hard: 12 * 60,
};

export function durationFor(doneness) {
  return DONENESS[doneness];
}

export function formatRemaining(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const minuteWord = minutes === 1 ? 'minute' : 'minutes';
  const secondWord = seconds === 1 ? 'second' : 'seconds';
  return `${minutes} ${minuteWord} ${String(seconds).padStart(2, '0')} ${secondWord}`;
}

export function tick(remainingSeconds) {
  return Math.max(0, remainingSeconds - 1);
}

export function isReady(remainingSeconds) {
  return remainingSeconds === 0;
}
