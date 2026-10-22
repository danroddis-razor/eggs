// The rules of a time entry, as pure functions over plain objects. No page, no storage.

// A day key in the person's own locale, e.g. "2025-01-07".
export function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// An entry belongs to a day when its startedAt falls on that day.
export function isToday(entry, date = new Date()) {
  if (!entry || !entry.startedAt) return false;
  return todayKey(new Date(entry.startedAt)) === todayKey(date);
}

// The entries that belong to a day, in the order they were started.
export function entriesForToday(entries, date = new Date()) {
  return (entries ?? []).filter((entry) => isToday(entry, date));
}

// How long an entry ran, in whole seconds. A running entry counts from its start.
export function entryDuration(entry, now = new Date()) {
  if (!entry) return 0;
  if (entry.running) {
    return Math.max(0, Math.floor((now.getTime() - new Date(entry.startedAt).getTime()) / 1000));
  }
  return Math.max(0, Math.floor(entry.duration ?? 0));
}

// The day's total, in whole seconds: the sum of the entries' durations.
export function totalDuration(entries, date = new Date(), now = new Date()) {
  return entriesForToday(entries, date).reduce((sum, entry) => sum + entryDuration(entry, now), 0);
}

// Durations show as h:mm, for example 1:05.
export function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}

// A running timer shows its elapsed time with seconds, h:mm:ss, so it updates at least once a second.
export function formatElapsed(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
