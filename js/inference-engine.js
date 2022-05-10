import {xmlKB} from "./main.js";
import {addInferredFact, addRuleAnalysis, removeButtons, setDisplayQuestionBox} from "./utils.js";

/**
 * The goals are represented by a name and a value.
 */
class Goal {
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
}

/**
 * Goes through all possible medical recommendations, trying to rule them
 * out based on their order in the knowledge base (most urgent to least).
 */
export async function getMedicalRecommendation() {
    let medicalRec = xmlKB.getElementsByTagName("goal")[0];
    let goal = new Goal("medical-recommendation", []);

    for (let child of medicalRec.childNodes) {
        if (child.nodeName === "answer") {
            goal.value = child.getAttribute("value");
            if ((await backwardChain(goal)) === true) {
                // Conclusion is displayed when a medical recommendation was found.
                document.getElementById("question").innerHTML = child.textContent;
                return true;
            }
        }
    }

    // The system could not give any recommendation based on symptoms.
    document.getElementById("question").innerHTML =
        "No medical recommendation could be found.";
}

/**
 * Implements backward-chaining by checking user opinion, consulting already
 * inferred facts or finding a rule that could prove the goal.
 * @param goal that is being checked
 * @returns {Promise<boolean>} true if the goal passed, false otherwise
 */
async function backwardChain(goal) {
    await askUser(goal);
    if (findInferredFact(goal) === true) {
        return true;
    }
    return await findRule(goal);
}

// Flags the end of the question answering process
let gotAnswer;

/**
 * Calls method that asks a question related to the goal and "waits" for
 * the user to give an answer before returning to caller function.
 * @param goal currently being checked
 * @returns {Promise<void>} completion of asynchronous function
 */
async function askUser(goal) {
    gotAnswer = undefined;
    let promise = new Promise(function (resolve) {
        gotAnswer = resolve;
    });

    if (canAsk(goal) === true) {
        askRelatedQuestion(goal);
        await promise;
    }
}

/**
 * Determines whether there is any question in the knowledge base that could
 * determine if the current passes.
 * @param goal currently being checked
 * @returns {boolean} true if a question was found and false otherwise
 */
function canAsk(goal) {
    let questions = xmlKB.getElementsByTagName("question");
    for (let question of questions) {
        let qThen = question.getElementsByTagName("fact")[0];
        let name = qThen.getAttribute("name");
        if (name === goal.name) {
            return true;
        }
    }
    return false;
}

/**
 * Finds related question whose consequent matches the goal
 * and calls a function that asks user about it.
 * @param goal currently being checked
 * @return after question was asked
 */
function askRelatedQuestion(goal) {
    let questions = xmlKB.getElementsByTagName("question");
    for (let question of questions) {
        let qThen = question.getElementsByTagName("fact")[0];
        let name = qThen.getAttribute("name");
        if (name === goal.name) {
            askQuestion(question);
            return;
        }
    }
}

/**
 * Adds the question on the screen and calls a function that retrieves
 * user's opinion.
 * @param question that user receives
 */
function askQuestion(question) {
    document.getElementById("question").innerHTML =
        question.childNodes[1].textContent;
    setDisplayQuestionBox("block");
    getAnswer(question);
}

/**
 * Adds all possible answers that a question could have as buttons.
 * @param question that user receives
 */
function getAnswer(question) {
    let option = question.firstChild;
    let optionNum = 0;
    const thenEvents = [];

    for (let child = 0; child < question.childNodes.length; child++) {
        if (option.nodeName === "option") {
            let btn = document.createElement("button");
            btn.innerHTML = option.childNodes[1].textContent;
            btn.className = "btn";
            btn.id = optionNum.toString();

            // Inferred facts of question and answers
            thenEvents[optionNum] = option.childNodes[3];
            btn.onclick = function () {
                // Remove asked questions for efficiency of future searches.
                xmlKB.documentElement.removeChild(question);
                addInferredFact(thenEvents[btn.id].childNodes[1]);
                removeButtons();
                // Flags that the answer has been given, the promise
                // in askUser resolves after next line.
                gotAnswer();
            };
            optionNum++;

            document.getElementById("answer-buttons").appendChild(btn);
        }
        option = option.nextSibling;
    }
}

/**
 * Checks if the knowledge base contains any already inferred facts that could
 * prove the goal
 * @param goal that is currently check
 * @returns {boolean} true if there is an inferred fact in the
 * knowledge base that matches the goal, false otherwise
 */
function findInferredFact(goal) {
    let inferredFacts = xmlKB.getElementsByTagName("inferred-fact");
    for (let inferredFact of inferredFacts) {
        let name = inferredFact.getAttribute("name");
        let value = inferredFact.textContent;
        if (name === goal.name && value === goal.value) {
            return true;
        }
    }
    return false;
}

/**
 * Finds a rule whose consequent is the goal and checks if the rule passes
 * @param goal currently being checked
 * @returns {Promise<boolean>} true if a rule that proves the goal has been found,
 * false otherwise
 */
async function findRule(goal) {
    let rules = xmlKB.getElementsByTagName("rule");
    for (let rule of rules) {
        let rThen = rule
            .getElementsByTagName("then")[0]
            .getElementsByTagName("fact")[0];
        let name = rThen.getAttribute("name");
        let value = rThen.textContent;

        if (name === goal.name && value === goal.value) {
            // Check if rule that could prove goal passes.
            let rIf = rule.getElementsByTagName("if")[0];
            let returnValue;

            // Checks inference based on type of sub-goals
            switch (rIf.childNodes[1].nodeName) {
                case "fact":
                    returnValue = await applyFactRule(rIf.childNodes[1]);
                    break;
                case "and":
                    returnValue = await applyAndRule(rIf.childNodes[1]);
                    break;
                case "or":
                    returnValue = await applyOrRule(rIf.childNodes[1]);
                    break;
            }

            if (returnValue === true) {
                // Rule passed, so inferred fact is added to tke KB and the rule description
                // is added to the analysis panel.
                let inferredFact = rule.getElementsByTagName("then")[0].getElementsByTagName("fact")[0];
                addInferredFact(inferredFact);
                addRuleAnalysis(rule);
                xmlKB.documentElement.removeChild(rule);
                return true;
            }

            // Remove checked rules to improve efficiency of future searches.
            xmlKB.documentElement.removeChild(rule);
        }
    }
    return false;
}

/**
 * Determines if a fact (sub-goal) is true or false
 * @param fact currently being checked
 * @returns {Promise<boolean>} true if the fact can be proved,
 * false otherwise
 */
async function applyFactRule(fact) {
    let factName = fact.getAttribute("name");
    let factValue = fact.textContent;
    let newGoal = new Goal(factName, factValue);
    return await backwardChain(newGoal);
}

/**
 * Determines if a conjunction of facts (sub-goals) is true or false
 * @param conjunction currently being checked
 * @returns {Promise<boolean>} true if the conjunction can be proved,
 * false otherwise
 */
async function applyAndRule(conjunction) {
    let returnValue = true;
    for (let andChild of conjunction.childNodes) {
        if (andChild.nodeName === "fact") {
            let result = await applyFactRule(andChild);
            if (result !== true) {
                returnValue = false;
                break;
            }
        } else if (andChild.nodeName === "and") {
            let result = await applyAndRule(andChild);
            if (result !== true) {
                returnValue = false;
                break;
            }
        } else if (andChild.nodeName === "or") {
            let result = await applyOrRule(andChild);
            if (result !== true) {
                returnValue = false;
                break;
            }
        }
    }
    return returnValue;
}

/**
 * Determines if a disjunction of facts (sub-goals) is true or false
 * @param disjunction currently being checked
 * @returns {Promise<boolean>} true if the disjunction is true,
 * false otherwise
 */
async function applyOrRule(disjunction) {
    for (let orChild of disjunction.childNodes) {
        if (orChild.nodeName === "fact") {
            let result = await applyFactRule(orChild);
            if (result === true) {
                return true;
            }
        } else if (orChild.nodeName === "and") {
            let result = await applyAndRule(orChild);
            if (result === true) {
                return true;
            }
        } else if (orChild.nodeName === "or") {
            let result = await applyOrRule(orChild);
            if (result === true) {
                return true;
            }
        }
    }
    return false;
}