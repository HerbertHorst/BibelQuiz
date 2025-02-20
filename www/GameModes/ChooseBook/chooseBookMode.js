//CONSTANTS
const JSON_DATA = "jsonFileString";
const bookHtmlBtns = Array.from(document.getElementsByClassName('bookSelectionbtn'));



//CACHE CONSTANTS CHANGED
import { QuizModeBase } from './../Base/QuizModeBase.js';
import { MODE_ChooseBook_ALL_QUESTIONS, MODE_ChooseBook_SCORE, MODE_ChooseBook_AVAILABLE_QUESTIONS, MODE_ChooseBook_RECENT_SCORE,  CORRECT_BONUS,CORRECT_TIPP_BONUS,WAIT_TIMEOUT } from './../Base/constants.js';

export class QuizModeChooseBook extends QuizModeBase {
  constructor() {
    console.log("AAAAAAAAAAAAAAAAAAA")
    console.log(bookHtmlBtns)
    super({
        ALL_QUESTIONS: MODE_ChooseBook_ALL_QUESTIONS,
        SCORE: MODE_ChooseBook_SCORE,
        AVAILABLE_QUESTIONS: MODE_ChooseBook_AVAILABLE_QUESTIONS,
        RECENT_SCORE: MODE_ChooseBook_RECENT_SCORE,
        CORRECT_BONUS: CORRECT_BONUS,
        CORRECT_TIPP_BONUS: CORRECT_TIPP_BONUS,
        WAIT_TIMEOUT: WAIT_TIMEOUT,
    });
    }
}

//#region click EventListener for each book button
bookHtmlBtns.forEach((bookBtn) => {
  bookBtn.addEventListener('click', (e) => {      
    const selectedBookBtn = e.target;
    const selectedBookName = selectedBookBtn.dataset['bookname'];
    const jsonFileAsString = localStorage.getItem(JSON_DATA);      
    const parsedJson = JSON.parse(jsonFileAsString);

    // To access questions from a specific book
    let choosenBookQuestions = parsedJson[selectedBookName];
    console.log(choosenBookQuestions)
    localStorage.setItem(MODE_ChooseBook_ALL_QUESTIONS,  JSON.stringify(choosenBookQuestions));
    console.log(localStorage.getItem(MODE_ChooseBook_ALL_QUESTIONS))

    const quizMode = new QuizModeChooseBook();
    quizMode.startNewFromCache();
  });
});