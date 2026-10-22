// The only module that touches localStorage. It reads and writes entries under one key.
const KEY = 'eggs.entries';

export function loadEntries() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEntries(entries) {
  localStorage.setItem(KEY, JSON.stringify(entries ?? []));
}

// A new entry, ready to be started.
export function makeEntry({ work, project, startedAt }) {
  return {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    work,
    project,
    startedAt,
    running: true,
  };
}
