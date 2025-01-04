// QuizModeEndless.js
import { QuizModeBase } from './../Base/QuizModeBase.js';
import { MODE_ENDLESS_ALL_QUESTIONS, MODE_ENDLESS_SCORE, MODE_ENDLESS_AVAILABLE_QUESTIONS, MODE_ENDLESS_RECENT_SCORE, CORRECT_BONUS,CORRECT_TIPP_BONUS,WAIT_TIMEOUT } from './../Base/constants.js';

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
        });
    }
}
const quizMode = new QuizModeEndless();