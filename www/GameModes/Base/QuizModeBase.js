// QuizModeBase.js

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
        this.currentQuestion = {};
        this.acceptingAnswers = false;
        this.score = 1;
        this.questionCounter = 0;
        this.availableQuestions = [];
        this.allQuestions = [];
        this.jsonFileContent = "Not filled File";
        this.rightAnswer = [];

        this.initializeChoiceListeners();

        this.tippContainer.addEventListener('click', (e) => {
            this.tippContainer = document.getElementById("tippText");
            this.tippContainer.style.visibility = "visible";
          });

        //#region ReadCache Button
        document.getElementById('continueWithCache').addEventListener('click', this.continueFromCache.bind(this));
        document.getElementById('startNewFromCache').addEventListener('click', this.startNewFromCache.bind(this));
        //#endregion  
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


    checkForCacheValues(e){
        this.allQuestions = JSON.parse(localStorage.getItem(this.constants.ALL_QUESTIONS));
        this.availableQuestions = JSON.parse(localStorage.getItem(this.constants.AVAILABLE_QUESTIONS));
        this.score = parseInt(localStorage.getItem(this.constants.SCORE));
        console.log(this.constants.AVAILABLE_QUESTIONS)
        console.log(this.constants.ALL_QUESTIONS)
        console.log(this.score)
        // if(this.allQuestions !== null && this.availableQuestions !== null && this.score !== NaN){
        if(this.allQuestions !== null){
          return true;
        }
        else{   
          return false;
        }
      }

    continueFromCache(e) {        
        if (this.checkForCacheValues()) {
            this.availableQuestions = JSON.parse(localStorage.getItem(this.constants.AVAILABLE_QUESTIONS));
            this.allQuestions = JSON.parse(localStorage.getItem(this.constants.ALL_QUESTIONS));
            if (this.availableQuestions !== null && this.availableQuestions.length > 0) {
                this.hideLoadFilePart();
                this.resumeGame();
            }
        } else {
            this.errorText.innerText = "Could not get data from cache. <br> Please select your questions.json file manually.";
        }
    }
    startNewFromCache(e) {
        if (this.checkForCacheValues()) {                
            this.allQuestions = JSON.parse(localStorage.getItem(this.constants.ALL_QUESTIONS));
            if (this.allQuestions !== null && this.allQuestions.length > 0) {
                this.hideLoadFilePart();
                this.startGame();
            }
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
        this.questionCounter = 0;
        this.score = 0;
        this.availableQuestions = [...this.allQuestions];
        localStorage.setItem(this.constants.ALL_QUESTIONS, JSON.stringify(this.availableQuestions));
        this.getNewQuestion();
        document.getElementById("game").style.display = "flex";
        // loader.classList.add('hidden');
      };

    resumeGame = () => {
        this.questionCounter = this.allQuestions.length - this.availableQuestions.length;
        this.score = parseFloat(localStorage.getItem(this.constants.SCORE));
        this.scoreText.innerText = this.score;
        this.availableQuestions;
        this.getNewQuestion();
        document.getElementById("game").style.display = "flex";
        // loader.classList.add('hidden');
    };

    getNewQuestion() {
        if (this.availableQuestions.length === 0) {
            localStorage.setItem(this.constants.RECENT_SCORE, this.score);
            return window.location.assign('../../Menus/end.html');
        }
        localStorage.setItem(this.constants.AVAILABLE_QUESTIONS, JSON.stringify(this.availableQuestions));
        localStorage.setItem(this.constants.SCORE, this.score);   
    
        this.updateProgressBar();

        const questionIndex = this.setNewRandomQuestion();
        this.shuffleAnswers();
        this.tipp.innerHTML = this.currentQuestion.biblePassageTipp;

        this.availableQuestions.splice(questionIndex, 1);
        this.acceptingAnswers = true;
    }

    incrementScore(num) {
        this.score += num;
        this.scoreText.innerText = this.score;
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
            if (answers[i] === this.currentQuestion.answer) {
                //fill 'rightanswer' with all the answers that are allowed
                this.rightAnswer.push(i + 1);                
                console.log(this.rightAnswer);
            }
            choice.innerHTML = this.currentQuestion['choice' + answers[i]];
        }
    }

    updateProgressBar() {
        this.questionCounter++;
        this.progressText.innerText = `Question ${this.questionCounter}/${this.allQuestions.length}`;
        this.progressBarFull.style.width = `${(this.questionCounter / this.allQuestions.length) * 100}%`;
    }

    setNewRandomQuestion() {
        const questionIndex = Math.floor(Math.random() * this.availableQuestions.length);
        this.currentQuestion = this.availableQuestions[questionIndex];

        //Check for "" and if not present add them for the UI text. 
        if (!(this.currentQuestion.question.startsWith('"'))) {
            this.questionText.innerHTML = `"${this.currentQuestion.question}"`;
        } else {
            this.questionText.innerHTML = this.currentQuestion.question;
        }
        return questionIndex;
    }
}
