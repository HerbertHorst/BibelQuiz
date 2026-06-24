//OUT BECAUSE POINTLESS 
// export const MODE_50_ALL_QUESTIONS = 'mode50_allQuestions';
// export const MODE_50_SCORE = 'mode50_score';
// export const MODE_50_AVAILABLE_QUESTIONS = 'mode50_availableQuestions';
// export const MODE_50_RECENT_SCORE = 'mode50_mostRecentScore';


export const JSON_FILE_AS_STRING = 'jsonFileString';

// Von der Startseite gewählte Kategorie (Katalog-Typ). "" bzw. fehlend = alle Fragen.
export const SELECTED_TYPE = 'selectedType';
// Von der Startseite/dem Bücher-Drawer gewählte Bücher (JSON-Array der Buchnamen).
// Leeres Array bzw. fehlend = alle Bücher der Kategorie.
export const SELECTED_BOOKS = 'selectedBooks';
// Signal, dass auf der Startseite gerade eine Kategorie gewählt wurde -> neue Runde
// erzwingen, statt einen evtl. laufenden Spielstand fortzusetzen.
export const SELECTION_FRESH = 'selectionFresh';

// Sonder-Kategorie "Zahlenfragen": ein Buch innerhalb der Allgemeinen Fragen,
// das auf der Startseite zusätzlich als eigene Kategorie auftaucht.
export const ZAHLEN_BOOK = 'Zahlen';
export const ZAHLEN_TYPE = 'Allgemeine Fragen';
export const ZAHLEN_LABEL = 'Zahlenfragen';

export const CATEGORY_All = '';
export const CATEGORY_ZITATE = 'Zitate';
export const CATEGORY_ZITATE_AT = 'Zitate_AT';
export const CATEGORY_ZITATE_NT = 'Zitate_NT';
export const CATEGORY_Other_Questions_NT = 'Wo_Steht';

export const MODE_ENDLESS_ALL_QUESTIONS = 'mode_endless_allQuestions';
export const MODE_ENDLESS_SCORE = 'mode_endless_score';
export const MODE_ENDLESS_AVAILABLE_QUESTIONS = 'mode_endless_availableQuestions';
export const MODE_ENDLESS_RECENT_SCORE = 'mode_endless_mostRecentScore';
export const MODE_ENDLESS_QUESTION_COUNTER = 'mode_endless_questionCounter';

export const MODE_ChooseBook_ALL_QUESTIONS = 'mode_chooseBook_allQuestions';
export const MODE_ChooseBook_SCORE = 'mode_chooseBook_score';
export const MODE_ChooseBook_AVAILABLE_QUESTIONS = 'mode_chooseBook_availableQuestions';
export const MODE_ChooseBook_RECENT_SCORE = 'mode_chooseBook_mostRecentScore';
export const MODE_ChooseBook_QUESTION_COUNTER = 'mode_chooseBook_questionCounter';

export const CORRECT_BONUS = 1;
export const CORRECT_TIPP_BONUS = 0.5;
export const WAIT_TIMEOUT = 1500;
export const SAVED_QUESTION = 'saved_question';
export const TIPP_SHOWEN = 'tipp_showen';

// Option "Falsche Fragen wiederholen": falsch beantwortete Fragen wandern zurück
// in den Pool, der Fortschrittszähler steht still und der Score wird ausgeblendet.
export const REPEAT_WRONG_ANSWERS = 'repeat_wrong_answers';

// Von der Schwierigkeits-Auswahl gesetzter Filter, Format "min-max" (z. B. "0-2").
// Leer/fehlend oder "0-10" = kein Filter (alle Schwierigkeitsstufen).
export const SELECTED_DIFFICULTY = 'selectedDifficulty';

// Spaced-Repetition: Schwierigkeit je Frage 0–10. Neue/unbekannte Fragen starten
// auf DIFFICULTY_DEFAULT (= "Mittel"). Richtig -1, falsch +1.
export const DIFFICULTY_STORE_KEY = 'quiz_difficulty';
export const DIFFICULTY_MIN = 0;
export const DIFFICULTY_MAX = 10;
export const DIFFICULTY_DEFAULT = 5;