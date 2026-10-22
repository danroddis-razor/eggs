// The rules of a client, as pure functions over plain objects. No page, no storage.

// A new client, ready to be saved.
export function makeClient({ name }) {
  return {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    name,
  };
}

// Attach each client's projects to the client object.
export function clientsWithProjects(clients, projects) {
  return (clients ?? []).map((client) => ({
    ...client,
    projects: (projects ?? []).filter((p) => p.clientId === client.id),
  }));
}
