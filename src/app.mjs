// Draws the egg timer page and listens for what a person does.
import { durationFor, formatRemaining, tick, isReady } from './timer.mjs';

const countdown = document.getElementById('countdown');
const ready = document.getElementById('ready');
const start = document.getElementById('start');

let interval = null;

function render(remainingSeconds) {
  countdown.textContent = formatRemaining(remainingSeconds);
  ready.hidden = !isReady(remainingSeconds);
}

function stop() {
  if (interval !== null) {
    clearInterval(interval);
    interval = null;
  }
}

function begin(doneness) {
  stop();
  let remaining = durationFor(doneness);
  render(remaining);
  interval = setInterval(() => {
    remaining = tick(remaining);
    render(remaining);
    if (isReady(remaining)) stop();
  }, 1000);
}

start.addEventListener('click', () => {
  const doneness = document.querySelector('input[name="doneness"]:checked').value;
  begin(doneness);
});
