import * as XLSX from 'xlsx';

const workbook = XLSX.readFile('path/to/file.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

function loadFile(event) {
  const fileInput = event.target;
  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.onload = function(event) {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, {type: 'array'});
    const sheetContainer = document.getElementById("sheetContainer");
    sheetContainer.innerHTML = "";
    workbook.SheetNames.forEach(sheetName => {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = sheetName;
      checkbox.name = "sheets";
      const label = document.createElement("label");
      label.innerHTML = sheetName;
      sheetContainer.appendChild(checkbox);
      sheetContainer.appendChild(label);
    });
  }
  reader.readAsArrayBuffer(file);
}


// This function first gets the selected sheets from the sheetContainer element, then it reads 
// the selected file, iterates over the selected sheets, converts them to JSON objects, and then creates JSON Blob and creates a download link for each of them.
// This is just an example, and you might want to add some error handling, validation, or extra features, depending on your needs.
// Please keep in mind that this code is client-side. This means that the excel file will be loaded into the browser's memory, so you should be careful with big files.
function convertToJson() {
  const sheetContainer = document.getElementById("sheetContainer");
  const sheetInputs = sheetContainer.querySelectorAll("input[name='sheets']:checked");
  const workbook = XLSX.readFile('path/to/file.xlsx');
  sheetInputs.forEach(input => {
    const sheet = workbook.Sheets[input.value];
    const json = XLSX.utils.sheet_to_json(sheet);
    const jsonString = JSON.stringify(json);
    const jsonBlob = new Blob([jsonString], {type: "application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(jsonBlob);
    a.download = `${input.value}.json`;
    a.click();
  });
}

document.getElementById('test').addEventListener('click', (e) => {
    start()
    convertToJson();
    end()
  });

//#region Stopwatch
function start() {
  startTime = new Date();
};

function end() {
  endTime = new Date();
  var timeDiff = endTime - startTime; //in ms

  console.log(timeDiff + " ms");
}
//#endregion