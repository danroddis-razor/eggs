// The rules of a project, as pure functions over plain objects. No page, no storage.
import { todayKey } from './entries.mjs';

// The short list of projects a person can pick for an entry. Admin comes first.
export const PROJECTS = ['Admin', 'Client work', 'Internal'];

// The default client a person sees when no projects exist yet.
export const DEFAULT_CLIENT = { id: 'eggs', name: 'Eggs' };

// A project name is up to 100 characters.
export const MAX_PROJECT_NAME = 100;

// A new project, ready to be saved.
export function makeProject({ name, clientId, rate, billable }) {
  return {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    name,
    clientId,
    rate,
    billable,
    archived: false,
  };
}

// A project name is valid when it is not empty and is at most 100 characters.
export function isValidProjectName(name) {
  const value = String(name ?? '').trim();
  return value.length > 0 && value.length <= MAX_PROJECT_NAME;
}

// An hourly rate is valid when it is a number of zero or more pounds.
export function isValidRate(rate) {
  const value = Number(rate);
  return Number.isFinite(value) && value >= 0;
}

// Archiving a project hides it from the picker but keeps its entries.
export function archiveProject(project) {
  return { ...project, archived: true };
}

// The projects a person can pick: those not archived.
export function activeProjects(projects) {
  return (projects ?? []).filter((p) => !p.archived);
}

// The projects that belong to a client.
export function projectsForClient(projects, clientId) {
  return (projects ?? []).filter((p) => p.clientId === clientId);
}

// The picker's groups: the active projects grouped by client, in the order the
// clients were added. When no projects exist yet, the default Eggs client offers
// Admin, Client work and Internal, with Admin first. The default projects stay in
// the picker while any entry uses them, so an entry keeps the project it was made
// with.
export function pickerGroups(clients, projects, inUse = []) {
  const active = activeProjects(projects);
  const groups = [];
  for (const client of clients ?? []) {
    const clientProjects = active.filter((p) => p.clientId === client.id);
    if (clientProjects.length > 0) groups.push({ client, projects: clientProjects });
  }
  // The default Eggs client offers Admin, Client work and Internal while no projects
  // exist, and stays in the picker while any entry uses one of them.
  if (active.length === 0 || PROJECTS.some((name) => inUse.includes(name))) {
    groups.push({
      client: DEFAULT_CLIENT,
      projects: PROJECTS.map((name) => ({ id: name, name, clientId: DEFAULT_CLIENT.id, rate: 0, billable: false, archived: false })),
    });
  }
  return groups;
}

// The first project a person can pick: the first listed project of the first group.
export function firstPickerProject(clients, projects, inUse = []) {
  const groups = pickerGroups(clients, projects, inUse);
  const first = groups[0]?.projects[0];
  return first ? first.name : null;
}

// A rate shows in pounds with two decimals, for example £75.00.
export function formatRate(rate) {
  const value = Number(rate);
  const safe = Number.isFinite(value) ? value : 0;
  return `£${safe.toFixed(2)}`;
}

// The billable amount for a day: for each billable project, its hours today times
// its own rate, added together. Entries carry the project's name.
export function billableAmount(entries, projects, date = new Date()) {
  const byName = new Map();
  for (const project of projects ?? []) {
    if (!byName.has(project.name)) byName.set(project.name, project);
  }
  let total = 0;
  for (const entry of entries ?? []) {
    if (entry.running) continue;
    if (entry.startedAt && todayKey(new Date(entry.startedAt)) !== todayKey(date)) continue;
    const project = byName.get(entry.project);
    if (!project || !project.billable) continue;
    const seconds = Math.max(0, Math.floor(entry.duration ?? 0));
    total += (seconds / 3600) * Number(project.rate ?? 0);
  }
  return total;
}
