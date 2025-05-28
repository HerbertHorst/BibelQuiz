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

        this.allZitateQuestions = [];
        this.allWoStehtQuestions = [];
    }
    setCategories(){
        var AT_QUESTIONS = [];
        var NT_QUESTIONS = [];
    }
//#region OldWorld
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
    
//#endregion
    

//#region newWorld
    /**
     * Loads questions from the new JSON format and separates them into categories.
     * @param {Object} jsonData - The parsed JSON data from newFormat.json.
     */
    loadQuestionsFromNewFormat(jsonData) {
        if (!jsonData) {
            console.error("No data provided for loading questions.");
            return;
        }

        // Clear existing questions
        this.allZitateQuestions = [];
        this.allWoStehtQuestions = [];

        // Process "Zitate" questions
        if (jsonData["Zitate_NT - v1.2"] || jsonData["Zitate_AT - v1.0"]) {
            const zitateCategories = { ...jsonData["Zitate_NT - v1.2"], ...jsonData["Zitate_AT - v1.0"] };
            for (const [category, questions] of Object.entries(zitateCategories)) {
                this.allZitateQuestions.push(...questions);
            }
        }

        // Process "Wo Steht" questions
        if (jsonData["Wo_Steht - v1.0"]) {
            for (const [category, questions] of Object.entries(jsonData["Wo_Steht - v1.0"])) {
                this.allWoStehtQuestions.push(...questions);
            }
        }

        // Combine all questions into a single array for general use
        this.allQuestions = [...this.allZitateQuestions, ...this.allWoStehtQuestions];
    }

    /**
     * Initializes the available questions for a specific category.
     * @param {string} category - The category to initialize ("Zitate" or "Wo Steht").
     */
    initializeCategory(category) {
        if (category === "Zitate") {
            this.availableQuestions = [...this.allZitateQuestions];
        } else if (category === "Wo Steht") {
            this.availableQuestions = [...this.allWoStehtQuestions];
        } else {
            console.error("Invalid category specified:", category);
        }
    }

    /**
     * Resets the game state for a specific category.
     * @param {string} category - The category to reset ("Zitate" or "Wo Steht").
     */
    resetCategory(category) {
        this.score = 0;
        this.questionCounter = 0;

        if (category === "Zitate") {
            this.availableQuestions = [...this.allZitateQuestions];
        } else if (category === "Wo Steht") {
            this.availableQuestions = [...this.allWoStehtQuestions];
        } else {
            console.error("Invalid category specified:", category);
        }

        this.savedQuestion = [];
    }

    /**
     * Checks if there are valid questions for a specific category.
     * @param {string} category - The category to check ("Zitate" or "Wo Steht").
     * @returns {boolean} - True if valid questions exist, false otherwise.
     */
    hasValidDataForCategory(category) {
        if (category === "Zitate") {
            return Array.isArray(this.allZitateQuestions) && this.allZitateQuestions.length > 0;
        } else if (category === "Wo Steht") {
            return Array.isArray(this.allWoStehtQuestions) && this.allWoStehtQuestions.length > 0;
        }
        return false;
    }
//#endregion
}
