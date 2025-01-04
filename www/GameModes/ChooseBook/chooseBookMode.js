const question = document.getElementById('question');
const choices = Array.from(document.getElementsByClassName('choice-text')); //This is an Array with the HTML <p> elements! 
const bookHtmlBtns = Array.from(document.getElementsByClassName('bookSelectionbtn'));
const tipp = document.getElementById('tippText');
const tippContainer = document.getElementById('tippContainer');
const progressText = document.getElementById('progressText');
const scoreText = document.getElementById('score');
const errorText = document.getElementById('errorText');
const progressBarFull = document.getElementById('progressBarFull');
let currentQuestion = {};
let acceptingAnswers = false;
let score = 0;
let questionCounter = 0;
let availableQuestions = []; //list with only the NOT answered questions that are left 
let allQuestions = []; //list with ALL questions
let choosenBookQuestions = []; //list with ALL questions from the bookname that was clicked on
let jsonFileContent = "Not filled File";
let rightAnswer = [];

//CONSTANTS
let CORRECT_BONUS = 1;
const CORRECT_TIPP_BONUS = 0.5;
const MAX_QUESTIONS = allQuestions.lengt;
const WAIT_TIMEOUT = 1500;
const JSON_DATA = "jsonFileString";

//CACHE CONSTANTS CHANGED
import { MODE_ChooseBook_ALL_QUESTIONS, MODE_ChooseBook_SCORE, MODE_ChooseBook_AVAILABLE_QUESTIONS, MODE_ChooseBook_RECENT_SCORE } from './../Base/constants.js';
const ALL_QUESTIONS = MODE_ChooseBook_ALL_QUESTIONS;
const SCORE = MODE_ChooseBook_SCORE;
const AVAILABLE_QUESTIONS = MODE_ChooseBook_AVAILABLE_QUESTIONS;
const RECENT_SCORE = MODE_ChooseBook_RECENT_SCORE;

//#region CopyPasteBase

startGame = () => {
  questionCounter = 0;
  score = 0;
  availableQuestions = [...allQuestions];
  localStorage.setItem(ALL_QUESTIONS, JSON.stringify(availableQuestions));
  getNewQuestion();
  game.classList.remove('hidden');
  // loader.classList.add('hidden');
};

resumeGame = () => {
  questionCounter = allQuestions.length - availableQuestions. length;
  score = parseFloat(localStorage.getItem(SCORE));
  scoreText.innerText = score;
  availableQuestions;
  getNewQuestion();
  game.classList.remove('hidden');
  // loader.classList.add('hidden');
};

incrementScore = (num) => {
  score += num;
  scoreText.innerText = score;
};

function setNewRandomQuestion(){
  const questionIndex = Math.floor(Math.random() * availableQuestions.length);
  currentQuestion = availableQuestions[questionIndex];
  question.innerHTML = currentQuestion.question;
  return questionIndex;
}

function shuffleAnswers() {
  rightAnswer = [];
  let answers = [1,2,3,4]
  // randomIndex is used to store a randomly generated index within the array
  // temp is used to temporarily store the value of the current element while swapping it with another element
  // currentIndex is used as a counter for the loop, it starts at the last index of the array and decrements on every iteration.
  for(var randomIndex, temp, currentIndex = answers.length; currentIndex;
      randomIndex = parseInt(Math.random() * currentIndex), 
      temp = answers[--currentIndex], 
      answers[currentIndex] = answers[randomIndex], 
      answers[randomIndex] = temp);
  
  for(let i = 0; i < choices.length; i++) {
    const choice = choices[i];

    if(answers[i]==currentQuestion.answer)
    {//fill right answers with all the answers that are allowed
      rightAnswer.push(i+1);
      console.log(rightAnswer);
    }
    choice.innerHTML = currentQuestion['choice' + answers[i]];
  }

}

//#region click EventListener for each choice field
choices.forEach((choice) => {
  choice.addEventListener('click', (e) => {
      if (!acceptingAnswers) return;
      acceptingAnswers = false;
      const selectedChoice = e.target;
      const selectedAnswer = selectedChoice.dataset['number'];
      const classToApply = rightAnswer.some(answer => answer === parseInt(selectedAnswer)) ? 'correct' : 'incorrect';
      let tippContainer = document.getElementById("tippText");
      let rightAnswerHTMLChoiceBox;
      if (classToApply === 'correct') {
        if(tippContainer.style.visibility === "visible")
          {
            incrementScore(CORRECT_TIPP_BONUS);
          }
          else{   
            incrementScore(CORRECT_BONUS);              
          }
      }
      else
      {
        //mark yellow the answer thats right when the user is wrong.          
        choices.forEach((choice) => {
          const number = choice.dataset['number'];
          if(rightAnswer.some(answer => answer === parseInt(number))){
              rightAnswerHTMLChoiceBox = choice;
              rightAnswerHTMLChoiceBox.classList.add('tipp');
          }
        });
      }
      
      selectedChoice.parentElement.classList.add(classToApply);

      setTimeout(() => {
        selectedChoice.parentElement.classList.remove(classToApply);
        
        if (classToApply === 'incorrect') {
          //remove the yellow background for the next question
          rightAnswerHTMLChoiceBox.classList.remove('tipp');
        }
        tippContainer.style.visibility = "hidden";

        getNewQuestion();
      }, WAIT_TIMEOUT);
  });
});
//#endregion

function hideLoadFilePart() {
  var x = document.getElementById("loadFileFromDisk");
  if (x.style.display === "none") {
    x.style.display = "block";
  } else {
    x.style.display = "none";
  }
}

//#region ReadCache Button
  //Continue from Cache Button
  document.getElementById('continueWithCache').addEventListener('click', (e) => {
    if(checkForCacheValues()){
      // Retrieve quiz data from local storage
      availableQuestions = JSON.parse(localStorage.getItem(AVAILABLE_QUESTIONS));
      allQuestions = JSON.parse(localStorage.getItem(ALL_QUESTIONS));
      console.log(availableQuestions)
      if(availableQuestions !== null && availableQuestions.length > 0){
        hideLoadFilePart();
        resumeGame();
      }  
    }
    else{
      errorText.innerText = "Could not get data from cache. <br> Pls. select your questions.json file manually.";
    }

  });
    
  document.getElementById('startNewFromCache').addEventListener('click', (e) => {
    if(checkForCacheValues()){
      // Retrieve quiz data from local storage
      allQuestions = JSON.parse(localStorage.getItem(ALL_QUESTIONS));
      // questions = JSON.parse(localStorage.getItem("questions"));
      if(allQuestions !== null && allQuestions.length > 0){
        hideLoadFilePart();
        startGame();
      }  
    }
    else{
      errorText.innerText = "Could not get data from cache. Pls. select your file manually.";
    }      
  });

  function checkForCacheValues(){
    allQuestions = JSON.parse(localStorage.getItem(ALL_QUESTIONS));
    availableQuestions = JSON.parse(localStorage.getItem(AVAILABLE_QUESTIONS));
    score = parseInt(localStorage.getItem(SCORE));
    console.log(availableQuestions)
    console.log(allQuestions)
    console.log(score)
    if(allQuestions !== null && availableQuestions !== null && score !== NaN){
      return true;
    }
    else{   
      return false;
    }
  }

//#endregion


//#region hideAndShowBibelPhraseTipp eventListener
  tippContainer.addEventListener('click', (e) => {
    var tippContainer = document.getElementById("tippText");
    tippContainer.style.visibility = "visible";
  });
  //#endregion

  function getNewQuestion () {
    endQuizz();

    localStorage.setItem(AVAILABLE_QUESTIONS, JSON.stringify(availableQuestions));
    localStorage.setItem(SCORE, score);   

    updateProgressBar();

    let questionIndex = setNewRandomQuestion();

    //set choices Button texts with shuffled Answers
    shuffleAnswers();

    //set tipp text
    tipp.innerHTML = currentQuestion.biblePassageTipp;

    //remove question from availableQuestions
    availableQuestions.splice(questionIndex, 1);
    acceptingAnswers = true;
  };
//#endregion


//#region Slightly changed code

  function updateProgressBar(){
    questionCounter++;
    progressText.innerText = `Question ${questionCounter}/${allQuestions.length}`;
    //Update the progress bar
    progressBarFull.style.width = `${(questionCounter / MAX_QUESTIONS) * 100}%`;
  }

  function endQuizz(){
    if (availableQuestions.length === 0) {
      localStorage.setItem(RECENT_SCORE, score);
      //go to the end page
      return window.location.assign('../../end.html');
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
      choosenBookQuestions = parsedJson[selectedBookName];
      allQuestions = choosenBookQuestions;
      hideLoadFilePart();
      startGame();
    });
});
//#endregion


//#endregion
