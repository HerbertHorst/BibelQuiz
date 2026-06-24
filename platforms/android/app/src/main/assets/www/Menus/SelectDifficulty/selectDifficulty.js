// selectDifficulty.js
// Schwierigkeits-Auswahl für die Katalog-Architektur. Setzt einen Schwierigkeits-
// Filter ("min-max") und startet eine frische Runde über den vorhandenen
// ChooseBook-Spielmodus (alle Kategorien/Bücher, eingegrenzt nach Lernstand).
import { CatalogStore } from '../../GameModes/Base/CatalogStore.js';
import { DifficultyStore } from '../../GameModes/Base/DifficultyStore.js';
import {
  SELECTED_TYPE,
  SELECTED_BOOKS,
  SELECTED_DIFFICULTY,
  SELECTION_FRESH,
} from '../../GameModes/Base/constants.js';

const GAME_URL = '../../GameModes/ChooseBook/chooseBookMode.html';
const errorText = document.getElementById('errorText');
const buttons = document.querySelectorAll('[data-difficulty]');

// Alle Fragen aller installierten Kataloge als flache Liste.
function getAllQuestions() {
  const { merged } = CatalogStore.getMerged();
  const all = [];
  for (const category of Object.keys(merged)) {
    for (const book of Object.keys(merged[category])) {
      all.push(...merged[category][book]);
    }
  }
  return all;
}

document.addEventListener('DOMContentLoaded', async () => {
  // Beim Erststart die mitgelieferten Kataloge laden, damit Fragen vorhanden sind.
  await CatalogStore.ensureSeeded();

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const range = button.dataset.difficulty; // z. B. "0-2"
      const [min, max] = range.split('-').map(Number);

      const all = getAllQuestions();
      if (all.length === 0) {
        errorText.style.color = '#ff6b6b';
        errorText.textContent =
          'Keine Kataloge installiert. Bitte in den Einstellungen hinzufügen.';
        return;
      }

      const inRange = DifficultyStore.filterByRange(all, min, max);
      if (inRange.length === 0) {
        errorText.style.color = '#ff6b6b';
        errorText.textContent =
          `Keine Fragen im Bereich ${min}–${max}. Spiele zuerst ein paar Runden, ` +
          'damit sich Schwierigkeitsstufen bilden.';
        return;
      }

      // Filter merken und frische Runde über alle Kategorien/Bücher erzwingen.
      localStorage.setItem(SELECTED_TYPE, '');
      localStorage.setItem(SELECTED_BOOKS, JSON.stringify([]));
      localStorage.setItem(SELECTED_DIFFICULTY, range);
      localStorage.setItem(SELECTION_FRESH, '1');
      window.location.assign(GAME_URL);
    });
  });
});
