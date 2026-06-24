// sortMode.js
// Lernspiel "Bücher sortieren": Zeige eine zufällige Auswahl von Bibelbüchern
// untereinander und lasse sie per Drag & Drop (am Griff ≡) in die richtige
// kanonische Reihenfolge bringen. Gezogen wird über Pointer Events, damit es
// gleichermaßen mit Maus und Touch (Cordova-WebView) funktioniert.
// Start mit 4 Büchern; jede komplett richtige Runde fügt 2 weitere hinzu.
// Ein Fehler beendet die Runde -> zurück auf 4 (Bestwert bleibt erhalten).
import { BIBLE_BOOKS_ORDER } from '../Base/bibleBooks.js';

const START_COUNT = 4;
const STEP = 2;
const MAX_COUNT = BIBLE_BOOKS_ORDER.length;

// Globaler Rang jedes Buchs (kanonische Bibel-Reihenfolge) für das Sortieren.
const orderIndex = new Map(BIBLE_BOOKS_ORDER.map((book, i) => [book, i]));

const el = {
  count: document.getElementById('countValue'),
  best: document.getElementById('bestValue'),
  list: document.getElementById('list'),
  solution: document.getElementById('solution'),
  status: document.getElementById('status'),
  action: document.getElementById('actionBtn'),
};

// Spielzustand.
let count = START_COUNT;
let best = 0;
let target = []; // korrekte Reihenfolge der aktuellen Auswahl
let order = []; // aktuelle Reihenfolge des Nutzers
let locked = false; // nach der Auswertung gesperrt, bis Weiter/Nochmal

// Fisher-Yates, gibt eine neue gemischte Kopie zurück (keine Mutation).
function shuffled(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function startRound() {
  const subset = shuffled(BIBLE_BOOKS_ORDER).slice(0, count);
  target = [...subset].sort((a, b) => orderIndex.get(a) - orderIndex.get(b));
  // Nicht zufällig schon korrekt starten lassen.
  do {
    order = shuffled(subset);
  } while (count > 1 && order.every((b, i) => b === target[i]));
  locked = false;
  render();
}

function evaluate() {
  locked = true;
  const allCorrect = order.every((book, i) => book === target[i]);
  if (allCorrect) {
    best = Math.max(best, count);
    if (count < MAX_COUNT) count += STEP;
  }
  render(allCorrect);
}

// --- Drag & Drop (Pointer Events) ------------------------------------------

let draggedRow = null;
let activePointerId = null;

// Findet die Zeile, vor die der Drag aktuell einsortiert werden soll.
function dragAfterElement(y) {
  const rows = [...el.list.querySelectorAll('.sort-row:not(.dragging)')];
  return rows.reduce(
    (closest, row) => {
      const box = row.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) return { offset, element: row };
      return closest;
    },
    { offset: -Infinity, element: null }
  ).element;
}

// FLIP-Animation: Positionen vor und nach dem Umsortieren messen und die
// verschobenen Zeilen aus ihrer alten Position an die neue gleiten lassen.
function animateReorder(mutate) {
  const rows = [...el.list.querySelectorAll('.sort-row')];
  const firstTop = new Map(rows.map((r) => [r, r.getBoundingClientRect().top]));
  mutate();
  for (const row of rows) {
    if (row === draggedRow) continue; // gezogene Zeile folgt direkt dem Finger
    const delta = firstTop.get(row) - row.getBoundingClientRect().top;
    if (!delta) continue;
    row.style.transition = 'none';
    row.style.transform = `translateY(${delta}px)`;
    requestAnimationFrame(() => {
      row.style.transition = '';
      row.style.transform = '';
    });
  }
}

function onRowDown(event, row) {
  if (locked) return;
  event.preventDefault();
  draggedRow = row;
  activePointerId = event.pointerId;
  row.classList.add('dragging');
  row.setPointerCapture(event.pointerId);
}

function onPointerMove(event) {
  if (!draggedRow) return;
  event.preventDefault();
  const after = dragAfterElement(event.clientY);
  // Schon an dieser Stelle? Dann nicht umsortieren (vermeidet Dauer-Animation).
  if (after === draggedRow || after === draggedRow.nextSibling) return;
  animateReorder(() => {
    if (after == null) el.list.appendChild(draggedRow);
    else el.list.insertBefore(draggedRow, after);
  });
  renumber();
}

function endDrag() {
  if (!draggedRow) return;
  draggedRow.classList.remove('dragging');
  try {
    draggedRow.releasePointerCapture(activePointerId);
  } catch {
    /* Pointer war evtl. schon freigegeben */
  }
  draggedRow = null;
  activePointerId = null;
  // Neue Reihenfolge aus der DOM-Anordnung übernehmen.
  order = [...el.list.querySelectorAll('.sort-row')].map((r) => r.dataset.book);
}

el.list.addEventListener('pointermove', onPointerMove);
el.list.addEventListener('pointerup', endDrag);
el.list.addEventListener('pointercancel', endDrag);

// Positionsnummern an die aktuelle DOM-Reihenfolge anpassen (während des Drags).
function renumber() {
  [...el.list.querySelectorAll('.sort-row')].forEach((row, i) => {
    const num = row.querySelector('.ord-num');
    if (num) num.textContent = i + 1;
  });
}

// --- Rendering --------------------------------------------------------------

function makeRow(book, position, state) {
  const row = document.createElement('div');
  row.className = 'sort-row';
  row.dataset.book = book;
  if (state === true) row.classList.add('is-correct');
  if (state === false) row.classList.add('is-incorrect');

  const num = document.createElement('span');
  num.className = 'ord-num';
  num.textContent = position;

  const name = document.createElement('span');
  name.className = 'sort-name';
  name.textContent = book;

  row.append(num, name);

  // Während des Spiels ist die ganze Zeile greifbar; das ≡ dient als Hinweis.
  if (!locked) {
    const handle = document.createElement('span');
    handle.className = 'drag-handle';
    handle.textContent = '≡';
    row.append(handle);
    row.title = 'Zum Verschieben ziehen';
    row.addEventListener('pointerdown', (e) => onRowDown(e, row));
  }
  return row;
}

function renderFooter(result) {
  if (result === undefined) {
    el.solution.classList.add('hidden');
    el.status.textContent = '';
    el.status.className = 'bg-status';
    el.action.textContent = 'Prüfen';
    el.action.classList.remove('hidden');
    el.action.onclick = () => evaluate();
    return;
  }

  if (result === true) {
    el.solution.classList.add('hidden');
    el.status.textContent = `Richtig! Weiter mit ${count} Büchern.`;
    el.status.className = 'bg-status ok';
    el.action.textContent = 'Weiter ▶';
    el.action.classList.remove('hidden');
    el.action.onclick = () => startRound();
    return;
  }

  // Niederlage: Lösung zeigen und auf den Start zurücksetzen.
  el.status.textContent = 'Leider falsch.';
  el.status.className = 'bg-status fail';
  el.solution.innerHTML =
    '<div class="bg-solution-title">Richtige Reihenfolge:</div>' +
    target.map((b, i) => `${i + 1}. ${b}`).join('<br>');
  el.solution.classList.remove('hidden');
  el.action.textContent = 'Nochmal';
  el.action.classList.remove('hidden');
  el.action.onclick = () => {
    count = START_COUNT;
    startRound();
  };
}

function render(result) {
  el.count.textContent = count;
  el.best.textContent = best > 0 ? best : '–';

  el.list.innerHTML = '';
  order.forEach((book, i) => {
    const state = locked ? book === target[i] : null;
    el.list.appendChild(makeRow(book, i + 1, state));
  });

  renderFooter(result);
}

startRound();
