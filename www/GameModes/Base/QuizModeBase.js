// QuizModeBase.js
import { GameState } from './GameState.js';
import { DifficultyStore } from './DifficultyStore.js';
import { REPEAT_WRONG_ANSWERS } from './constants.js';

export class QuizModeBase {
    constructor(constants) {
        this.questionText = document.getElementById('question');
        this.choices = Array.from(document.getElementsByClassName('choice-text'));
        this.questionIntro = document.getElementById('questionIntro');
        this.tipp = document.getElementById('tippText');
        this.tippContainer = document.getElementById('tippContainer');
        this.progressText = document.getElementById('progressText');
        this.scoreText = document.getElementById('score');
        this.errorText = document.getElementById('errorText');
        this.progressBarFull = document.getElementById('progressBarFull');
        this.constants = constants;
        this.acceptingAnswers = false;
        this.rightAnswer = [];

        // Option "Falsche Fragen wiederholen" (siehe Einstellungen). Beim Spielstart
        // einmalig gelesen; bei aktiver Option wandern falsch beantwortete Fragen
        // zurück in den Pool und der Fortschrittszähler pausiert für eine Frage.
        this.repeatWrong = localStorage.getItem(REPEAT_WRONG_ANSWERS) === 'true';
        this.skipCounterIncrement = false;

        // Review (Zurück-Button): genau eine Frage zurück ansehen, erneut -> zurück zur aktuellen.
        this.history = [];        // beantwortete Fragen dieser Runde
        this.reviewing = false;   // true = vorherige Frage wird angesehen
        this.liveBoard = null;    // gemerkter Live-Spielstand während des Reviews
        this.pendingAdvance = false; // Auto-Weiter, das während des Reviews wartet
        this.answerCleanup = null;   // Aufräum-Infos der zuletzt beantworteten Frage
        this.reviewToggleBtn = document.getElementById('reviewToggle');

        this.gameState = new GameState(constants);
        this.gameState.loadFromCache();

        this.initializeChoiceListeners();
        this.initializeReadCacheButtonListeners();
        this.initializeTippClickListener();
        this.initializeReviewListeners();
        this.updateReviewButtons();
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
        if (e.target.tagName.toLowerCase() === 'a') {
            return;
        }
        if (this.tipp.style.visibility === "visible") {
            return;
        }
        this.tipp.style.visibility = "visible";
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
                const wasCorrect = classToApply === 'correct';
                const tippWasVisible = this.tipp.style.visibility === "visible";
                let rightAnswerHTMLChoiceBox;

                // Lernfortschritt verbuchen: richtig senkt, falsch hebt die Schwierigkeit.
                DifficultyStore.record(this.gameState.currentQuestion, wasCorrect);

                if (wasCorrect) {
                    if (tippWasVisible) {
                        this.incrementScore(this.constants.CORRECT_TIPP_BONUS);
                    } else {
                        this.incrementScore(this.constants.CORRECT_BONUS);
                    }
                } else {
                    // Option "Falsche Fragen wiederholen": Frage zurück in den Pool,
                    // Zähler pausiert für die nächste Frage (siehe getNewQuestion).
                    if (this.repeatWrong && this.gameState.currentQuestion) {
                        this.gameState.availableQuestions.push(this.gameState.currentQuestion);
                        this.skipCounterIncrement = true;
                    }
                    // markiere die richtige Antwort gelb, wenn der Nutzer falsch lag.
                    this.choices.forEach((choice) => {
                        const number = choice.dataset['number'];
                        if (this.rightAnswer.some(answer => answer === parseInt(number))) {
                            rightAnswerHTMLChoiceBox = choice;
                            rightAnswerHTMLChoiceBox.classList.add('tipp');
                        }
                    });
                }
                this.tipp.style.visibility = "visible"; // Bibelstelle vor dem Weiterspringen zeigen
                selectedChoice.parentElement.classList.add(classToApply);

                // Frage für den Zurück-Button festhalten (Anzeige-Reihenfolge + Auswahl).
                this.recordHistory(selectedAnswer, classToApply === 'correct');
                this.answerCleanup = {
                    box: selectedChoice.parentElement,
                    classToApply,
                    rightBox: rightAnswerHTMLChoiceBox,
                };
                this.updateReviewButtons();

                setTimeout(() => {
                    this.advanceAfterAnswer();
                }, this.constants.WAIT_TIMEOUT);
            });
        });
    }
    //#endregion

    // Nach Ablauf des Timeouts zur nächsten Frage springen – außer der Nutzer
    // schaut gerade eine vorherige Frage an (Review): dann nachholen beim Verlassen.
    advanceAfterAnswer() {
        if (this.reviewing) {
            this.pendingAdvance = true;
            return;
        }
        const c = this.answerCleanup;
        if (c) {
            c.box.classList.remove(c.classToApply);
            if (c.classToApply === 'incorrect' && c.rightBox) {
                c.rightBox.classList.remove('tipp');
            }
            this.answerCleanup = null;
        }
        this.tipp.style.visibility = "hidden";
        this.getNewQuestion();
    }

    //#endregion

    //#region Review (Zurück-Button)
    initializeReviewListeners() {
        if (this.reviewToggleBtn) {
            this.reviewToggleBtn.addEventListener('click', this.toggleReview.bind(this));
        }
    }

    // Hält die gerade beantwortete Frage samt angezeigter Antwortreihenfolge fest.
    recordHistory(selectedAnswer, wasCorrect) {
        this.history.push({
            question: { ...this.gameState.currentQuestion },
            intro: this.questionIntro.innerHTML,
            displayedChoices: this.choices.map((c) => c.innerHTML),
            correctSlots: [...this.rightAnswer],
            selectedSlot: parseInt(selectedAnswer),
            wasCorrect,
        });
    }

    captureBoard() {
        return {
            intro: this.questionIntro.innerHTML,
            question: this.questionText.innerHTML,
            choices: this.choices.map((c) => c.innerHTML),
            tipHTML: this.tipp.innerHTML,
            tipVisibility: this.tipp.style.visibility,
            accepting: this.acceptingAnswers,
        };
    }

    restoreBoard(board) {
        if (!board) return;
        this.questionIntro.innerHTML = board.intro;
        this.questionText.innerHTML = board.question;
        this.choices.forEach((choice, i) => {
            choice.innerHTML = board.choices[i];
            choice.parentElement.classList.remove('correct', 'incorrect', 'tipp');
        });
        this.tipp.innerHTML = board.tipHTML;
        this.tipp.style.visibility = board.tipVisibility;
        this.acceptingAnswers = board.accepting;
    }

    // Stellt eine bereits beantwortete Frage schreibgeschützt dar.
    renderReview(entry) {
        this.acceptingAnswers = false;
        this.questionIntro.innerHTML = entry.intro;
        this.addGooseFeet(entry.question.question);
        this.choices.forEach((choice, i) => {
            choice.innerHTML = entry.displayedChoices[i];
            const slot = i + 1;
            const box = choice.parentElement;
            box.classList.remove('correct', 'incorrect', 'tipp');
            if (entry.correctSlots.includes(slot)) {
                box.classList.add(slot === entry.selectedSlot && entry.wasCorrect ? 'correct' : 'tipp');
            } else if (slot === entry.selectedSlot) {
                box.classList.add('incorrect');
            }
        });
        this.getTippTextAsLink(entry.question);
        this.tipp.style.visibility = "visible";
    }

    // Ein Klick: vorherige (zuletzt beantwortete) Frage ansehen.
    // Erneuter Klick: zurück zur aktuellen Frage.
    toggleReview() {
        if (!this.reviewing) {
            if (this.history.length === 0) return;
            this.liveBoard = this.captureBoard(); // aktuellen Live-Stand merken
            this.reviewing = true;
            this.renderReview(this.history[this.history.length - 1]);
        } else {
            this.reviewing = false;
            if (this.pendingAdvance) {
                this.pendingAdvance = false;
                this.advanceAfterAnswer();
            } else {
                this.restoreBoard(this.liveBoard);
            }
            this.liveBoard = null;
        }
        this.updateReviewButtons();
    }

    updateReviewButtons() {
        if (!this.reviewToggleBtn) return;
        const visible = this.reviewing || this.history.length > 0;
        this.reviewToggleBtn.style.visibility = visible ? 'visible' : 'hidden';
        this.reviewToggleBtn.textContent = this.reviewing ? 'Weiter ▶' : '◀ Zurück';
    }
    //#endregion

    //#region Start Game
    continueFromCache(e) {
        if (this.gameState.hasValidData()) {
            this.hideLoadFilePart();
            this.resumeGame();
        } else {
            this.errorText.innerText = "No valid data found. Please select your questions.json file again.";
        }
    }

    startNewFromCache(e) {
        console.log("startNewFromCache called");
        this.history = [];
        this.reviewing = false;
        this.gameState.reset();
        this.hideLoadFilePart();
        this.scoreText.innerText = this.gameState.score;
        this.updateScoreVisibility();
        this.getNewQuestion();
        document.getElementById("game").style.display = "flex";
    }

    // Startet eine frische Runde mit der aktuell gesetzten gameState.selection.
    // Anders als startNewFromCache() blendet diese Methode den (jetzt
    // ungenutzten) Datei-Lade-Bereich explizit aus, statt ihn zu togglen –
    // damit der Bücher-Drawer beliebig oft neu starten kann.
    startFreshRound() {
        this.history = [];
        this.reviewing = false;
        this.gameState.reset();
        const loadPart = document.getElementById("loadFileFromDisk");
        if (loadPart) loadPart.style.display = "none";
        this.scoreText.innerText = this.gameState.score;
        this.updateScoreVisibility();
        document.getElementById("game").style.display = "flex";
        this.getNewQuestion();
    }

    hideLoadFilePart() {
        const x = document.getElementById("loadFileFromDisk");
        if (x.style.display === "none") {
            x.style.display = "flex";
        } else {
            x.style.display = "none";
        }
    }

    resumeGame = () => {
        this.history = [];
        this.reviewing = false;
        this.scoreText.innerText = this.gameState.score;
        this.updateScoreVisibility();
        this.getNewQuestion();
        document.getElementById("game").style.display = "flex";
    };

    //#endregion

    getNewQuestion() {
        if (this.gameState.savedQuestion !== null && this.gameState.savedQuestion.question) {
            console.log("Saved question found:", this.gameState.savedQuestion.question);
            this.gameState.currentQuestion = this.gameState.savedQuestion;
            this.addGooseFeet(this.gameState.currentQuestion.question);
            // gameState.savedQuestion wird nur beim Spielstart aus dem Cache gesetzt.
            this.gameState.savedQuestion = null;
        } else {
            if (this.gameState.availableQuestions.length === 0) {
                localStorage.setItem(this.constants.RECENT_SCORE, this.gameState.score);
                this.gameState.reset();
                return window.location.assign('../../Menus/end.html');
            }
            const questionIndex = this.setNewRandomQuestion();
            this.gameState.availableQuestions.splice(questionIndex, 1);
            // Im Wiederholungs-Modus zählt die Frage nach einer falschen Antwort
            // nicht erneut hoch – so bleibt der Fortschritt trotz Re-Queue stimmig.
            if (!this.skipCounterIncrement) {
                this.gameState.questionCounter++;
            }
            this.skipCounterIncrement = false;
        }
        this.questionIntro.innerHTML = this.gameState.getIntroTextForCategory();
        this.updateProgressBar();
        this.shuffleAnswers();
        this.getTippTextAsLink();
        this.acceptingAnswers = true;
        this.reviewing = false;
        this.updateReviewButtons();
        this.gameState.saveToCache();
    }

    getTippTextAsLink(question = this.gameState.currentQuestion) {
        this.tipp.innerHTML = "";
        const tippSource = question && question.biblePassageTipp;
        if (!tippSource) return;

        // Trenne die verschiedenen Bibelstellen, falls mehr als eine angegeben ist.
        const passages = tippSource.split("; ");
        passages.forEach(passage => {
            const formattedPassage = passage.replace(" ", "");
            const url = `https://www.bibleserver.com/ELB/${encodeURIComponent(formattedPassage)}`;

            const link = document.createElement("a");
            link.href = url;
            link.innerText = passage;
            link.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(url, "_blank");
            });
            this.tipp.appendChild(link);
        });
    }

    shuffleAnswers() {
        this.rightAnswer = [];
        let answers = [1, 2, 3, 4];
        for (let randomIndex, temp, currentIndex = answers.length; currentIndex;
            randomIndex = parseInt(Math.random() * currentIndex),
            temp = answers[--currentIndex],
            answers[currentIndex] = answers[randomIndex],
            answers[randomIndex] = temp);

        for (let i = 0; i < this.choices.length; i++) {
            const choice = this.choices[i];
            if (answers[i] === this.gameState.currentQuestion.answer) {
                this.rightAnswer.push(i + 1);
            }
            choice.innerHTML = this.gameState.currentQuestion['choice' + answers[i]];
        }
    }

    setNewRandomQuestion() {
        const questionIndex = Math.floor(Math.random() * this.gameState.availableQuestions.length);
        this.gameState.currentQuestion = this.gameState.availableQuestions[questionIndex];
        this.addGooseFeet(this.gameState.currentQuestion.question);
        return questionIndex;
    }

    //#region UI functions
    addGooseFeet(questionText) {
        if (!questionText.startsWith('"')) {
            this.questionText.innerHTML = `"${questionText}"`;
        } else {
            this.questionText.innerHTML = questionText;
        }
    }

    incrementScore(num) {
        this.gameState.score += num;
        this.scoreText.innerText = this.gameState.score;
    }

    updateProgressBar() {
        this.progressText.innerText = `Question ${this.gameState.questionCounter}/${this.gameState.maxQuestionCounter}`;
        // Im Wiederholungs-Modus kann der Pool zeitweise über die Ausgangsmenge
        // wachsen; deshalb den Balken bei 100 % deckeln.
        const pct = this.gameState.maxQuestionCounter > 0
            ? Math.min((this.gameState.questionCounter / this.gameState.maxQuestionCounter) * 100, 100)
            : 0;
        this.progressBarFull.style.width = `${pct}%`;
    }

    // Blendet die Score-Anzeige aus, solange "Falsche Fragen wiederholen" aktiv ist
    // (im Übungsmodus zählt das Lernen, nicht der Punktestand).
    updateScoreVisibility() {
        const scoreContainer = this.scoreText ? this.scoreText.parentElement : null;
        if (!scoreContainer) return;
        scoreContainer.style.display = this.repeatWrong ? 'none' : '';
    }
    //#endregion
}
