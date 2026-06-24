// testamentMode.js
// Lernspiel "AT oder NT?": Zeige eine zufällige Auswahl von Bibelbüchern und
// lasse für jedes zuordnen, ob es zum Alten oder Neuen Testament gehört.
// Start mit 4 Büchern; jede komplett richtige Runde fügt 2 weitere hinzu.
// Ein Fehler beendet die Runde -> zurück auf 4 (Bestwert bleibt erhalten).
import { BIBLE_BOOKS_ORDER, testamentOf } from '../Base/bibleBooks.js';

const START_COUNT = 4;
const STEP = 2;
const MAX_COUNT = BIBLE_BOOKS_ORDER.length;

const el = {
  count: document.getElementById('countValue'),
  best: document.getElementById('bestValue'),
  rows: document.getElementById('rows'),
  status: document.getElementById('status'),
  action: document.getElementById('actionBtn'),
};

// Spielzustand.
let count = START_COUNT;
let best = 0;
let books = []; // aktuelle Auswahl
let answers = {}; // book -> "AT" | "NT"
let locked = false;

function shuffled(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function startRound() {
  books = shuffled(BIBLE_BOOKS_ORDER).slice(0, count);
  answers = {};
  locked = false;
  render();
}

function choose(book, testament) {
  if (locked) return;
  answers = { ...answers, [book]: testament };
  render();
}

function allAnswered() {
  return books.every((book) => answers[book]);
}

function evaluate() {
  if (locked || !allAnswered()) return;
  locked = true;
  const allCorrect = books.every((book) => answers[book] === testamentOf(book));
  if (allCorrect) {
    best = Math.max(best, count);
    if (count < MAX_COUNT) count += STEP;
  }
  render(allCorrect);
}

// --- Rendering --------------------------------------------------------------

function makeChoiceButton(book, testament) {
  const btn = document.createElement('button');
  btn.className = 'tn-choice';
  btn.textContent = testament;
  if (answers[book] === testament) btn.classList.add('selected');
  // Nach der Auswertung die getroffene Wahl grün/rot einfärben.
  if (locked && answers[book] === testament) {
    btn.classList.add(testament === testamentOf(book) ? 'is-correct' : 'is-incorrect');
  }
  btn.addEventListener('click', () => choose(book, testament));
  return btn;
}

function makeRow(book) {
  const row = document.createElement('div');
  row.className = 'tn-row';

  const name = document.createElement('span');
  name.className = 'tn-name';
  name.textContent = book;

  const btns = document.createElement('div');
  btns.className = 'tn-btns';
  btns.append(makeChoiceButton(book, 'AT'), makeChoiceButton(book, 'NT'));

  row.append(name, btns);
  return row;
}

function renderFooter(result) {
  if (result === true) {
    el.status.textContent = `Richtig! Weiter mit ${count} Büchern.`;
    el.status.className = 'bg-status ok';
    el.action.textContent = 'Weiter ▶';
    el.action.classList.remove('hidden');
    el.action.onclick = () => startRound();
    return;
  }

  if (result === false) {
    el.status.textContent = 'Leider falsch – siehe Markierung.';
    el.status.className = 'bg-status fail';
    el.action.textContent = 'Nochmal';
    el.action.classList.remove('hidden');
    el.action.onclick = () => {
      count = START_COUNT;
      startRound();
    };
    return;
  }

  // Runde läuft: "Prüfen" sobald alles beantwortet ist.
  el.status.textContent = '';
  el.status.className = 'bg-status';
  if (allAnswered()) {
    el.action.textContent = 'Prüfen';
    el.action.classList.remove('hidden');
    el.action.onclick = () => evaluate();
  } else {
    el.action.classList.add('hidden');
  }
}

function render(result) {
  el.count.textContent = count;
  el.best.textContent = best > 0 ? best : '–';

  el.rows.innerHTML = '';
  books.forEach((book) => el.rows.appendChild(makeRow(book)));

  renderFooter(result);
}

startRound();
