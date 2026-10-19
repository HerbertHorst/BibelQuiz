// sortMode.js
// Lernspiel "Bücher sortieren": Zeige eine zufällige Auswahl von Bibelbüchern
// untereinander und lasse sie per Drag & Drop (am Griff ≡) in die richtige
// kanonische Reihenfolge bringen. Gezogen wird über Pointer Events, damit es
// gleichermaßen mit Maus und Touch (Cordova-WebView) funktioniert.
// Start mit 4 Büchern; jede komplett richtige Runde fügt 2 weitere hinzu.
// Ein Fehler beendet die Runde -> zurück auf 4 (Bestwert bleibt erhalten).
import {
  BIBLE_BOOKS_ORDER,
  BIBLE_BOOKS_ORDER_LUTHER,
} from '../Base/bibleBooks.js';

const START_COUNT = 4;
const STEP = 2;
const MAX_COUNT = BIBLE_BOOKS_ORDER.length;

// Globaler Rang jedes Buchs. Maßgeblich (Anzeige der Lösung) ist Schlachter/
// Elberfelder; die Luther-Reihenfolge wird zusätzlich als richtig akzeptiert.
const orderIndex = new Map(BIBLE_BOOKS_ORDER.map((book, i) => [book, i]));
const lutherIndex = new Map(BIBLE_BOOKS_ORDER_LUTHER.map((book, i) => [book, i]));

// Zwei Folgen gleich? (Längen sind hier immer identisch.)
const sameOrder = (a, b) => a.every((book, i) => book === b[i]);

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
let target = []; // korrekte Reihenfolge (Elberfelder) – wird als Lösung angezeigt
let targetLuther = []; // ebenfalls akzeptierte Luther-Reihenfolge
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
  targetLuther = [...subset].sort((a, b) => lutherIndex.get(a) - lutherIndex.get(b));
  // Nicht zufällig schon korrekt starten lassen.
  do {
    order = shuffled(subset);
  } while (count > 1 && (sameOrder(order, target) || sameOrder(order, targetLuther)));
  locked = false;
  render();
}

function evaluate() {
  locked = true;
  // Sowohl Elberfelder- als auch Luther-Reihenfolge gelten als richtig.
  const allCorrect = sameOrder(order, target) || sameOrder(order, targetLuther);
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

// Zieht man ein Item an den oberen/unteren Rand des Spielfelds, scrollt die
// Liste automatisch mit – so bleibt bei vielen Büchern jede Zielposition
// erreichbar, auch wenn sie gerade außerhalb des Bildschirms liegt.
function autoScrollStage(y) {
  const stage = el.list.closest('.bg-stage');
  if (!stage || stage.scrollHeight <= stage.clientHeight) return;
  const rect = stage.getBoundingClientRect();
  const EDGE = 64; // Randzone in px
  const SPEED = 14; // px pro Bewegung
  if (y < rect.top + EDGE) stage.scrollTop -= SPEED;
  else if (y > rect.bottom - EDGE) stage.scrollTop += SPEED;
}

function onPointerMove(event) {
  if (!draggedRow) return;
  event.preventDefault();
  autoScrollStage(event.clientY);
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

// Bewusst an window: so wird das Loslassen auch erkannt, wenn der Finger neben
// dem Item endet oder die Pointer-Capture beim Umsortieren verloren geht
// (sonst bliebe die Zeile fälschlich markiert).
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', endDrag);
window.addEventListener('pointercancel', endDrag);

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

  // Nur der Griff (≡) startet den Drag; der Rest der Zeile bleibt frei, damit die
  // Liste bei vielen Büchern per Touch gescrollt werden kann.
  if (!locked) {
    const handle = document.createElement('span');
    handle.className = 'drag-handle';
    handle.textContent = '≡';
    handle.title = 'Zum Verschieben ziehen';
    handle.addEventListener('pointerdown', (e) => onRowDown(e, row));
    row.append(handle);
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
  // Den Luther-Hinweis nur einblenden, wenn die aktuelle Auswahl betroffene
  // Bücher enthält – also die Luther-Reihenfolge sich von der Elberfelder-
  // Lösung unterscheidet (sonst ist er irreführend/überflüssig).
  const lutherDiffers = !sameOrder(target, targetLuther);
  el.solution.innerHTML =
    '<div class="bg-solution-title">Richtige Reihenfolge:</div>' +
    target
      .map(
        (b, i) =>
          `${i + 1}. ${b}` +
          ` <span class="bg-solution-rank">(${orderIndex.get(b) + 1}. Buch der Bibel)</span>`
      )
      .join('<br>') +
    (lutherDiffers
      ? '<div class="bg-solution-note">In der Lutherbibel stehen Hebräer und ' +
        'Jakobus an anderer Stelle – eine solche Anordnung gilt ebenfalls als ' +
        'richtig.</div>'
      : '');
  el.solution.classList.remove('hidden');
  el.action.textContent = 'Nochmal';
  el.action.classList.remove('hidden');
  el.action.onclick = () => {
    count = Math.max(START_COUNT, count - 1);
    startRound();
  };
}

function render(result) {
  el.count.textContent = count;
  el.best.textContent = best > 0 ? best : '–';

  el.list.innerHTML = '';
  order.forEach((book, i) => {
    // Bei Erfolg alles grün (auch eine gültige Luther-Reihenfolge); bei
    // Misserfolg je Position gegen die angezeigte Elberfelder-Lösung.
    const state = locked ? (result === true ? true : book === target[i]) : null;
    el.list.appendChild(makeRow(book, i + 1, state));
  });

  renderFooter(result);
}

startRound();
