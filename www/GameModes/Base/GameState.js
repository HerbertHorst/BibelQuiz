// GameState.js
export class GameState {
    constructor(constants) {
        this.constants = constants;
        this.score = 0;
        this.questionCounter = 0;
        this.availableQuestions = [];
        this.allQuestions = [];
        this.savedQuestion = [];
        this.currentQuestion = {};
    }

    loadFromCache() {
        this.score = parseInt(localStorage.getItem(this.constants.SCORE)) || 0;
        this.availableQuestions = JSON.parse(localStorage.getItem(this.constants.AVAILABLE_QUESTIONS)) || [];
        this.allQuestions = JSON.parse(localStorage.getItem(this.constants.ALL_QUESTIONS)) || [];
        this.savedQuestion = JSON.parse(localStorage.getItem(this.constants.SAVED_QUESTION)) || null;
    }

    saveToCache() {
        localStorage.setItem(this.constants.SCORE, this.score);
        localStorage.setItem(this.constants.AVAILABLE_QUESTIONS, JSON.stringify(this.availableQuestions));
        localStorage.setItem(this.constants.ALL_QUESTIONS, JSON.stringify(this.allQuestions));
        localStorage.setItem(this.constants.SAVED_QUESTION, JSON.stringify(this.currentQuestion));
    }

    hasValidData() {
        return Array.isArray(this.allQuestions) && this.allQuestions.length > 0;
    }

    reset() {
        this.score = 0;
        this.questionCounter = 0;
        this.availableQuestions = [...this.allQuestions];
        this.savedQuestion = [];
    }
    
}
