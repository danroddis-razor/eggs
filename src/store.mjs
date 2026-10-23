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

// Projects and clients, one key per record kind.
const PROJECTS_KEY = 'eggs.projects';
const CLIENTS_KEY = 'eggs.clients';

export function loadProjects() {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects ?? []));
}

export function loadClients() {
  try {
    const raw = localStorage.getItem(CLIENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveClients(clients) {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients ?? []));
}
