// startPage.js
// Baut die Hauptseite dynamisch auf: ganz oben "Alle Fragen", darunter je
// vorhandener Kategorie (Katalog-Typ) ein Button – inklusive eigener, vom
// Nutzer importierter Kataloge – plus die Sonder-Kategorie "Zahlenfragen".
// Ein Klick startet das Quiz direkt; die Buchwahl passiert danach im Drawer.
import { CatalogStore } from '../GameModes/Base/CatalogStore.js';
import {
  SELECTED_TYPE,
  SELECTED_BOOKS,
  SELECTED_DIFFICULTY,
  SELECTION_FRESH,
  ZAHLEN_BOOK,
  ZAHLEN_TYPE,
  ZAHLEN_LABEL,
} from '../GameModes/Base/constants.js';

// Direkter Einstieg in den (jetzt vereinheitlichten) Spiel-Bildschirm.
const GAME_URL = '../GameModes/ChooseBook/chooseBookMode.html';
const ALL_QUESTIONS_LABEL = 'Alle Fragen';

// Erzeugt einen Auswahl-Button. type === "" bedeutet "alle Fragen".
// books === null => alle Bücher der Kategorie; sonst Vorauswahl dieser Bücher.
function createCategoryButton(label, type, books = null) {
  const btn = document.createElement('a');
  btn.className = 'btn';
  btn.textContent = label;
  btn.href = GAME_URL;
  btn.addEventListener('click', () => {
    // Auswahl merken und neue Runde erzwingen (kein Fortsetzen alter Spielstände).
    localStorage.setItem(SELECTED_TYPE, type || '');
    localStorage.setItem(SELECTED_BOOKS, JSON.stringify(books || []));
    // Kategorie-Spiel ignoriert einen evtl. zuvor gesetzten Schwierigkeits-Filter.
    localStorage.setItem(SELECTED_DIFFICULTY, '');
    localStorage.setItem(SELECTION_FRESH, '1');
  });
  return btn;
}

// Installierte Kataloge nach Typ gruppieren und je Typ einen Anzeigetext liefern.
// Bevorzugt den Einleitungstext (z. B. "Wer hat gesagt:"), sonst den Typnamen.
function getCategories() {
  const labelByType = new Map();
  for (const meta of CatalogStore.listInstalled()) {
    const type = meta.type || 'Sonstige';
    if (labelByType.has(type)) continue;
    const intro = (meta.introText || '').replace(/:\s*$/, '').trim();
    labelByType.set(type, intro || type);
  }
  return [...labelByType.entries()].map(([type, label]) => ({ type, label }));
}

// Prüft, ob das Buch "Zahlen" in einem Allgemeine-Fragen-Katalog vorhanden ist.
function hasZahlenBook() {
  return CatalogStore.listInstalled().some(
    (meta) => meta.type === ZAHLEN_TYPE && (meta.books || []).includes(ZAHLEN_BOOK)
  );
}

function renderButtons() {
  const list = document.getElementById('categoryButtons');
  if (!list) return;
  list.innerHTML = '';

  // Oberster Button: alle Fragen ohne Filter.
  list.appendChild(createCategoryButton(ALL_QUESTIONS_LABEL, ''));

  // Darunter dynamisch je vorhandener Kategorie.
  for (const { type, label } of getCategories()) {
    list.appendChild(createCategoryButton(label, type));
  }

  // Sonder-Kategorie "Zahlenfragen": startet direkt nur mit dem Buch "Zahlen".
  if (hasZahlenBook()) {
    list.appendChild(createCategoryButton(ZAHLEN_LABEL, ZAHLEN_TYPE, [ZAHLEN_BOOK]));
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Beim Erststart die mitgelieferten Kataloge laden, damit Kategorien erscheinen.
  await CatalogStore.ensureSeeded();
  renderButtons();
});
