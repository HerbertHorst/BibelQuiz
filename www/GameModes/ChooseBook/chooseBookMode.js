// chooseBookMode.js
// Einheitlicher Spiel-Bildschirm: Beim Aufruf startet das Quiz sofort mit der
// auf der Startseite gewählten Kategorie. Welche Bücher mitspielen, wählt man
// jederzeit über den seitlichen Bücher-Drawer (AT/NT als ein-/ausklappbare
// Obergruppen mit Checkboxen, Mehrfachauswahl). Eine geänderte Auswahl startet
// eine frische Runde, damit der "verfügbare Fragen"-Teil dazu passt.
import { QuizModeBase } from "./../Base/QuizModeBase.js";
import { CatalogStore } from "./../Base/CatalogStore.js";
import { groupBooksByTestament } from "./../Base/bibleBooks.js";
import {
  MODE_ChooseBook_ALL_QUESTIONS,
  MODE_ChooseBook_SCORE,
  MODE_ChooseBook_AVAILABLE_QUESTIONS,
  MODE_ChooseBook_RECENT_SCORE,
  MODE_ChooseBook_QUESTION_COUNTER,
  CORRECT_BONUS,
  CORRECT_TIPP_BONUS,
  WAIT_TIMEOUT,
  SAVED_QUESTION,
  CATEGORY_All,
  SELECTED_TYPE,
  SELECTED_BOOKS,
  SELECTION_FRESH,
} from "./../Base/constants.js";

export class QuizModeChooseBook extends QuizModeBase {
  constructor() {
    super({
      ALL_QUESTIONS: MODE_ChooseBook_ALL_QUESTIONS,
      SCORE: MODE_ChooseBook_SCORE,
      AVAILABLE_QUESTIONS: MODE_ChooseBook_AVAILABLE_QUESTIONS,
      RECENT_SCORE: MODE_ChooseBook_RECENT_SCORE,
      QUESTION_COUNTER: MODE_ChooseBook_QUESTION_COUNTER,
      CORRECT_BONUS: CORRECT_BONUS,
      CORRECT_TIPP_BONUS: CORRECT_TIPP_BONUS,
      WAIT_TIMEOUT: WAIT_TIMEOUT,
      SAVED_QUESTION: SAVED_QUESTION,
      CATEGORY: CATEGORY_All,
    });
  }
}

let quizMode = null;
let selectedType = ""; // gewählte Kategorie (Katalog-Typ); "" = alle
let availableBooks = []; // alle Bücher, die zur Kategorie gehören

// Alle Buchnamen der gewählten Kategorie (über alle passenden Kataloge vereint).
function getBooksForType(type) {
  const set = new Set();
  for (const meta of CatalogStore.listInstalled()) {
    if (type && meta.type !== type) continue;
    (meta.books || []).forEach((b) => set.add(b));
  }
  return [...set];
}

// Liest die aktuell im Drawer angehakten Bücher.
function getCheckedBooks() {
  return Array.from(
    document.querySelectorAll("#bookDrawerBody .book-checkbox:checked")
  ).map((cb) => cb.value);
}

// Startet eine frische Runde mit den übergebenen Büchern und merkt sich die Wahl.
function startRound(books) {
  const useBooks = Array.isArray(books) && books.length > 0 ? books : null;
  localStorage.setItem(SELECTED_BOOKS, JSON.stringify(useBooks || []));
  quizMode.gameState.selection = {
    type: selectedType || null,
    books: useBooks,
  };
  quizMode.startFreshRound();
}

//#region Drawer-UI
function openDrawer() {
  document.getElementById("bookDrawer").classList.add("open");
  document.getElementById("drawerOverlay").classList.add("open");
}

function closeDrawer() {
  document.getElementById("bookDrawer").classList.remove("open");
  document.getElementById("drawerOverlay").classList.remove("open");
}

// Parent-Checkbox (checked/indeterminate) anhand der Kind-Checkboxen aktualisieren.
function syncGroupCheckbox(groupEl) {
  const parent = groupEl.querySelector(".group-checkbox");
  const items = Array.from(groupEl.querySelectorAll(".book-checkbox"));
  const checked = items.filter((cb) => cb.checked).length;
  parent.checked = checked === items.length;
  parent.indeterminate = checked > 0 && checked < items.length;
}

// "Übernehmen" nur erlauben, wenn mindestens ein Buch angehakt ist.
function updateApplyButton() {
  const apply = document.getElementById("drawerApply");
  apply.disabled = getCheckedBooks().length === 0;
}

function makeBookCheckbox(book, checked) {
  const label = document.createElement("label");
  label.className = "book-item";
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.className = "book-checkbox";
  cb.value = book;
  cb.checked = checked;
  label.appendChild(cb);
  label.appendChild(document.createTextNode(" " + book));
  return label;
}

// Baut den Drawer aus den Büchern der Kategorie. Vorausgewählt sind die Bücher
// aus `preselected` (Set); ist eine Gruppe nicht vollständig gewählt, wird sie
// aufgeklappt, sonst eingeklappt.
function buildDrawer(preselected) {
  const body = document.getElementById("bookDrawerBody");
  body.innerHTML = "";

  const groups = groupBooksByTestament(availableBooks);
  for (const group of groups) {
    const groupEl = document.createElement("div");
    groupEl.className = "drawer-group";

    const header = document.createElement("div");
    header.className = "drawer-group-header";

    const caret = document.createElement("button");
    caret.type = "button";
    caret.className = "group-caret";
    caret.textContent = "▾";

    const parentLabel = document.createElement("label");
    parentLabel.className = "group-label";
    const parentCb = document.createElement("input");
    parentCb.type = "checkbox";
    parentCb.className = "group-checkbox";
    parentLabel.appendChild(parentCb);
    parentLabel.appendChild(document.createTextNode(" " + group.label));

    header.appendChild(caret);
    header.appendChild(parentLabel);
    groupEl.appendChild(header);

    const items = document.createElement("div");
    items.className = "drawer-group-items";
    let anyUnchecked = false;
    for (const book of group.books) {
      const isChecked = preselected.has(book);
      if (!isChecked) anyUnchecked = true;
      items.appendChild(makeBookCheckbox(book, isChecked));
    }
    groupEl.appendChild(items);

    // Voll gewählte Gruppen eingeklappt starten, sonst aufgeklappt.
    if (!anyUnchecked) {
      groupEl.classList.add("collapsed");
      caret.textContent = "▸";
    }

    caret.addEventListener("click", () => {
      const collapsed = groupEl.classList.toggle("collapsed");
      caret.textContent = collapsed ? "▸" : "▾";
    });
    parentCb.addEventListener("change", () => {
      groupEl
        .querySelectorAll(".book-checkbox")
        .forEach((cb) => (cb.checked = parentCb.checked));
      parentCb.indeterminate = false;
      updateApplyButton();
    });
    items.addEventListener("change", (e) => {
      if (!e.target.classList.contains("book-checkbox")) return;
      syncGroupCheckbox(groupEl);
      updateApplyButton();
    });

    syncGroupCheckbox(groupEl);
    body.appendChild(groupEl);
  }
  updateApplyButton();
}

function setAllCheckboxes(checked) {
  document
    .querySelectorAll("#bookDrawerBody .book-checkbox")
    .forEach((cb) => (cb.checked = checked));
  document.querySelectorAll("#bookDrawerBody .drawer-group").forEach((g) => {
    const parent = g.querySelector(".group-checkbox");
    parent.checked = checked;
    parent.indeterminate = false;
  });
  updateApplyButton();
}

function wireDrawerControls() {
  document.getElementById("drawerToggle").addEventListener("click", openDrawer);
  document.getElementById("drawerClose").addEventListener("click", closeDrawer);
  document.getElementById("drawerOverlay").addEventListener("click", closeDrawer);
  document
    .getElementById("drawerSelectAll")
    .addEventListener("click", () => setAllCheckboxes(true));
  document
    .getElementById("drawerSelectNone")
    .addEventListener("click", () => setAllCheckboxes(false));
  document.getElementById("drawerApply").addEventListener("click", () => {
    const books = getCheckedBooks();
    if (books.length === 0) return;
    closeDrawer();
    startRound(books);
  });
}
//#endregion

document.addEventListener("DOMContentLoaded", async () => {
  await CatalogStore.ensureSeeded();
  // Das Auswahl-Signal der Startseite ist mit dem direkten Start verbraucht.
  localStorage.removeItem(SELECTION_FRESH);

  quizMode = new QuizModeChooseBook();
  selectedType = localStorage.getItem(SELECTED_TYPE) || "";
  availableBooks = getBooksForType(selectedType);

  const errorText = document.getElementById("errorText");
  if (availableBooks.length === 0) {
    if (errorText) {
      errorText.innerText =
        "Keine Kataloge installiert. Bitte in den Einstellungen hinzufügen.";
    }
    return;
  }

  // Vorauswahl: von der Startseite gesetzte Bücher (z. B. "Zahlen" für die
  // Kategorie Zahlenfragen), sonst alle Bücher der Kategorie.
  let preselected;
  try {
    const stored = JSON.parse(localStorage.getItem(SELECTED_BOOKS));
    preselected = Array.isArray(stored) && stored.length > 0
      ? new Set(stored.filter((b) => availableBooks.includes(b)))
      : new Set(availableBooks);
  } catch {
    preselected = new Set(availableBooks);
  }
  if (preselected.size === 0) preselected = new Set(availableBooks);

  wireDrawerControls();
  buildDrawer(preselected);
  startRound([...preselected]);
});
