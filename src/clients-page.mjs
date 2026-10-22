// The clients page: a person adds a client by name, adds a project under a client
// with an hourly rate in pounds and a billable flag, and archives a project to hide
// it from the picker. The client list shows each client's projects with their rate
// and billable flag.
import { makeClient, isValidClientName, clientsWithProjects } from './clients.mjs';
import { makeProject, isValidProjectName, isValidRate, archiveProject, formatRate } from './projects.mjs';
import { loadClients, saveClients, loadProjects, saveProjects } from './store.mjs';

const main = document.querySelector('main');
const clientForm = main.querySelector('#new-client');
const clientNameInput = main.querySelector('#client-name');
const addClientButton = main.querySelector('#add-client');
const projectForm = main.querySelector('#new-project');
const projectClientSelect = main.querySelector('#project-client');
const projectNameInput = main.querySelector('#project-name');
const projectRateInput = main.querySelector('#project-rate');
const projectBillableInput = main.querySelector('#project-billable');
const addProjectButton = main.querySelector('#add-project');
const error = main.querySelector('#error');
const clientList = main.querySelector('#client-list');
const status = main.querySelector('#status');

// Save the clients and projects and, when the save fails, show an error message.
// Returns true when the save succeeded, so the caller can keep the page in its
// last saved state.
function persist(clients, projects) {
  try {
    saveClients(clients);
    saveProjects(projects);
    return true;
  } catch {
    error.textContent = 'Could not save. Your change was not saved.';
    return false;
  }
}

// The client list: each client's name as plain text, with its projects beneath.
function draw() {
  const clients = loadClients();
  const projects = loadProjects();
  clientList.replaceChildren();
  if (clients.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = 'No clients yet.';
    clientList.appendChild(empty);
  } else {
    for (const client of clientsWithProjects(clients, projects)) {
      const item = document.createElement('li');
      item.className = 'client';
      const name = document.createElement('span');
      name.className = 'client-name';
      name.textContent = client.name;
      item.appendChild(name);
      if (client.projects.length > 0) {
        const projectList = document.createElement('ul');
        projectList.className = 'project-list';
        for (const project of client.projects) {
          const projectItem = document.createElement('li');
          projectItem.className = 'project';
          const projectName = document.createElement('span');
          projectName.className = 'project-name';
          projectName.textContent = project.name;
          const rate = document.createElement('span');
          rate.className = 'project-rate';
          rate.textContent = formatRate(project.rate);
          projectItem.append(projectName, rate);
          if (project.billable) {
            const billable = document.createElement('span');
            billable.className = 'project-billable';
            billable.textContent = 'billable';
            billable.setAttribute('aria-label', 'billable');
            projectItem.appendChild(billable);
          }
          const archive = document.createElement('button');
          archive.type = 'button';
          archive.className = 'project-archive';
          archive.textContent = 'Archive';
          archive.setAttribute('aria-label', `Archive ${project.name}`);
          archive.addEventListener('click', () => archiveProjectAction(project.id));
          projectItem.appendChild(archive);
          projectList.appendChild(projectItem);
        }
        item.appendChild(projectList);
      }
      clientList.appendChild(item);
    }
  }
  // The project form's client select: the saved clients, in the order they were added.
  projectClientSelect.replaceChildren();
  if (clients.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Add a client first';
    option.disabled = true;
    projectClientSelect.appendChild(option);
  } else {
    for (const client of clients) {
      const option = document.createElement('option');
      option.value = client.id;
      option.textContent = client.name;
      projectClientSelect.appendChild(option);
    }
  }
}

// Adding a client by name: the client list shows the added client name as plain text.
addClientButton.addEventListener('click', () => {
  const name = clientNameInput.value.trim();
  if (!isValidClientName(name)) {
    error.textContent = 'A client name is up to 100 characters.';
    return;
  }
  error.textContent = '';
  const clients = loadClients();
  clients.push(makeClient({ name }));
  if (!persist(clients, loadProjects())) return;
  clientNameInput.value = '';
  status.textContent = `${name} was added.`;
  draw();
});

// Adding a project under a client with an hourly rate in pounds and a billable flag.
addProjectButton.addEventListener('click', () => {
  const clientId = projectClientSelect.value;
  const name = projectNameInput.value.trim();
  const rate = Number(projectRateInput.value);
  const billable = projectBillableInput.checked;
  if (!clientId) {
    error.textContent = 'Add a client first.';
    return;
  }
  if (!isValidProjectName(name)) {
    error.textContent = 'A project name is up to 100 characters.';
    return;
  }
  if (!isValidRate(rate)) {
    error.textContent = 'An hourly rate is a number of zero or more pounds.';
    return;
  }
  error.textContent = '';
  const projects = loadProjects();
  projects.push(makeProject({ name, clientId, rate, billable }));
  if (!persist(loadClients(), projects)) return;
  projectNameInput.value = '';
  projectRateInput.value = '0';
  projectBillableInput.checked = false;
  status.textContent = `${name} was added.`;
  draw();
});

// Archiving a project hides it from the picker but keeps its entries.
function archiveProjectAction(projectId) {
  const projects = loadProjects();
  const index = projects.findIndex((p) => p.id === projectId);
  if (index === -1) return;
  projects[index] = archiveProject(projects[index]);
  if (!persist(loadClients(), projects)) return;
  status.textContent = `${projects[index].name} was archived.`;
  draw();
}

draw();
