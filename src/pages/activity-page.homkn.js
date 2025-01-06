import { getRouterData, openLightbox } from 'wix-window';
import { memory } from 'wix-storage';
import { to } from 'wix-location';

let activity;
let submission = { data: [] };
let questions = [];
let quizIndexNum = -1;
let debounceTimer;
let quizscore = 0;
let isQuizRetake = false;
let quizCompleted = false;

$w.onReady(function () {
    const received = getRouterData();
    activity = received.activity;
    updatequestion();
    const previousPage = memory.getItem('prevUrl');
    if (previousPage) {
        $w('#back').expand();
    }
    $w('#back').onClick(() => {
        Promise.all([to(previousPage), memory.removeItem('prevUrl')]);
    });
});

async function updatequestion() {
    switch (activity.type) {
    case 'Quiz':
        $w('#articleIconBig, #discussionIconBig').hide();
        $w('#quizIconBig').show();
        setUpQuiz();
        break;
    case 'Article':
        $w('#quizIconBig, #discussionIconBig').hide();
        $w('#articleIconBig').show();
        setUpArticle();
        break;
    case 'Discussion':
        $w('#quizIconBig, #articleIconBig').hide();
        $w('#discussionIconBig').show();
        break;
    }
    $w('#activityTitle').text = activity.title;
    $w('#activityType').text = activity.type;
    $w('#activityStateBox').changeState(activity.type);
}

async function setUpArticle() {
    $w('#articleRichContent').value = activity.richContent;
    console.log(activity.richContent);
    $w('#activityStateBox').changeState('Article');
}

function saveQuizData(type, markComplete, multipleDropdownEventData) {
    function updateResponseData(responsevalue) {
        submission.data = submission.data.map((obj, index) => {
            if (obj._id === questions[quizIndexNum]._id) {
                return { ...obj, response: responsevalue };
            }
            return obj;
        });
    }

    function createResponseData(responsevalue) {
        const newElement = {
            response: responsevalue,
            _id: questions[quizIndexNum]._id
        };
        submission.data.push(newElement);
    }

    function deleteResponseData() {
        const indextoDelete = submission.data.findIndex(obj => obj._id === questions[quizIndexNum]._id);
        submission.data = submission.data.splice(indextoDelete, 1);
    }

    function evalResponseData(responsevalue) {
        if (responsevalue.length > 0) {
            if (submission.data.some(obj => obj._id === questions[quizIndexNum]._id)) {
                updateResponseData(responsevalue);
            } else {
                createResponseData(responsevalue);
            }
        } else { deleteResponseData() }
    }

    switch (type) {
    case 'text':
        evalResponseData($w('#responsetext').value);
        break;
    case 'radio':
        evalResponseData($w('#responseradio').value);
        break;
    case 'dropdown':
        evalResponseData($w('#responsedropdown').value);
        break;
    case 'multiselect':
        evalResponseData($w('#responsemultiselect').value);
        break;
    case 'link':
        evalResponseData($w('#responselink').value);
        break;
    case 'number':
        evalResponseData($w('#responsenumber').value);
        break;
    case 'matching':
        let responsematchingData = [];
        $w('#matchingRepeater').forEachItem(($item, itemData, index) => {
            responsematchingData.push({ "_id": itemData._id, "response": $item('#matchingDropdown').value });
            if (index + 1 === $w('#matchingRepeater').data.length) {
                evalResponseData(responsematchingData);
            }
        });
        break;
    case 'info':
        if (!submission.data.some(obj => obj._id === questions[quizIndexNum]._id)) {
            submission.data.push({ _id: questions[quizIndexNum]._id });
        }
        break;
    case 'multipleDropdown':
        if (submission.data.some(obj => obj._id === questions[quizIndexNum]._id)) {
            const submissionQuestionIndex = submission.data.findIndex((obj) => obj._id === questions[quizIndexNum]._id);
            console.log(multipleDropdownEventData.index);
            submission.data[submissionQuestionIndex].response.splice(multipleDropdownEventData.index, 1, multipleDropdownEventData.value);
            //evalResponseData(submission.data[submissionQuestionIndex].response);
        } else {
            const htmlAnsLabelArray = questions[quizIndexNum].instructions.match(/(?<=\[)[^\][]*(?=])/g);
            let responseArray = [];
            for (let i = 0; i < htmlAnsLabelArray.length; i++) {
                responseArray.push('');
            }
            createResponseData(responseArray);
        }
        break;
    case 'fileupload':
        break;
    }
    if (markComplete) {
        quizCompleted = true;
        setUpQuizResults();
    }
}

function round(value, precision) {
    if (precision > 0) {
        return Math.round(value / Math.pow(10, precision)) * Math.pow(10, precision);
    } else if (precision < 0) {
        const decimals = Math.abs(precision);
        return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
    } else {
        return Math.round(value);
    }
}

async function setUpQuizResults() {
    $w("#prevButton").collapse();
    $w('#progressBar').value = $w('#progressBar').targetValue;
    $w('#progressBarScore').targetValue = questions.length;
    $w('#outofScoreNumber').text = questions.length.toString();
    $w('#nextButton').collapse();
    $w("#quizResultRepeater").data = [];
    $w("#quizResultRepeater").data = questions;
}

async function setUpQuiz(infoobj) {
    questions = activity.data;
    isQuizRetake === false;
    $w('#activityStateBox').changeState('Quiz');
    if (quizIndexNum === -1) {
        quizIndexNum = quizIndexNum + 1;
        $w('#prevButton').collapse();
    } else if (quizIndexNum === 0) {
        $w('#prevButton').collapse();
    } else {
        $w('#prevButton').expand();
        $w('#nextButton').expand();
    }
    $w('#nextButton').expand();
    $w('#progressBar').targetValue = questions.length;
    $w('#progressBar').value = quizIndexNum;
    const questiondata = questions[quizIndexNum];
    const activityResponseData = submission.data.find((obj) => obj._id === questions[quizIndexNum]._id);
    if (!quizCompleted || isQuizRetake === true) {
        switch (questiondata.type) {
        case 'text':
            $w('#instructtext').html = questiondata.instructions;
            if (activityResponseData) {
                $w('#responsetext').value = activityResponseData.response
            } else {
                $w('#responsetext').value = questiondata.placeholder;
            }
            $w('#quizstatebox').changeState('text');
            break;
        case 'radio':
            $w('#responseradio').options = questiondata.options;
            $w('#instructquiz').html = questiondata?.instructions;
            if (activityResponseData) { $w('#responseradio').value = activityResponseData.response }
            $w('#quizstatebox').changeState('radio');
            break;
        case 'dropdown':
            $w('#responsedropdown').options = questiondata.options;
            $w('#instructdropdown').html = questiondata.instructions;
            if (activityResponseData) { $w('#responsedropdown').value = activityResponseData.response }
            $w('#quizstatebox').changeState('dropdown');
            break;
        case 'number':
            $w('#instructnumber').html = questiondata.instructions;
            if (activityResponseData) { $w('#responsenumber').value = activityResponseData.response }
            $w('#quizstatebox').changeState('number');
            break;
        case 'multiselect':
            $w('#responsemultiselect').options = questiondata.options;
            $w('#instructmultiselect').html = questiondata.instructions;
            if (activityResponseData) { $w('#responsemultiselect').value = activityResponseData.response }
            $w('#quizstatebox').changeState('multiselect');
            break;
        case 'link':
            $w('#instructlink').html = questiondata.instructions;
            if (activityResponseData) { $w('#responseradio').value = activityResponseData.response }
            validatelink();
            $w('#quizstatebox').changeState('link');
            break;
        case 'matching':
            $w('#matchingInstructionsTxt').html = questiondata.instructions;
            $w('#matchingRepeater').data = questiondata.questions.map((obj) => { return { ...obj, _id: obj.value } });
            $w('#matchingDropdown').options = questiondata.responseoptions;
            $w('#quizstatebox').changeState('matching');
            break;
        case 'info':
            $w('#instructinfo').html = questiondata.instructions;
            $w('#quizstatebox').changeState('info');
            break;
        case 'multipleDropdown':
            let options = questiondata.options;
            let allHtml = questiondata.instructions;
            const htmlAnsLabelArray = allHtml.match(/(?<=\[)[^\][]*(?=])/g);
            let responseArray = [];
            for (let i = 0; i < htmlAnsLabelArray?.length; i++) {
                responseArray.push('');
            }
            const allHtmlArray = allHtml.replace(/\[.*?\]/g, '|').split('|');
            let newHtml = '';
            allHtmlArray.forEach((val, index) => {
                if (index + 1 !== allHtmlArray.length) {
                    let selectText = `<select id="selectElem${index}" class="question_input" name="question_173213443_ec9a1c7e5a9f3a6278e9055d8dec00f0" aria-label="Multiple dropdowns, read surrounding text" onchange="sendReturnMessage(${index})" > <option value disabled selected="selected">Select</option>"`
                    options.forEach((option, optionindex) => {
                        selectText = selectText + `<option value="${option.value}">${option.label}</option>`;
                        if (optionindex + 1 === options.length) {
                            selectText = selectText + `</select>`;
                        }
                    })
                    newHtml = newHtml + val + selectText;
                } else {
                    newHtml = newHtml + val;
                }
            });
            $w('#multipleDropdownHtml').postMessage({ type: 'htmlmsg', htmlval: newHtml });
            $w('#multipleDropdownHtml').postMessage({ type: 'select', selectArray: responseArray });
            $w('#quizstatebox').changeState('multipleDropdown');
            break;
        case 'fileupload':
            break;
        }
    } else {
        setUpQuizResults();
    }
    Promise.resolve();
}

export function responsetext_change(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        saveQuizData($w('#quizstatebox').currentState.id);
    }, 500);
}

export function responseradio_change(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        saveQuizData($w('#quizstatebox').currentState.id);
    }, 500);
}

export function responsedropdown_change(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        saveQuizData($w('#quizstatebox').currentState.id);
    }, 500);
}

export function responsemultiselect_change(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        saveQuizData($w('#quizstatebox').currentState.id);
    }, 500);
}

export function multipleDropdownHtml_message(event) {
    saveQuizData($w('#quizstatebox').currentState.id, null, event.data);
}

export function responselink_keyPress(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        validatelink();
    }, 500);
}

function validatelink() {
    if ($w('#responselink').valid) {
        $w('#openlinkButton').enable();
        $w('#openlinkButton').link = $w('#responselink').value;
    } else {
        $w('#openlinkButton').disable();
    }
}

export function nextButton_click(event) {
    if (quizIndexNum + 1 === questions.length) {
        if ($w('#quizstatebox').currentState.id !== 'multipleDropdown') {
            saveQuizData($w('#quizstatebox').currentState.id, true);
        }
    } else {
        if ($w('#quizstatebox').currentState.id !== 'multipleDropdown') {
            saveQuizData($w('#quizstatebox').currentState.id);
        }
        quizIndexNum = quizIndexNum + 1;
        setUpQuiz();
    }
}

export function prevButton_click(event) {
    $w('#nextButton').expand();
    quizIndexNum = quizIndexNum - 1;
    isQuizRetake = true;
    setUpQuiz();
}

export function matchingRepeater_itemReady($item, itemData) {
    $item('#matchinginstructionText').text = itemData.label;
    const activityResponsesArray = submission.data.filter(obj => obj._id === questions[quizIndexNum]._id);
    const activityResponseData = activityResponsesArray[0];
    if (activityResponseData && activityResponseData?.response.filter((obj) => obj._id === itemData._id)[0].response) {
        $item('#matchingDropdown').value = activityResponseData.response.filter((obj) => obj._id === itemData._id)[0].response;
    }
}

export function reviewButton_click(event) {
    if ($w('#quizResultRepeater').collapsed) {
        $w('#quizResultRepeater').expand();
        $w('#reviewButton').label = "Hide";
    } else {
        $w('#quizResultRepeater').collapse();
        $w('#reviewButton').label = "Review";
    }
}

export function retryButton_click(event) {
    quizIndexNum = 1;
    prevButton_click();
}

export function quizResultRepeater_itemReady($item, itemData, index) {
    $item('#quizresultinstructions').html = itemData.instructions;
    const hasResponse = submission.data.some(obj => obj._id === itemData._id);
    //if (submission.data.some(obj => obj._id === itemData._id)) {
    const activityResponseData = submission.data.filter(obj => obj._id === itemData._id)[0];
    if (itemData.type === 'link' || itemData.type === 'fileupload') {
        if (hasResponse) {
            $item('#quizResponseTxt').text = activityResponseData.response;
        } else {
            $item('#quizResponseTxt').html = '<p style="line-height:normal; font-size:18px; color: #FF0000;"><span style="letter-spacing:normal;"><span>No Response</span></span></p>';
        }
    } else if (itemData.type === 'text') {
        if (hasResponse) {
            $item('#quizResponseTxt').html = activityResponseData.response;
        } else {
            $item('#quizResponseTxt').html = '<p style="line-height:normal; font-size:18px; color: #FF0000;"><span style="letter-spacing:normal;"><span>No Response</span></span></p>';
        }
        quizscore++;
        $item('#quizResultCorrectAnswer, #correctLabel').collapse();
    } else if (itemData.type === 'multiselect' || itemData.type === 'multipleDropdown') {
        $item('#correctLabel').text = 'Correct Answers';
        if (hasResponse) {
            const filteredoptionsobjArray = itemData.options.filter(option => activityResponseData.response.includes(option.value));
            if (filteredoptionsobjArray.some((obj) => obj?.offerFeedback)) {
                const initialHtml = `<p class="wixui-rich-text__text" style="font-size:18px;"><span class="color_33 wixui-rich-text__text"><span style="font-size:18px;" class="wixui-rich-text__text">`;
                const openingHtml = `<br class="wixui-rich-text__text">`;
                const closingHtml = `</span></span></p>`;
                let completeHtml = initialHtml;
                filteredoptionsobjArray.forEach((obj) => {
                    if (obj?.offerFeedback) {
                        completeHtml = completeHtml + openingHtml + `<b>${obj.label}:</b> ${obj.feedback}`;
                    }
                });
                completeHtml = completeHtml + closingHtml;
                $item('#feedbackLabel, #feedbackTxt').expand();
                $item('#feedbackTxt').html = completeHtml;
            }
            const filteredoptionsArray = filteredoptionsobjArray.map(option => { return option.label });
            $item('#quizResponseTxt').text = filteredoptionsArray.toString().split(',').join(', ');
            let multiselectCorrectCount = 0;
            itemData.options.forEach((option) => {
                const optionIsCorrect = itemData.answer.includes(option.value);
                const optionIsSelected = activityResponseData.response.includes(option.value);
                if (optionIsCorrect === optionIsSelected) {
                    multiselectCorrectCount += 1;
                } else {
                    multiselectCorrectCount -= 1;
                }
            });
            if (multiselectCorrectCount > 0) {
                quizscore += Math.round((multiselectCorrectCount / itemData.options.length) * 100) / 100;
                if (multiselectCorrectCount === itemData.options.length) {
                    $item('#correctLabel').text = "Correct Answers (Selected)";
                } else {
                    $item('#quizResponseTxt').html = `<p style="line-height:normal; font-size:18px; color: #FF0000;"><span style="letter-spacing:normal;"><span>"${$item('#quizResponseTxt').text}"</span></span></p>`;
                }
            }
        } else {
            $item('#quizResponseTxt').html = '<p style="line-height:normal; font-size:18px; color: #FF0000;"><span style="letter-spacing:normal;"><span>No Response</span></span></p>';
        }
        const filteredanswersobjArray = itemData.options.filter(option => itemData.answer.includes(option.value));
        const filteredanswersArray = filteredanswersobjArray.map(option => { return option.label });
        $item('#quizResultCorrectAnswer').text = filteredanswersArray.toString().split(',').join(', ');
    } else if (itemData.type === 'matching') {
        let matchingScore = 0;
        let tableArray = [];
        let hasFeedback;
        itemData.questions.forEach((question, index) => {
            const matchingresponse = activityResponseData?.response.filter((obj) => obj._id === question.value)[0];
            const matchingResponseIndex = itemData.responseoptions.findIndex((responseoption) => responseoption.value === matchingresponse?.response);
            const matchingAnswerIndex = itemData.responseoptions.findIndex((responseoption) => responseoption.value === question.answer);
            let textColor;
            if (question.answer === matchingresponse?.response) {
                textColor = '#13C402';
                matchingScore++;
            } else {
                textColor = '#ff412b';
            }
            const selectedText = `<p style="color: ${textColor}; font-size:14px;"><span style="font-size:14px;">${itemData.responseoptions[matchingResponseIndex]?.label || 'No Response'}</span></p>`;
            let tableArrayObj = { "prompt": question.label, "selected": selectedText, "answer": itemData.responseoptions[matchingAnswerIndex].label };
            if (question?.offerFeedback) {
                if (question.feedback.some((obj) => obj._id === matchingresponse?.response)) {
                    const matchingFeedbackIndex = question.feedback.findIndex((obj) => obj._id === matchingresponse?.response);
                    if (question.feedback[matchingFeedbackIndex]?.feedback) {
                        let finalText;
                        let wordArray = question.feedback[matchingFeedbackIndex].feedback.split(' ');
                        for (var i = 0; i < wordArray.length; i++) {
                            let characterCount = 0;
                            for (let count = 0; count <= i; count++) {
                                characterCount += wordArray[count].length;
                            }
                            if (characterCount > 30) {
                                if (i > 0) {
                                    finalText = wordArray.reverse().splice(i).reverse().join(' ') + '...'
                                } else {
                                    finalText = '...'
                                }
                                break;
                            } else {
                                finalText = wordArray.join(' ');
                            }
                        }
                        tableArrayObj.feedback = `<p style="color: #fec178; font-size:14px;"><span style="font-size:14px;"><u>${finalText}</u></span></p>`
                        hasFeedback = true;
                    }
                }
            }
            tableArray.push(tableArrayObj);
            if (index + 1 === itemData.questions.length) {
                quizscore = quizscore + Math.round((matchingScore / itemData.questions.length) * 100) / 100;
                matchingScore = 0;
                if (hasFeedback) {
                    let tableColumns = $w('#matchingTable').columns;
                    tableColumns.push({
                        "id": "feedback",
                        "dataPath": "feedback",
                        "label": "Feedback",
                        "type": "richText"
                    });
                    $w('#matchingTable').columns = tableColumns;
                }
                $item('#matchingTable').rows = tableArray;
                $item('#matchingTable').expand();
                $item('#responseLabel, #quizResponseTxt, #correctLabel, #quizResultCorrectAnswer').hide();
            }
        })

    } else if (itemData.type === 'number') {
        if (hasResponse) {
            $item('#quizResponseTxt').text = activityResponseData.response.toString();
            const roundedResponse = round(Number(activityResponseData.response), itemData.precision);
            const roundedAnswer = round(Number(itemData.answer), itemData.precision);
            if (itemData.allowTolerance) {
                if (roundedResponse === roundedAnswer) {
                    $item('#correctLabel').text = "Correct Answer (Selected)";
                    quizscore++;
                } else {
                    $item('#quizResponseTxt').html = `<p style="line-height:normal; font-size:18px; color: #FF0000;"><span style="letter-spacing:normal;"><span>${$item('#quizResponseTxt').text}</span></span></p>`;
                }
            } else {
                if (activityResponseData.response === itemData.answer) {
                    $item('#correctLabel').text = "Correct Answer (Selected)";
                    quizscore++;
                } else {
                    $item('#quizResponseTxt').html = `<p style="line-height:normal; font-size:18px; color: #FF0000;"><span style="letter-spacing:normal;"><span>${$item('#quizResponseTxt').text}</span></span></p>`;
                }
            }
        } else {
            $item('#quizResponseTxt').html = '<p style="line-height:normal; font-size:18px; color: #FF0000;"><span style="letter-spacing:normal;"><span>No Response</span></span></p>';
        }
        $item('#quizResultCorrectAnswer').text = itemData.answer.toString();
    } else if (itemData.type === 'info') {
        quizscore++;
        $item('#quizResultCorrectAnswer, #correctLabel, #responseLabel, #quizResponseTxt').collapse();
        /*} else if (itemData.type === 'multipleDropdown') {

        */
    } else {
        const filteredanswers = itemData.options.filter(obj => obj.value === itemData.answer);
        $item('#quizResultCorrectAnswer').text = filteredanswers[0].label;
        if (hasResponse) {
            const filteredoptions = itemData.options.filter(obj => obj.value === activityResponseData.response);
            $item('#quizResponseTxt').text = filteredoptions[0].label;
            if (filteredoptions[0].value === filteredanswers[0].value) {
                $item('#correctLabel').text = "Correct Answer (Selected)";
                quizscore++;
            } else {
                $item('#quizResponseTxt').html = `<p style="line-height:normal; font-size:18px; color: #FF0000;"><span style="letter-spacing:normal;"><span>"${$item('#quizResponseTxt').text}"</span></span></p>`;
            }
            if (filteredoptions[0]?.offerFeedback) {
                $item('#feedbackLabel, #feedbackTxt').expand();
                $item('#feedbackTxt').text = filteredoptions[0].feedback;
            }
        } else {
            $item('#quizResponseTxt').html = '<p style="line-height:normal; font-size:18px; color: #FF0000;"><span style="letter-spacing:normal;"><span>No Response</span></span></p>';
        }
    }
    /*
    } else {
        $item('#quizResponseTxt').html = '<p style="line-height:normal; font-size:18px; color: #FF0000;"><span style="letter-spacing:normal;"><span>No Response</span></span></p>';
        $item('#correctLabel, #quizResultCorrectAnswer').collapse();
    }
    */
    $item('#quizrepeaterNumber').text = (index + 1).toString();
    if (index + 1 === $w('#quizResultRepeater').data.length) {
        $w('#recievedscoreNumber').text = quizscore.toString();
        $w('#progressBarScore').value = quizscore;
        quizscore = 0;
        $w('#quizstatebox').changeState('results');
    }
}

export function matchingDropdown_change(event) {
    saveQuizData('matching');
}

export function matchingTable_cellSelect(event) {
    let $item = $w.at(event.context.itemId);
    if (event.cellColumnId === 'Feedback') {
        const activityQuestion = $item('#quizResultRepeater').data.find(obj => obj._id === event.context.itemId);
        const question = activityQuestion.questions.find((obj) => obj.label === event.target.rows[event.cellRowIndex].prompt);
        if (question?.offerFeedback) {
            const activityResponseData = submission.data.filter(obj => obj._id === event.context.itemId)[0];
            const matchingresponse = activityResponseData.response.filter((obj) => obj._id === question.value)[0];
            if (question.feedback.some((obj) => obj._id === matchingresponse.response)) {
                const matchingFeedbackIndex = question.feedback.findIndex((obj) => obj._id === matchingresponse.response);
                if (question.feedback[matchingFeedbackIndex]?.feedback) {
                    openLightbox("Details", {
                        title: "Feedback",
                        details: question.feedback[matchingFeedbackIndex].feedback
                    });
                }
            }
        }
    }
}