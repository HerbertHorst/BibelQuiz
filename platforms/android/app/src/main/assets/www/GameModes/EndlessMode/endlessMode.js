// QuizModeEndless.js
import { QuizModeBase } from './../Base/QuizModeBase.js';
import { CatalogStore } from './../Base/CatalogStore.js';
import { MODE_ENDLESS_ALL_QUESTIONS, MODE_ENDLESS_SCORE, MODE_ENDLESS_AVAILABLE_QUESTIONS,
    MODE_ENDLESS_RECENT_SCORE, CORRECT_BONUS,CORRECT_TIPP_BONUS,WAIT_TIMEOUT, SAVED_QUESTION,
    CATEGORY_All, MODE_ENDLESS_QUESTION_COUNTER, SELECTION_FRESH} from './../Base/constants.js';

export class QuizModeEndless extends QuizModeBase {
    constructor() {
        super({
            ALL_QUESTIONS: MODE_ENDLESS_ALL_QUESTIONS,
            SCORE: MODE_ENDLESS_SCORE,
            AVAILABLE_QUESTIONS: MODE_ENDLESS_AVAILABLE_QUESTIONS,
            RECENT_SCORE: MODE_ENDLESS_RECENT_SCORE,
            CORRECT_BONUS: CORRECT_BONUS,
            CORRECT_TIPP_BONUS: CORRECT_TIPP_BONUS,
            WAIT_TIMEOUT: WAIT_TIMEOUT,
            SAVED_QUESTION: SAVED_QUESTION,
            CATEGORY: CATEGORY_All,
            QUESTION_COUNTER: MODE_ENDLESS_QUESTION_COUNTER
        });
    }
}
const quizMode = new QuizModeEndless();

document.addEventListener("DOMContentLoaded", async () => {
    // Beim Erststart die mitgelieferten Kataloge in den CatalogStore laden.
    await CatalogStore.ensureSeeded();
    // Hat der Nutzer gerade auf der Startseite eine Kategorie gewählt, beginnt
    // eine neue, gefilterte Runde. Andernfalls einen gültigen Spielstand
    // fortsetzen (z. B. nach App-Neustart) bzw. sonst neu starten.
    const freshSelection = localStorage.getItem(SELECTION_FRESH) === "1";
    localStorage.removeItem(SELECTION_FRESH);
    if (!freshSelection && quizMode.gameState.hasValidData()) {
        quizMode.continueFromCache();
    } else {
        quizMode.startNewFromCache();
    }
});