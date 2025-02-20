
//CACHE CONSTANTS
import { MODE_ENDLESS_ALL_QUESTIONS, MODE_ChooseBook_ALL_QUESTIONS } from './../GameModes/Base/constants.js';
const JSON_DATA = "jsonFileString";
const messageText = document.getElementById('messageText');

//#region File Input Button 
  //FileInput Button
  document.getElementById('file-input').addEventListener('change', readSingleFile, false);

  //read a file from the disk
  function readSingleFile(e) {
    var file = e.target.files[0];
    if (!file) {
      return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
      var contents = e.target.result;
      const jsonFileContent = contents;
      getQuestionsFromJson(jsonFileContent)
    };
    reader.readAsText(file);
    messageText.innerText = "Loaded Json successfully.";
  }
  
  function getQuestionsFromJson(jsonFileContent){
    const parsedJson = JSON.parse(jsonFileContent);
    // To access all questions
    const loadedQuestions = Object.values(parsedJson).flatMap(bookQuestions => bookQuestions);
    const allQuestions = loadedQuestions;

    localStorage.setItem(MODE_ENDLESS_ALL_QUESTIONS, JSON.stringify(allQuestions));
    localStorage.setItem(MODE_ChooseBook_ALL_QUESTIONS, JSON.stringify(allQuestions));
    localStorage.setItem(JSON_DATA, jsonFileContent);
  }


//#endregion File Input
