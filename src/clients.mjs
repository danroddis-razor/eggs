// The rules of a client, as pure functions over plain objects. No page, no storage.

// A client name is up to 100 characters.
export const MAX_CLIENT_NAME = 100;

// A new client, ready to be saved.
export function makeClient({ name }) {
  return {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    name,
  };
}

// A client name is valid when it is not empty and is at most 100 characters.
export function isValidClientName(name) {
  const value = String(name ?? '').trim();
  return value.length > 0 && value.length <= MAX_CLIENT_NAME;
}

// A client name is already taken when a client with that name exists.
export function hasClientName(clients, name) {
  return (clients ?? []).some((client) => client.name === name);
}

// Attach each client's projects to the client object.
export function clientsWithProjects(clients, projects) {
  return (clients ?? []).map((client) => ({
    ...client,
    projects: (projects ?? []).filter((p) => p.clientId === client.id),
  }));
}
