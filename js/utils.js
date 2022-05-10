import {startSystem, xmlKB, xmlFriendlyNames} from './main.js'

/**
 * Adds reset button.
 * On-click functionality: Clears current state of the system and restarts it
 */
export function addResetButton() {
    let btn = document.createElement("button");
    btn.innerHTML = "Reset";
    btn.className = "reset-btn";

    btn.onclick = function () {
        setDisplayQuestionBox("none");
        setDisplayWelcomeBox("block");
        document.getElementById("question").innerHTML = "";
        removeButtons();
        removeInferredFacts();
        removeRuleAnalysis();
        hideSplitRight();
    };

    document.getElementById("reset-button").appendChild(btn);
}

/**
 * Adds analysis button.
 * On-click functionality: Displays analysis panel if hidden and hides it if currently displayed
 */
export function addAnalysisButton() {
    let btn = document.createElement("button");
    btn.innerHTML = "Analysis";
    btn.className = "analysis-btn";

    btn.onclick = function () {
        let initialStyleRight = window.getComputedStyle(document.getElementById("SplitRight"));
        let styleRight = document.getElementById("SplitRight").style;
        let styleLeft = document.getElementById("SplitLeft").style;

        if (styleRight.display === "none" || initialStyleRight.display === "none") {
            // Analysis panel is displayed if currently hidden.
            styleLeft.width = "75%";
            styleRight.width = "25%";
            styleRight.display = "block";
        } else {
            // Analysis panel is hidden if currently displayed.
            styleLeft.width = "100%";
            styleRight.width = "0%";
            styleRight.display = "none";
        }
    }

    document.getElementById("analysis-button").appendChild(btn);
}

/**
 * Hides or displays the question box according to the given value
 * @param value is either "none" or "block"
 */
export function setDisplayQuestionBox(value) {
    let questionBox = document.getElementById("question-box");
    questionBox.style.display = value;
}

/**
 * Hides or displays the welcome screen according to the given value
 * @param value is either "none" or "block"
 */
export function setDisplayWelcomeBox(value) {
    let welcomeBox = document.getElementById("welcome-box");
    welcomeBox.style.display = value;
}

/**
 * Removes buttons used to answer the question
 */
export function removeButtons() {
    let buttons = document.getElementById("answer-buttons");
    while (buttons.firstChild) {
        buttons.removeChild(buttons.firstChild);
    }
}

/**
 * Removes inferred facts from the analysis panel
 */
function removeInferredFacts() {
    let inferredFacts = document.getElementById("inferred-facts");
    while (inferredFacts.firstChild) {
        inferredFacts.removeChild(inferredFacts.firstChild);
    }
}

/**
 * Removes applied rules from the analysis panel
 */
function removeRuleAnalysis() {
    let ruleAnalysis = document.getElementById("rule-analysis");
    while (ruleAnalysis.firstChild) {
        ruleAnalysis.removeChild(ruleAnalysis.firstChild);
    }
}

/**
 * Hides the right split of the screen (analysis panel)
 */
function hideSplitRight() {
    let styleLeft = document.getElementById("SplitLeft").style;
    let styleRight = document.getElementById("SplitRight").style;
    styleLeft.width = "100%";
    styleRight.width = "0%";
    styleRight.display = "none";
}

/**
 * Adds fact as inferred fact to the knowledge base
 * @param fact that is added to inferred facts
 */
export function addInferredFact(fact) {
    let inferredFact = xmlKB.createElement("inferred-fact");
    inferredFact.textContent = fact.textContent;
    let newAttribute = xmlKB.createAttribute("name");
    newAttribute.nodeValue = fact.getAttribute("name");
    inferredFact.setAttributeNode(newAttribute);

    xmlKB.getElementsByTagName("knowledge")[0].appendChild(inferredFact);
    displayInferredFact(inferredFact);
}

/**
 * Displays user-friendly description of inferred fact to the analysis panel
 * @param fact that is displayed
 */
function displayInferredFact(fact) {
    let friendlyElements = xmlFriendlyNames.getElementsByTagName("user-friendly");

    for (let friendlyElement of friendlyElements) {
        let friendlyFact = friendlyElement.getElementsByTagName("fact")[0];
        let fFactName = friendlyFact.getAttribute("name");
        let fFactValue = friendlyFact.textContent;

        if (fFactName === fact.getAttribute("name") && fFactValue === fact.textContent) {
            // User-friendly name has been found and can be displayed in the analysis panel.
            let inferredFactDiv = document.getElementById("inferred-facts");
            let inferredFact = friendlyElement.getElementsByTagName("friendly-fact")[0].textContent;
            let listEntry = document.createElement("li");
            listEntry.appendChild(document.createTextNode(inferredFact));
            inferredFactDiv.appendChild(listEntry);

            // Fact is removed from the XML to improve efficiency of future searches.
            xmlFriendlyNames.documentElement.removeChild(friendlyElement);
            break;
        }
    }
}

export function addRuleAnalysis(rule) {
    let ruleText = rule.getElementsByTagName("description")[0].textContent;
    let listEntry = document.createElement("li");
    listEntry.appendChild(document.createTextNode(ruleText));
    document.getElementById("rule-analysis").appendChild(listEntry);
}