// The rules of a project, as pure functions over plain objects. No page, no storage.

// The short list of projects a person can pick for an entry. Admin comes first.
export const PROJECTS = ['Admin', 'Client work', 'Internal'];

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
