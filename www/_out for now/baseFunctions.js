class BaseFunctions {
    constructor() {
        this.tippContainer = document.getElementById('tippContainer');
    }

    commonFunction() {
        console.log("This function is the same in all files");
    }

    hideAndShowBibelPhraseTipp() {
        this.tippContainer.addEventListener('click', (e) => {
            var tippText = document.getElementById("tippText");
            tippText.style.visibility = "visible";
        });
    }
}

export default BaseFunctions;
