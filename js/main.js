import {addAnalysisButton, addResetButton, setDisplayQuestionBox, setDisplayWelcomeBox} from "./utils.js";
import {getMedicalRecommendation} from "./inference-engine.js";

export let xmlKB;
export let xmlFriendlyNames;

setDisplayWelcomeBox("block");
setDisplayQuestionBox("none");
let startButton = document.getElementById("start-button");
startButton.onclick = function () {
  setDisplayWelcomeBox("none");
  document.getElementById("loader").style.display = "block";
  addResetButton();
  addAnalysisButton();
  startSystem();
}

/**
 * Loads XMLs according to https://www.w3schools.com/xml/dom_intro.asp
 * and starts the system by calling getMedicalRecommendation().
 */
export function startSystem() {
  // Loads user-friendly fact names
  let http = new XMLHttpRequest();
  http.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
      xmlFriendlyNames = this.responseXML;
    }
  };
  http.open("GET", "xml-files/user-friendly.xml", true);
  http.send();
  
  // Loads knowledge base
  http = new XMLHttpRequest();
  http.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
      xmlKB = this.responseXML;
      document.getElementById("loader").style.display = "none";
      getMedicalRecommendation();
    }
  };
  http.open("GET", "xml-files/kb.xml", true);
  http.send();
}
