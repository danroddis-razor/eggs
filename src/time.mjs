// The time page: draws today's entries and the day's total, and listens for a person
// typing what they are working on and starting the timer, stopping it, picking a project
// for an entry, adding an entry by hand with a duration, editing an entry's work and
// duration, and deleting an entry with an undo.
import { PROJECTS } from './projects.mjs';
import { entriesForToday, entryDuration, totalDuration, formatDuration, formatElapsed, parseDuration, stopEntry, editEntry } from './entries.mjs';
import { loadEntries, saveEntries, makeEntry } from './store.mjs';

const main = document.querySelector('main');
const workInput = main.querySelector('#work');
const projectSelect = main.querySelector('#project');
const startButton = main.querySelector('#start');
const openManualButton = main.querySelector('#open-manual');
const manualForm = main.querySelector('#manual-entry');
const manualWorkInput = main.querySelector('#manual-work');
const manualDurationInput = main.querySelector('#manual-duration');
const addButton = main.querySelector('#add');
const error = main.querySelector('#error');
const list = main.querySelector('#entry-list');
const total = main.querySelector('#day-total');
const status = main.querySelector('#status');

// The entry a person just deleted, kept so an undo can bring it back.
let pendingDelete = null;

// The project list, with Admin first.
for (const project of PROJECTS) {
  const option = document.createElement('option');
  option.value = project;
  option.textContent = project;
  projectSelect.appendChild(option);
}

function projectOptions(selected) {
  return PROJECTS.map((project) => {
    const option = document.createElement('option');
    option.value = project;
    option.textContent = project;
    if (project === selected) option.selected = true;
    return option;
  });
}

// The entry a person is editing, if any.
let editingId = null;

function draw() {
  const entries = loadEntries();
  const todays = entriesForToday(entries);
  list.replaceChildren();
  if (todays.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = 'No time tracked today.';
    list.appendChild(empty);
  } else {
    for (const entry of todays) {
      const item = document.createElement('li');
      item.className = 'entry';
      if (entry.id === editingId) {
        item.append(editForm(entry));
      } else {
        const work = document.createElement('span');
        work.className = 'entry-work';
        work.textContent = entry.work;
        const project = document.createElement('select');
        project.className = 'entry-project';
        project.setAttribute('aria-label', `Project for ${entry.work}`);
        project.append(...projectOptions(entry.project));
        project.addEventListener('change', () => {
          const all = loadEntries();
          const target = all.find((e) => e.id === entry.id);
          if (!target) return;
          target.project = project.value;
          saveEntries(all);
          draw();
        });
        const duration = document.createElement('span');
        duration.className = 'entry-duration';
        duration.textContent = entry.running
          ? formatElapsed(entryDuration(entry))
          : formatDuration(entryDuration(entry));
        item.append(work, project, duration);
        if (entry.running) {
          const stop = document.createElement('button');
          stop.type = 'button';
          stop.className = 'entry-stop';
          stop.textContent = 'Stop';
          stop.setAttribute('aria-label', `Stop ${entry.work}`);
          stop.addEventListener('click', () => {
            const all = loadEntries();
            const index = all.findIndex((e) => e.id === entry.id);
            if (index === -1) return;
            all[index] = stopEntry(all[index]);
            saveEntries(all);
            draw();
            syncTick();
          });
          item.appendChild(stop);
        }
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'entry-edit';
        edit.textContent = 'Edit';
        edit.setAttribute('aria-label', `Edit ${entry.work}`);
        edit.addEventListener('click', () => {
          editingId = entry.id;
          draw();
        });
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'entry-delete';
        del.textContent = 'Delete';
        del.setAttribute('aria-label', `Delete ${entry.work}`);
        del.addEventListener('click', () => deleteEntry(entry));
        item.append(edit, del);
      }
      list.appendChild(item);
    }
  }
  total.textContent = formatDuration(totalDuration(entries));
}

// The inline form a person edits an entry's work and duration with.
function editForm(entry) {
  const form = document.createElement('form');
  form.className = 'entry-edit-form';
  form.addEventListener('submit', (event) => event.preventDefault());

  const workLabel = document.createElement('label');
  workLabel.textContent = 'Work';
  const workInput = document.createElement('input');
  workInput.type = 'text';
  workInput.name = 'work';
  workInput.autocomplete = 'off';
  workInput.value = entry.work;
  workLabel.appendChild(workInput);

  const durationLabel = document.createElement('label');
  durationLabel.textContent = 'Duration';
  const durationInput = document.createElement('input');
  durationInput.type = 'text';
  durationInput.name = 'duration';
  durationInput.autocomplete = 'off';
  durationInput.pattern = '(0:[0-5][1-9]|([1-9]|1[0-9]|2[0-3]):[0-5][0-9]|24:00)';
  durationInput.value = formatDuration(entryDuration(entry));
  durationLabel.appendChild(durationInput);

  const save = document.createElement('button');
  save.type = 'button';
  save.className = 'entry-edit-save';
  save.textContent = 'Save';
  save.addEventListener('click', () => {
    const work = workInput.value.trim();
    const seconds = parseDuration(durationInput.value);
    if (!work || seconds === null) {
      error.textContent = 'Duration must be between 0:01 and 24:00.';
      return;
    }
    error.textContent = '';
    const all = loadEntries();
    const index = all.findIndex((e) => e.id === entry.id);
    if (index === -1) return;
    all[index] = editEntry(all[index], { work, duration: seconds });
    saveEntries(all);
    editingId = null;
    draw();
    syncTick();
  });

  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'entry-edit-cancel';
  cancel.textContent = 'Cancel';
  cancel.addEventListener('click', () => {
    editingId = null;
    draw();
  });

  form.append(workLabel, durationLabel, save, cancel);
  return form;
}

// Deleting an entry removes it and offers an undo that brings it back.
function deleteEntry(entry) {
  const all = loadEntries();
  const index = all.findIndex((e) => e.id === entry.id);
  if (index === -1) return;
  pendingDelete = { entry: all[index], index };
  all.splice(index, 1);
  saveEntries(all);
  status.textContent = `${entry.work} was deleted.`;
  const undo = document.createElement('button');
  undo.type = 'button';
  undo.className = 'undo';
  undo.textContent = 'Undo';
  undo.addEventListener('click', () => {
    if (!pendingDelete) return;
    const entries = loadEntries();
    entries.splice(Math.min(pendingDelete.index, entries.length), 0, pendingDelete.entry);
    saveEntries(entries);
    pendingDelete = null;
    status.replaceChildren();
    draw();
    syncTick();
  });
  status.appendChild(undo);
  draw();
  syncTick();
}

// A running timer updates at least once a second.
let ticking = false;
function syncTick() {
  const hasRunning = entriesForToday(loadEntries()).some((entry) => entry.running);
  if (hasRunning && !ticking) {
    ticking = true;
    setInterval(draw, 1000);
  } else if (!hasRunning && ticking) {
    ticking = false;
  }
}

startButton.addEventListener('click', () => {
  const work = workInput.value.trim();
  if (!work) return;
  const project = projectSelect.value || PROJECTS[0];
  const entry = makeEntry({ work, project, startedAt: new Date().toISOString() });
  const entries = loadEntries();
  entries.push(entry);
  saveEntries(entries);
  workInput.value = '';
  draw();
  syncTick();
});

openManualButton.addEventListener('click', () => {
  manualForm.hidden = false;
  openManualButton.hidden = true;
});

addButton.addEventListener('click', () => {
  const work = manualWorkInput.value.trim();
  const seconds = parseDuration(manualDurationInput.value);
  if (!work || seconds === null) {
    error.textContent = 'Duration must be between 0:01 and 24:00.';
    return;
  }
  error.textContent = '';
  const entry = makeEntry({ work, project: projectSelect.value || PROJECTS[0], startedAt: new Date().toISOString() });
  entry.running = false;
  entry.duration = seconds;
  const entries = loadEntries();
  entries.push(entry);
  saveEntries(entries);
  manualWorkInput.value = '';
  manualDurationInput.value = '';
  draw();
  syncTick();
});

draw();
syncTick();
