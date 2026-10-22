// The time page: draws today's entries and the day's total, and listens for a person
// typing what they are working on and starting the timer.
import { PROJECTS } from './projects.mjs';
import { entriesForToday, entryDuration, totalDuration, formatDuration, formatElapsed } from './entries.mjs';
import { loadEntries, saveEntries, makeEntry } from './store.mjs';

const main = document.querySelector('main');
const workInput = main.querySelector('#work');
const projectSelect = main.querySelector('#project');
const startButton = main.querySelector('#start');
const list = main.querySelector('#entry-list');
const total = main.querySelector('#day-total');

// The project list, with Admin first.
for (const project of PROJECTS) {
  const option = document.createElement('option');
  option.value = project;
  option.textContent = project;
  projectSelect.appendChild(option);
}

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
      const work = document.createElement('span');
      work.className = 'entry-work';
      work.textContent = entry.work;
      const project = document.createElement('span');
      project.className = 'entry-project';
      project.textContent = entry.project;
      const duration = document.createElement('span');
      duration.className = 'entry-duration';
      duration.textContent = entry.running
        ? formatElapsed(entryDuration(entry))
        : formatDuration(entryDuration(entry));
      item.append(work, project, duration);
      list.appendChild(item);
    }
  }
  total.textContent = formatDuration(totalDuration(entries));
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

draw();
syncTick();
