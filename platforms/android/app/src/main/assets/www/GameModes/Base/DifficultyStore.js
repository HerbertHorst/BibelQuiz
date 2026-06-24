// DifficultyStore.js
// Spaced-Repetition-Schwierigkeit je Frage, bewusst getrennt von den Katalogdaten
// gehalten: ein einziger localStorage-Schlüssel
//   quiz_difficulty -> { "<Fragetext>": level }
// Die Frage wird – wie im alten Modell – über ihren Text identifiziert. Dadurch
// überlebt der Lernfortschritt das Hinzufügen/Ersetzen/Löschen von Katalogen,
// ohne dass der CatalogStore selbst beschrieben werden muss.

import {
  DIFFICULTY_STORE_KEY,
  DIFFICULTY_MIN,
  DIFFICULTY_MAX,
  DIFFICULTY_DEFAULT,
} from './constants.js';

function loadMap() {
  try {
    return JSON.parse(localStorage.getItem(DIFFICULTY_STORE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveMap(map) {
  localStorage.setItem(DIFFICULTY_STORE_KEY, JSON.stringify(map));
}

function levelFor(map, question) {
  if (!question || !question.question) return DIFFICULTY_DEFAULT;
  const lvl = map[question.question];
  return typeof lvl === 'number' ? lvl : DIFFICULTY_DEFAULT;
}

export const DifficultyStore = {
  // Aktuelle Schwierigkeitsstufe einer Frage (Default für unbekannte Fragen).
  getLevel(question) {
    return levelFor(loadMap(), question);
  },

  // Antwort verbuchen: richtig senkt die Stufe, falsch hebt sie (geklemmt 0–10).
  record(question, wasCorrect) {
    if (!question || !question.question) return;
    const map = loadMap();
    const current = levelFor(map, question);
    map[question.question] = wasCorrect
      ? Math.max(DIFFICULTY_MIN, current - 1)
      : Math.min(DIFFICULTY_MAX, current + 1);
    saveMap(map);
  },

  // Filtert eine Fragenliste auf den Schwierigkeitsbereich [min, max].
  filterByRange(questions, min = DIFFICULTY_MIN, max = DIFFICULTY_MAX) {
    const map = loadMap();
    return questions.filter((q) => {
      const lvl = levelFor(map, q);
      return lvl >= min && lvl <= max;
    });
  },

  // Setzt den gesamten Lernfortschritt zurück (alle Fragen wieder auf Default).
  resetAll() {
    localStorage.removeItem(DIFFICULTY_STORE_KEY);
  },
};
