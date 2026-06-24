// options.js – Katalogverwaltung: auflisten, hinzufügen/ersetzen (Excel/JSON), löschen.
// Zusätzlich: Spiel-Einstellungen (Falsche Fragen wiederholen, Schwierigkeit zurücksetzen).
import { CatalogStore } from "../../GameModes/Base/CatalogStore.js";
import { parseUpload } from "../../GameModes/Base/catalogImport.js";
import { DifficultyStore } from "../../GameModes/Base/DifficultyStore.js";
import { REPEAT_WRONG_ANSWERS } from "../../GameModes/Base/constants.js";

const listEl = document.getElementById("catalogList");
const countEl = document.getElementById("catalogCount");
const titleEl = document.getElementById("uploadTitle");
const typeEl = document.getElementById("uploadType");
const replaceEl = document.getElementById("replaceTarget");
const fileEl = document.getElementById("uploadFile");
const importBtn = document.getElementById("importBtn");
const statusEl = document.getElementById("importStatus");
const resetBtn = document.getElementById("resetCache");
const repeatWrongEl = document.getElementById("repeatWrongAnswers");
const resetDifficultyEl = document.getElementById("resetDifficulty");
const settingsStatusEl = document.getElementById("settingsStatus");

// Cache-Schlüssel, die "Spielstand zurücksetzen" entfernt (Kataloge bleiben).
const PROGRESS_PREFIXES = ["mode_", "saved_question", "tipp_showen", "jsonFileString"];

function renderList() {
  const catalogs = CatalogStore.listInstalled();
  listEl.innerHTML = "";
  replaceEl.innerHTML = '<option value="">Als neuen Katalog hinzufügen</option>';
  if (countEl) countEl.textContent = ` (${catalogs.length})`;

  if (catalogs.length === 0) {
    listEl.innerHTML = "<p class='catalog-info'>Noch keine Kataloge installiert.</p>";
    return;
  }

  for (const meta of catalogs) {
    const row = document.createElement("div");
    row.className = "catalog-row";

    const info = document.createElement("span");
    info.className = "catalog-info";
    info.innerHTML =
      `${meta.title}<br><small>${meta.type} · ${meta.books.length} Bücher · ${meta.questionCount} Fragen</small>`;
    row.appendChild(info);

    const del = document.createElement("button");
    del.className = "smallbtn";
    del.textContent = "Löschen";
    del.addEventListener("click", () => {
      if (confirm(`Katalog "${meta.title}" löschen?`)) {
        CatalogStore.remove(meta.id);
        renderList();
      }
    });
    row.appendChild(del);
    listEl.appendChild(row);

    const opt = document.createElement("option");
    opt.value = meta.id;
    opt.textContent = "Ersetzen: " + meta.title;
    replaceEl.appendChild(opt);
  }
}

async function doImport() {
  const file = fileEl.files[0];
  if (!file) {
    statusEl.textContent = "Bitte zuerst eine Excel- oder JSON-Datei wählen.";
    return;
  }
  const targetId = replaceEl.value;
  const targetMeta = targetId ? CatalogStore.getMeta(targetId) : null;
  const title = titleEl.value.trim() || (targetMeta ? targetMeta.title : file.name.replace(/\.[^.]+$/, ""));

  statusEl.textContent = "Importiere …";
  try {
    const { meta, data, report } = await parseUpload(file, {
      title,
      typeKey: typeEl.value,
      id: targetId || undefined,
    });

    if (!meta.questionCount) {
      statusEl.textContent =
        "Keine gültigen Fragen gefunden. Spalten prüfen: question, choice1–4, answer (1–4).";
      return;
    }

    CatalogStore.addOrReplace(meta, data);

    let msg = `✔ "${meta.title}": ${meta.questionCount} Fragen aus ${meta.books.length} Büchern.`;
    if (report && report.incomplete && report.incomplete.length) {
      msg += ` ⚠ ${report.incomplete.length} Zeile(n) ohne gültige Antwort übersprungen.`;
    }
    statusEl.textContent = msg;
    titleEl.value = "";
    fileEl.value = "";
    renderList();
  } catch (e) {
    console.error(e);
    statusEl.textContent = "Fehler beim Import: " + e.message;
  }
}

function resetProgress() {
  if (!confirm("Spielstand zurücksetzen? Die installierten Kataloge bleiben erhalten.")) return;
  for (const key of Object.keys(localStorage)) {
    if (PROGRESS_PREFIXES.some((p) => key.startsWith(p))) {
      localStorage.removeItem(key);
    }
  }
  statusEl.textContent = "Spielstand zurückgesetzt.";
}

// Spiel-Einstellungen: Zustand laden und Listener verdrahten.
function loadGameSettings() {
  if (repeatWrongEl) {
    repeatWrongEl.checked = localStorage.getItem(REPEAT_WRONG_ANSWERS) === "true";
  }
}

function onRepeatWrongChange() {
  localStorage.setItem(REPEAT_WRONG_ANSWERS, repeatWrongEl.checked.toString());
  settingsStatusEl.textContent = repeatWrongEl.checked
    ? "Falsche Fragen werden ab der nächsten Runde wiederholt."
    : "Wiederholung falscher Fragen ausgeschaltet.";
}

function resetDifficulty() {
  if (!confirm("Alle Schwierigkeitsstufen auf den Standard (5) zurücksetzen?")) return;
  DifficultyStore.resetAll();
  settingsStatusEl.textContent = "Schwierigkeitsstufen zurückgesetzt.";
}

importBtn.addEventListener("click", doImport);
resetBtn.addEventListener("click", resetProgress);
if (repeatWrongEl) repeatWrongEl.addEventListener("change", onRepeatWrongChange);
if (resetDifficultyEl) resetDifficultyEl.addEventListener("click", resetDifficulty);

loadGameSettings();
renderList();
