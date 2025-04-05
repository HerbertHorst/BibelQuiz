// QuizModeBase.js
import { GameState } from './GameState.js';

export class QuizModeBase {
    constructor(constants) {
        this.questionText = document.getElementById('question');
        this.choices = Array.from(document.getElementsByClassName('choice-text'));
        this.tipp = document.getElementById('tippText');
        this.tippContainer = document.getElementById('tippContainer');
        this.progressText = document.getElementById('progressText');
        this.scoreText = document.getElementById('score');
        this.errorText = document.getElementById('errorText');
        this.progressBarFull = document.getElementById('progressBarFull');
        this.constants = constants;
        this.acceptingAnswers = false;
        this.rightAnswer = [];
        
        this.gameState = new GameState(constants);
        this.gameState.loadFromCache();

        this.initializeChoiceListeners();

        // Initialize event listeners for buttons
        this.initializeReadCacheButtonListeners();

        // Call method to handle Tipp container click events
        this.initializeTippClickListener();
    }

    //#region Buttons

    // Event Listener für Tipp-Container
    initializeTippClickListener() {
        this.tippContainer.addEventListener('click', this.handleContainerClick.bind(this));

        // Alle Links innerhalb des Tipp-Containers vor Klick-Weiterleitung schützen
        document.querySelectorAll("#tippText a").forEach(link => {
            link.addEventListener("click", (e) => {
                e.stopPropagation(); // Verhindert, dass das Klick-Event zum Container durchgeleitet wird
            });
        });
    }

    // Event Listener für Klick-Event im Tipp-Container
    handleContainerClick(e) {
        // Wenn der Klick auf einen Link war, tue nichts
        if (e.target.tagName.toLowerCase() === 'a') {
            return;
        }
        // Wenn der Tipp-Text schon sichtbar ist, mache nichts mehr
        if (this.tipp.style.visibility === "visible") {
            return;
        }

        // Sonst den Tipp sichtbar machen
        this.tipp.style.visibility = "visible";

        // Entferne den Click-Event des Containers nach dem ersten Klick
        this.tippContainer.removeEventListener('click', this.handleContainerClick.bind(this));
    }

    // Funktion zum Initialisieren der ReadCache Button Event Listener
    initializeReadCacheButtonListeners() {
        const btnContinue = document.getElementById('continueWithCache');
        const btnStartNew = document.getElementById('startNewFromCache'); 
        if (btnContinue && btnStartNew) {
            btnContinue.addEventListener('click', this.continueFromCache.bind(this));
            btnStartNew.addEventListener('click', this.startNewFromCache.bind(this));
        }
    }

    //#region click EventListener for each choice field
    initializeChoiceListeners() {
        this.choices.forEach((choice) => {
            choice.addEventListener('click', (e) => {
                if (!this.acceptingAnswers) return;
                this.acceptingAnswers = false;
                const selectedChoice = e.target;
                const selectedAnswer = selectedChoice.dataset['number'];
                const classToApply = this.rightAnswer.some(answer => answer === parseInt(selectedAnswer)) ? 'correct' : 'incorrect';
                let rightAnswerHTMLChoiceBox;
                if (classToApply === 'correct') {
                    if(this.tipp.style.visibility === "visible")
                    {
                        this.incrementScore(this.constants.CORRECT_TIPP_BONUS);
                    }
                    else{   
                        this.incrementScore(this.constants.CORRECT_BONUS);              
                    }                    
                }
                else
                {
                    //mark yellow the answer thats right when the user is wrong.          
                    this.choices.forEach((choice) => {
                        const number = choice.dataset['number'];
                        if(this.rightAnswer.some(answer => answer === parseInt(number))){
                            rightAnswerHTMLChoiceBox = choice;
                            rightAnswerHTMLChoiceBox.classList.add('tipp');
                        }
                    });
                }                
                this.tipp.style.visibility = "visible"; // show Bibel passage before continuing to the next question
                selectedChoice.parentElement.classList.add(classToApply);
        
                setTimeout(() => {
                selectedChoice.parentElement.classList.remove(classToApply);
                
                if (classToApply === 'incorrect') {
                    //remove the yellow background for the next question
                    rightAnswerHTMLChoiceBox.classList.remove('tipp');
                }
                this.tipp.style.visibility = "hidden";
        
                this.getNewQuestion();
                }, this.constants.WAIT_TIMEOUT);
            });
        });
    }
    //#endregion

    //#endregion

    //#region Start Game
    continueFromCache(e) {        
        if (this.gameState.hasValidData()) {        
            this.hideLoadFilePart();
            this.resumeGame();
        } else {
            this.errorText.innerText = "Could not get data from cache. <br> Please select your questions.json file manually.";
        }
    }

    startNewFromCache(e) {
        if (this.gameState.hasValidData()) {           
            this.hideLoadFilePart();
            this.startGame();
        } else {
            this.errorText.innerText = "Could not get data from cache. Please select your file manually.";
        }
    }

    hideLoadFilePart() {
        const x = document.getElementById("loadFileFromDisk");
        if (x.style.display === "none") {
            x.style.display = "flex";
        } else {
            x.style.display = "none";
        }
    }

    startGame = () => {
        this.gameState.questionCounter = 0;
        this.gameState.score = 0;
        this.gameState.availableQuestions = [...this.gameState.allQuestions];
        localStorage.setItem(this.constants.ALL_QUESTIONS, JSON.stringify(this.gameState.availableQuestions));
        this.getNewQuestion();
        document.getElementById("game").style.display = "flex";
        // loader.classList.add('hidden');
      };
    resumeGame = () => {
        this.gameState.questionCounter = this.gameState.allQuestions.length - this.gameState.availableQuestions.length;
        this.scoreText.innerText = this.gameState.score;
        this.getNewQuestion();
        document.getElementById("game").style.display = "flex";
        // loader.classList.add('hidden');
    };

    //#endregion

    getNewQuestion() {
        if (this.gameState.savedQuestion !== null && this.gameState.savedQuestion.question)
        {
            console.log("Saved question found:", this.gameState.savedQuestion.question);
            this.gameState.currentQuestion = this.gameState.savedQuestion
            this.addGooseFeet(this.gameState.currentQuestion.question);
            // gameState.savedQuestion is only set from cache while starting the game. Because of that this works even when saveToCache() writes every question in the cache. 
            this.gameState.savedQuestion = null;
        }
        else{
            if (this.gameState.availableQuestions.length === 0) {
                localStorage.setItem(this.constants.RECENT_SCORE, this.gameState.score);
                return window.location.assign('../../Menus/end.html');
            }
            const questionIndex = this.setNewRandomQuestion();
            this.gameState.availableQuestions.splice(questionIndex, 1);
        }
        this.updateProgressBar();  
        this.shuffleAnswers();
        this.getTippTextAsLink();    
        this.acceptingAnswers = true;
        this.gameState.saveToCache();
        console.log("NOCHMAL WAS DA STEHT!: ", this.gameState.savedQuestion);
    }

    async getTippTextAsLink(){
        // Trenne die verschiedenen Bibelstellen / Split the Text for when more than 1 bibel position is in the Tipp. 
        const passages = this.gameState.currentQuestion.biblePassageTipp.split("; ");
    
        // Leere den Container zuerst / Clear Text in container
        this.tipp.innerHTML = "";
        
        passages.forEach(passage => {
            const formattedPassage = passage.replace(" ", "");
            const url = `https://www.bibleserver.com/ELB/${encodeURIComponent(formattedPassage)}`;
        
            // Erstelle das Link-Element
            const link = document.createElement("a");
            link.href = url;
            link.innerText = passage;
            // link.style.marginRight = "5px"; // Optional für Abstand zwischen Links
            
            // In-App-Browser beim Klicken öffnen
            link.addEventListener("click", (e) => {
                e.preventDefault(); // Standardverhalten verhindern
                window.open(url, "_blank"); // Öffnet den Link im Standard-Browser
            });

            // Füge den Link in den Container ein
            this.tipp.appendChild(link);
        });
    }

    incrementScore(num) {
        this.gameState.score += num;
        this.scoreText.innerText = this.gameState.score;
    }

    shuffleAnswers() {
        this.rightAnswer = [];
        let answers = [1, 2, 3, 4];
        // randomIndex is used to store a randomly generated index within the array
        // temp is used to temporarily store the value of the current element while swapping it with another element
        // currentIndex is used as a counter for the loop, it starts at the last index of the array and decrements on every iteration.
        for (let randomIndex, temp, currentIndex = answers.length; currentIndex; 
            randomIndex = parseInt(Math.random() * currentIndex),
            temp = answers[--currentIndex],
            answers[currentIndex] = answers[randomIndex],
            answers[randomIndex] = temp);

        for (let i = 0; i < this.choices.length; i++) {
            const choice = this.choices[i];
            if (answers[i] === this.gameState.currentQuestion.answer) {
                //fill 'rightanswer' with all the answers that are allowed
                this.rightAnswer.push(i + 1);                
                console.log(this.rightAnswer);
            }
            choice.innerHTML = this.gameState.currentQuestion['choice' + answers[i]];
        }
    }

    updateProgressBar() {
        this.gameState.questionCounter++;
        this.progressText.innerText = `Question ${this.gameState.questionCounter}/${this.gameState.allQuestions.length}`;
        this.progressBarFull.style.width = `${(this.gameState.questionCounter / this.gameState.allQuestions.length) * 100}%`;
    }

    setNewRandomQuestion() {
        const questionIndex = Math.floor(Math.random() * this.gameState.availableQuestions.length);
        this.gameState.currentQuestion = this.gameState.availableQuestions[questionIndex];
        this.addGooseFeet(this.gameState.currentQuestion.question);
        return questionIndex;
    }

    //#region UI functions
    addGooseFeet(questionText) {
        //Check for "" and if not present add them for the UI text. 
        if (!questionText.startsWith('"')) {
            this.questionText.innerHTML = `"${questionText}"`;
        } else {
            this.questionText.innerHTML = questionText;
        }
    }
    //#endregion
}