// options.js – Spiel-Einstellungen (Falsche Fragen wiederholen, Schwierigkeit
// zurücksetzen) und Spielstand zurücksetzen. Katalogverwaltung liegt im
// Untermenü catalogs.html / catalogs.js.
import { DifficultyStore } from "../../GameModes/Base/DifficultyStore.js";
import { REPEAT_WRONG_ANSWERS } from "../../GameModes/Base/constants.js";

const resetBtn = document.getElementById("resetCache");
const repeatWrongEl = document.getElementById("repeatWrongAnswers");
const resetDifficultyEl = document.getElementById("resetDifficulty");
const settingsStatusEl = document.getElementById("settingsStatus");

// Cache-Schlüssel, die "Spielstand zurücksetzen" entfernt (Kataloge bleiben).
const PROGRESS_PREFIXES = ["mode_", "saved_question", "tipp_showen", "jsonFileString"];

function resetProgress() {
  if (!confirm("Spielstand zurücksetzen? Die installierten Kataloge bleiben erhalten.")) return;
  for (const key of Object.keys(localStorage)) {
    if (PROGRESS_PREFIXES.some((p) => key.startsWith(p))) {
      localStorage.removeItem(key);
    }
  }
  settingsStatusEl.textContent = "Spielstand zurückgesetzt.";
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

resetBtn.addEventListener("click", resetProgress);
if (repeatWrongEl) repeatWrongEl.addEventListener("change", onRepeatWrongChange);
if (resetDifficultyEl) resetDifficultyEl.addEventListener("click", resetDifficulty);

loadGameSettings();
