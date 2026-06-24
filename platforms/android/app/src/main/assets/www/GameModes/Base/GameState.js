// GameState.js
import {
    JSON_FILE_AS_STRING,
    SELECTED_TYPE,
    SELECTED_BOOKS,
    SELECTED_DIFFICULTY,
    DIFFICULTY_MIN,
    DIFFICULTY_MAX,
} from '../../GameModes/Base/constants.js';
import { CatalogStore } from './CatalogStore.js';
import { DifficultyStore } from './DifficultyStore.js';
export class GameState {
    constructor(constants) {
        this.constants = constants;     // Constants for localStorage keys and other game settings. This is defined by the GameMode.
        this.score = 0;                 // Counter of the questions answerd correctly. Used to display the score
        this.questionCounter = 0;       // Counter for the number of questions answered. Used to display the count of answerd questions.
        this.availableQuestions = [];   // Array of questions that are still available to be answered. Every question that was answerd is removed from this array so no question is being repeated.
        this.savedQuestion = [];        // current question that is displayed. Used for getting the same question after following the link f.e.

        this.currentQuestion = {};      // current question that is displayed.
        this.jsonFileAsString = "";     // Question catalog as string.
        this.maxQuestionCounter = 0;    // Maximum number of questions available in the current category. This is used to display the max question counter in the UI. filled in loadFromCache().

        // Optionaler Filter für die nächste Runde: Typ und/oder Bücher.
        // type null = alle Typen; books null/[] = alle Bücher der Kategorie.
        // Wird vor reset()/startFreshRound() gesetzt.
        this.selection = { type: null, books: null };
    }

//#region OldWorld
    loadFromCache() {
        this.jsonFileAsString = localStorage.getItem(JSON_FILE_AS_STRING) || "";
        this.score = parseInt(localStorage.getItem(this.constants.SCORE)) || 0;
        this.questionCounter = parseInt(localStorage.getItem(this.constants.QUESTION_COUNTER)) || 0;
        this.availableQuestions = JSON.parse(localStorage.getItem(this.constants.AVAILABLE_QUESTIONS)) || [];
        this.savedQuestion = JSON.parse(localStorage.getItem(this.constants.SAVED_QUESTION)) || null;
        
        this.maxQuestionCounter = this.availableQuestions.length + this.questionCounter; // Maximum number of questions available in the current category. This is used to display the max question counter in the UI.

        // Auf der Startseite/im Drawer gewählte Kategorie (Typ) und Bücher als
        // Filter übernehmen. Leerer/fehlender Typ => alle Fragen; leeres/fehlendes
        // Bücher-Array => alle Bücher der Kategorie.
        const selectedType = localStorage.getItem(SELECTED_TYPE);
        let selectedBooks = null;
        try {
            const parsed = JSON.parse(localStorage.getItem(SELECTED_BOOKS));
            if (Array.isArray(parsed) && parsed.length > 0) selectedBooks = parsed;
        } catch { /* ungültiger/leerer Wert => alle Bücher */ }
        this.selection = { type: selectedType || null, books: selectedBooks };
    }

    saveToCache() {
        localStorage.setItem(this.constants.SCORE, this.score);
        localStorage.setItem(this.constants.QUESTION_COUNTER, this.questionCounter);
        localStorage.setItem(this.constants.AVAILABLE_QUESTIONS, JSON.stringify(this.availableQuestions));
        localStorage.setItem(this.constants.SAVED_QUESTION, JSON.stringify(this.currentQuestion));
    }

    hasValidData() {
        return Array.isArray(this.availableQuestions) && this.availableQuestions.length > 0;
    }

    reset() {
        console.log("Resetting game state...");
        this.score = 0;
        this.questionCounter = 0;
        this.savedQuestion = null; // Reset saved question to null for a new game
        this.getQuestionsByCategory();
        this.maxQuestionCounter = this.availableQuestions.length; // Gesamtzahl für die Fortschrittsanzeige

        this.saveToCache();
    }

    getQuestionsByCategory() {
        const categoryPrefix = this.constants.CATEGORY || "";
        const wantType = this.selection && this.selection.type;
        const selectedBooks = this.selection && this.selection.books;
        const wantBooks = Array.isArray(selectedBooks) && selectedBooks.length > 0
            ? new Set(selectedBooks)
            : null;
        const { merged, introByCategory, typeByCategory } = CatalogStore.getMerged();

        const result = [];
        for (const categoryName in merged) {
            if (!categoryName.startsWith(categoryPrefix)) continue;
            if (wantType && typeByCategory[categoryName] !== wantType) continue;

            const books = merged[categoryName];
            const intro = introByCategory[categoryName] || "";
            for (const book in books) {
                if (wantBooks && !wantBooks.has(book)) continue;
                books[book].forEach((q) => {
                    q.categoryName = categoryName; // unterscheidet Zitate / Allgemeine Fragen etc.
                    q.book = book;
                    q.introText = intro;
                });
                result.push(...books[book]);
            }
        }
        // Optionaler Schwierigkeits-Filter (von der Schwierigkeits-Auswahl gesetzt).
        this.availableQuestions = this.applyDifficultyFilter(result);
    }

    // Liest SELECTED_DIFFICULTY ("min-max", z. B. "0-2") und filtert die Fragen
    // über den DifficultyStore. Leer/fehlend oder voller Bereich = kein Filter.
    applyDifficultyFilter(questions) {
        const raw = localStorage.getItem(SELECTED_DIFFICULTY);
        if (!raw) return questions;
        const [min, max] = raw.split('-').map(Number);
        if (!Number.isFinite(min) || !Number.isFinite(max)) return questions;
        if (min <= DIFFICULTY_MIN && max >= DIFFICULTY_MAX) return questions; // voller Bereich
        return DifficultyStore.filterByRange(questions, min, max);
    }

    // Einleitungstext kommt jetzt aus den Katalog-Metadaten (auf der Frage
    // gespeichert). Fallback für alte Cache-Daten ohne introText.
    getIntroTextForCategory() {
        if (this.currentQuestion && typeof this.currentQuestion.introText === "string") {
            return this.currentQuestion.introText;
        }
        const categoryName = (this.currentQuestion && this.currentQuestion.categoryName) || "";
        if (categoryName.startsWith("Zitate")) return "Wer hat gesagt:";
        if (categoryName.startsWith("Wo_Steht")) return "Wo steht:";
        return "";
    }
    
//#endregion
    
//#region newWorld
    /**
     * Loads questions from the new JSON format and organizes them by category.
     * @param {Object} jsonData - The parsed JSON data from newFormat.json.
     */    
    loadQuestionsFromNewFormat(jsonData) {
        if (!jsonData) {
            console.error("No data provided for loading questions.");
            return;
        }

        // Clear existing questions
        this.questionsByCategory = {};

        // Process each category in the JSON data
        for (const [category, books] of Object.entries(jsonData)) {
            this.questionsByCategory[category] = [];
            for (const [book, questions] of Object.entries(books)) {
                this.questionsByCategory[category].push(...questions);
            }
        }
    }


    /**
     * Initializes the available questions for a specific category.
     * @param {string} category - The category to initialize (e.g., "Zitate_NT - v1.2").
     */
    initializeCategory(category) {
        if (this.questionsByCategory[category]) {
            this.availableQuestions = [...this.questionsByCategory[category]];
        } else {
            console.error("Invalid category specified:", category);1
        }
    }

    /**
     * Resets the game state for a specific category.
     * @param {string} category - The category to reset (e.g., "Zitate_NT - v1.2").
     */
    resetCategory(category) {
        this.score = 0;
        this.questionCounter = 0;

        if (this.questionsByCategory[category]) {
            this.availableQuestions = [...this.questionsByCategory[category]];
        } else {
            console.error("Invalid category specified:", category);
        }

        this.savedQuestion = [];
    }

    /**
     * Checks if there are valid questions for a specific category.
     * @param {string} category - The category to check (e.g., "Zitate_NT - v1.2").
     * @returns {boolean} - True if valid questions exist, false otherwise.
     */
    hasValidDataForCategory(category) {
        return (
            this.questionsByCategory[category] &&
            Array.isArray(this.questionsByCategory[category]) &&
            this.questionsByCategory[category].length > 0
        );
    }

    getQuestionsByCategoryTO_BE_TESTED(data, categoryPrefix) {
        const result = [];
    
        for (const categoryName in data) {
            if (categoryName.startsWith(categoryPrefix)) {
                const books = data[categoryName];
                for (const book in books) {
                    result.push(...books[book]); // fügt alle Fragen aus jedem Buch hinzu
                }
            }
        }
    
        return result;
    }
//#endregion
}
