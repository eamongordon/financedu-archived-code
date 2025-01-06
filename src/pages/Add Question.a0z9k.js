import wixData from 'wix-data';
import { generateRandom, moveArray, sortArray } from 'public/util.js';
import wixAnimations from 'wix-animations';
import { formFactor } from 'wix-window';

let debounceTimer;
let activity;
let lesson;
let currQuestionIndex;
let savedData;
let contextIndex;

$w.onReady(function () {

    // Write your Javascript code here using the Velo framework API

    // Print hello world:
    // console.log("Hello world!");

    // Call functions on page elements, e.g.:
    // $w("#button1").label = "Click me!";

    // Click "Run", or Preview your site, to execute your code

});

export function activityIdInput_keyPress(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        if (event.key === "Enter") {
            console.log('enter')
            console.log(event.target.value);
            $w('#activityDataset').setFilter(wixData.filter().eq('_id', event.target.value)).then(async () => {
                activity = await $w('#activityDataset').getCurrentItem();
                $w('#questionRepeater').data = activity.data;
                savedData = activity.data;
            })
        }
    }, 10);
}

export async function activityDataset_currentIndexChanged() {
    activity = await $w('#activityDataset').getCurrentItem();
    console.log($w('#activityDataset').getTotalCount());
    $w('#questionRepeater').data = activity.data;
    savedData = activity.data;
    console.log($w('#questionRepeater').data);
}

function updateData() {
    activity.data = savedData;
    $w('#activityDataset').setFieldValues({
        data: activity.data
    });
    $w('#activityDataset').save();
}

export function questionRepeater_itemReady($item, itemData, index) {
    $item('#numberQuestionTxt').text = (index + 1).toString();
    $item('#typeQuestionTxt').text = itemData.type.charAt(0).toUpperCase() + itemData.type.slice(1);
    $item('#instructionsQuestionTxt').html = itemData.instructions;
    $item('#numberQuestionTxt, #typeQuestionTxt, #instructionsQuestionTxt').onClick(() => { editRepeater() });
    /*
    $item('#radioCorrectCheckbox').onChange(() => {
        console.log('saving');
        $w('#radioCorrectCheckbox').checked = false; 
        savedData[currQuestionIndex].answer = itemData.value;
        console.log(savedData);
        updateAnswer();
        $item('#radioCorrectCheckbox').checked = true;
    });
    */
    console.log('clicked');

    function editRepeater() {
        currQuestionIndex = index;
        loadQuestion(itemData);
        console.log('clicked');
        /*
        if (formFactor === 'Mobile') {
            $w('#lessonColumn').collapse();
            $w('#materialsColumn').expand();
        }
		*/
        savedData = $w('#questionRepeater').data;
        $w('#questionRepeater').data = [];
        setTimeout(() => {
            $w('#questionRepeater').data = savedData;
            console.log($w('#questionRepeater').data);
            $item('#containerQuestion').background.src = 'https://static.wixstatic.com/media/2dcc6c_df6123451dd64254a1c485c53cc17e3e~mv2.png';
            //$w('#lessonsDataset').setCurrentItemIndex(index);
            //$item('#lessonTitleTxt').html = `<h5 style="color: #00A2FF; font-size:20px;">${itemData.title}</h5>`;
            //$item('#moduleTxt').html = `<p style="color: #00A2FF; font-size:16px;"><span style="font-size:16px;">${module.title}</span></p>`
            //$item('#selectedLine').show();
        });
    }
}

function loadQuestion(question) {
    $w('#difficultyDropdown').value = null;
    $w('#questionInstructionsInput').value = null;
    $w('#courseTopicSelectionTags').value = [];
    switch (question.type) {
    case 'text':
        loadTextQuestion();
        break;
    case 'dropdown':
        loadRadioQuestion();
        break;
    case 'radio':
        loadRadioQuestion();
        break;
    case 'matching':
        loadMatchingQuestion();
        break;
    case 'multiselect':
        loadMultiSelectQuestion();
        break;
    case 'number':
        loadNumberQuestion();
        break;
    case 'info':
        loadInfoQuestion();
        break;
    case 'multipleDropdown':
        loadMultipleDropdownQuestion();
        break;
    default:
        $w('#questionStateBox').changeState('Blank');
        break;
    }

    function loadInfoQuestion() {
        $w('#questionStateBox').changeState('Info');
    }

    function loadTextQuestion() {
        $w('#questionStateBox').changeState('Text');
        $w('#placeholderRichTextBox').value = question.placeholder;
    }

    function loadRadioQuestion() {
        $w('#questionStateBox').changeState('Radio');
        if (question.options.length > 0) {
            $w('#radioOptionsRepeater').data = question.options.map((obj, index) => {
                return { ...obj, _id: obj.value }
            });
        } else {
            $w('#radioOptionsRepeater').data = [];
        }
    }

    function loadMultipleDropdownQuestion() {
        $w('#questionStateBox').changeState('MultipleDropdown');
        $w('#multipleDropdownRepeater').data = [];
        if (question.options.length > 0) {
            $w('#multipleDropdownRepeater').data = question.options.map((obj) => {
                return { ...obj, _id: obj.value }
            });
        } else {
            $w('#multipleDropdownRepeater').data = [];
        }
        loadHtmlMultipleDropdown();
    }

    function loadMatchingQuestion() {
        $w('#questionStateBox').changeState('Matching');
        $w('#matchingOptionsRepeater').data = [];
        $w('#matchingQuestionsRepeater').data = [];
        $w('#matchingQuestionsDropdown').options = []
        $w('#matchingQuestionsFeedbackDropdown').options = []
        $w('#matchingQuestionsFeedbackDropdown').value = null;
        $w('#matchingQuestionsDropdown').options = question.responseoptions;
        $w('#matchingQuestionsFeedbackDropdown').options = question.responseoptions;
        $w('#matchingQuestionsFeedbackDropdown').value = $w('#matchingQuestionsFeedbackDropdown').options[0]?.value;
        if (question.responseoptions.length > 0) {
            $w('#matchingOptionsRepeater').data = question.responseoptions.map((obj) => {
                return { ...obj, _id: obj.value }
            });
        } else {
            $w('#matchingOptionsRepeater').data = [];
        }
        if (question.questions.length > 0) {
            $w('#matchingQuestionsRepeater').data = question.questions.map((obj, index) => {
                return { ...obj, _id: obj.value }
            });
        } else {
            $w('#matchingQuestionsRepeater').data = [];
        }
    }

    function loadMultiSelectQuestion() {
        $w('#questionStateBox').changeState('Multiselect');
        if (question.options.length > 0) {
            $w('#multiselectOptionRepeater').data = question.options.map((obj, index) => {
                return { ...obj, _id: obj.value }
            });
        } else {
            $w('#multiselectOptionRepeater').data = [];
        }
    }

    function loadNumberQuestion() {
        $w('#questionStateBox').changeState('Number');
        $w('#numberInputAnswer').value = question.answer;
        if (question.allowTolerance) {
            $w('#allowToleranceCheckbox').checked = true;
            $w('#precisionDropdown').value = question.precision;
            $w('#precisionDropdown').expand();
        } else {
            $w('#precisionDropdown').collapse();
        }
    }
    $w('#text82').text = question._id;
    $w('#difficultyDropdown').value = question?.difficulty;
    $w('#courseTopicSelectionTags').value = question?.topics;
    $w('#questionInstructionsInput').value = question.instructions;
}

export function addRadioOptionButton_click(event) {
    let repeaterData = $w('#radioOptionsRepeater').data;
    const newId = generateRandom(6);
    repeaterData.push({
        "_id": newId,
        "label": null,
        "value": $w('#radioOptionsRepeater').data.length + 1,
    });
    savedData[currQuestionIndex].options.push({ "label": null, "value": newId });
    updateData();
    $w('#radioOptionsRepeater').data = repeaterData;
}

export function activityEnterButton_click(event) {
    $w('#activityDataset').setFilter(wixData.filter().eq('_id', $w('#activityIdInput').value));
    $w("#sidebarStatebox").changeState('Questions');
}

export function radioOptionsRepeater_itemReady($item, itemData, index) {
    $item('#radioOptionsLabelInput').value = itemData.label;
    if (itemData.value === savedData[currQuestionIndex].answer) {
        $item('#radioCorrectCheckbox').checked = true;
    }
    if (itemData.offerFeedback) {
        $item('#radioFeedbackCheckbox').checked = true;
        $item('#radioFeedbackBox').value = itemData.feedback;
        $item('#radioFeedbackBox').expand();
    }
    //$w('#addQuestionButton').label = currQuestionIndex.toString();
}

export function radioCorrectCheckbox_change(event) {
    let $item = $w.at(event.context);
    $w('#radioCorrectCheckbox').checked = false;
    savedData[currQuestionIndex].answer = event.context.itemId;
    updateData();
    $item('#radioCorrectCheckbox').checked = true;
}

export function radioFeedbackCheckbox_change(event) {
    let $item = $w.at(event.context);
    const optionindex = savedData[currQuestionIndex].options.findIndex((obj) => obj.value === event.context.itemId);
    if (event.target.checked) {
        savedData[currQuestionIndex].options[optionindex].offerFeedback = true;
        $item('#radioFeedbackBox').expand();
    } else {
        savedData[currQuestionIndex].options[optionindex].offerFeedback = false;
        $item('#radioFeedbackBox').collapse();
    }
    updateData();
}

export function multiselectFeedbackCheckbox_change(event) {
    let $item = $w.at(event.context);
    const optionindex = savedData[currQuestionIndex].options.findIndex((obj) => obj.value === event.context.itemId);
    if (event.target.checked) {
        savedData[currQuestionIndex].options[optionindex].offerFeedback = true;
        $item('#multiselectFeedbackBox').expand();
    } else {
        savedData[currQuestionIndex].options[optionindex].offerFeedback = false;
        $item('#multiselectFeedbackBox').collapse();
    }
    updateData();
}

export function matchingFeedbackCheckbox_change(event) {
    let $item = $w.at(event.context);
    const matchingIndex = savedData[currQuestionIndex].questions.findIndex((obj) => obj.value === event.context.itemId);
    if (event.target.checked) {
        savedData[currQuestionIndex].questions[matchingIndex].offerFeedback = true;
        if (!savedData[currQuestionIndex].questions[matchingIndex].feedback) {
            savedData[currQuestionIndex].questions[matchingIndex].feedback = [];
        }
        if (savedData[currQuestionIndex].questions[matchingIndex].feedback.some((obj) => obj._id === $w('#matchingQuestionsFeedbackDropdown').value)) {
            const matchingResponseIndex = savedData[currQuestionIndex].questions[matchingIndex].feedback.findIndex((obj) => obj._id === $w('#matchingQuestionsFeedbackDropdown').value);
            $item('#matchingQuestionsFeedbackBox').value = savedData[currQuestionIndex].questions[matchingIndex].feedback[matchingResponseIndex]?.feedback;
        } else {
            savedData[currQuestionIndex].questions[matchingIndex].feedback.push({
                "_id": $item('#matchingQuestionsFeedbackDropdown').value,
            });
        }
        $item('#matchingQuestionsFeedbackBox, #matchingQuestionsFeedbackDropdown').expand();
    } else {
        savedData[currQuestionIndex].questions[matchingIndex].offerFeedback = false;
        $item('#matchingQuestionsFeedbackBox, #matchingQuestionsFeedbackDropdown').collapse();
    }
    updateData();
}

export function addQuestion_click(event) {
    $w('#newQuestionBox').expand();
}

export function newQuestionConfirm_click(event) {
    $w('#newQuestionBox').collapse();
    addQuestion();
}

export function radioDeleteItem_click(event) {
    const optionindex = savedData[currQuestionIndex].options.findIndex((obj) => obj.value === event.context.itemId);
    console.log(optionindex);
    savedData[currQuestionIndex].options.splice(optionindex, 1);
    console.log(savedData[currQuestionIndex].options);
    updateData();
    /*
    updateCheckedAnswer();
    */
    $w('#radioOptionsRepeater').data = [];
    $w('#radioOptionsRepeater').data = savedData[currQuestionIndex].options.map((obj) => { return { ...obj, _id: obj.value } });
}

function updateCheckedAnswer(rightindex) {
    $w('#radioCorrectCheckbox').checked = false;
    console.log(savedData);
    $w('#radioOptionsRepeater').forItems([rightindex], ($item, itemData, index) => {
        $item('#radioCorrectCheckbox').checked = true;
        savedData[currQuestionIndex].answer = itemData._id
        updateData();
    });
}

export function options_click(event) {
    $w.at(event.context)
}

export function multiselectIsChecked_click(event) {
    savedData[currQuestionIndex].answer.push(event.context.itemId)
}

export function addMultiselectOptionsButton_click(event) {
    let repeaterData = $w('#multiselectOptionRepeater').data;
    const newId = generateRandom(6);
    repeaterData.push({
        "_id": newId,
        "label": null,
        "value": newId,
    });
    $w('#multiselectOptionRepeater').data = repeaterData;
    savedData[currQuestionIndex].options.push({ "label": null, "value": newId });
    updateData();
}

function addQuestion() {
    let newItem = {
        "_id": generateRandom(6),
        "type": $w('#questionTypeDropdown').value,
        "instructions": null
    }
    switch ($w('#questionTypeDropdown').value) {
    case 'radio':
        newItem.options = [];
        newItem.answer = null;
        break;
    case 'dropdown':
        newItem.options = [];
        newItem.answer = null;
        break;
    case 'multiselect':
        newItem.options = [];
        newItem.answer = [];
        break;
    case 'matching':
        newItem.questions = [];
        newItem.responseoptions = [];
        break;
    case 'number':
        newItem.allowTolerance = false;
        newItem.precision = 0;
        break;
    case 'multipleDropdown':
        newItem.options = [];
        newItem.answer = [];
        break;
    }
    savedData.push(newItem);
    $w('#questionRepeater').data = savedData;
    updateData();
}

export function questionInstructionsInput_change(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        savedData[currQuestionIndex].instructions = $w('#questionInstructionsInput').value;
        if (savedData[currQuestionIndex].type === 'multipleDropdown') {
            loadHtmlMultipleDropdown();
        }
        updateData();
    }, 500);
}

export function multiselectCheckbox_change(event) {
    if (event.target.checked === true) {
        savedData[currQuestionIndex].answer.push(event.context.itemId);
    } else {
        const answerIndex = savedData[currQuestionIndex].findIndex((answer) => answer === event.context.itemId);
        savedData[currQuestionIndex].answer.splice(answerIndex, 1);
    }
    updateData();
}

export function multiselectOptionRepeater_itemReady($item, itemData) {
    const includesAnswer = savedData[currQuestionIndex].answer.includes(itemData._id);
    $item('#multiselectOptionLabelInput').value = itemData.label;
    if (includesAnswer === true) {
        $item('#multiselectCheckbox').checked = true;
    }
    if (itemData.offerFeedback) {
        $item('#multiselectFeedbackCheckbox').checked = true;
        $item('#multiselectFeedbackBox').value = itemData.feedback;
        $item('#multiselectFeedbackBox').expand();
    }
}

export function multiselectDeleteItem_click(event) {
    const matchingIndex = savedData[currQuestionIndex].options.findIndex((obj) => obj.value === event.context.itemId);
    savedData[currQuestionIndex].options.splice(matchingIndex, 1);
    const answerIndex = savedData[currQuestionIndex].answer.findIndex((answer) => answer === event.context.itemId);
    savedData[currQuestionIndex].answer.splice(answerIndex, 1);
    updateData();
    $w('#multiselectOptionRepeater').data = [];
    $w('#multiselectOptionRepeater').data = savedData[currQuestionIndex].options.map((obj) => { return { ...obj, _id: obj.value } });;
}

export function multiselectOptionLabelInput_input(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        const optionindex = savedData[currQuestionIndex].options.findIndex((obj) => obj.value === event.context.itemId);
        savedData[currQuestionIndex].options[optionindex].label = event.target.value;
        console.log(event.context.itemId);
        updateData();
    }, 500);
}

export function matchingQuestionsRepeater_itemReady($item, itemData, index) {
    $item('#matchingQuestionsLabelInput').value = itemData.label;
    $item('#matchingQuestionsDropdown').value = savedData[currQuestionIndex].questions[index].answer;
    if (itemData.offerFeedback) {
        $item('#matchingFeedbackCheckbox').checked = true;
        if (itemData.feedback.some((obj) => obj._id === $w('#matchingQuestionsFeedbackDropdown').value)) {
            const matchingResponseIndex = itemData.feedback.findIndex((obj) => obj._id === $item('#matchingQuestionsFeedbackDropdown').value);
            $item('#matchingQuestionsFeedbackBox').value = itemData.feedback[matchingResponseIndex]?.feedback;
        } else {
            savedData[currQuestionIndex].questions[index].feedback.push({
                "_id": $item('#matchingQuestionsDropdown').value
            });
        }
        $item('#matchingQuestionsFeedbackBox, #matchingQuestionsFeedbackDropdown').expand();
    }
}

export function matchingQuestionsDropdown_change(event) {
    const matchingIndex = savedData[currQuestionIndex].questions.findIndex((obj) => obj.value === event.context.itemId);
    savedData[currQuestionIndex].questions[matchingIndex].answer = event.target.value;
    updateData();
}

export function matchingQuestionsLabelInput_input(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        const matchingIndex = savedData[currQuestionIndex].questions.findIndex((obj) => obj.value === event.context.itemId);
        savedData[currQuestionIndex].questions[matchingIndex].label = event.target.value;
        updateData();
    }, 500);
}

export function matchingQuestionsFeedbackBox_input(event) {
    let $item = $w.at(event.context);
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        const matchingIndex = savedData[currQuestionIndex].questions.findIndex((obj) => obj.value === event.context.itemId);
        const matchingResponseIndex = savedData[currQuestionIndex].questions[matchingIndex].feedback.findIndex((obj) => obj._id === $item('#matchingQuestionsFeedbackDropdown').value);
        savedData[currQuestionIndex].questions[matchingIndex].feedback[matchingResponseIndex].feedback = event.target.value;
        updateData();
    }, 500);
}

export function matchingQuestionsFeedbackDropdown_change(event) {
    let $item = $w.at(event.context);
    const matchingIndex = savedData[currQuestionIndex].questions.findIndex((obj) => obj.value === event.context.itemId);
    if (!savedData[currQuestionIndex].questions[matchingIndex].feedback.some((obj) => obj._id === event.target.value)) {
        savedData[currQuestionIndex].questions[matchingIndex].feedback.push({
            "_id": event.target.value
        });
        $item('#matchingQuestionsFeedbackBox').value = null
        updateData();
    } else {
        const matchingResponseIndex = savedData[currQuestionIndex].questions[matchingIndex].feedback.findIndex((obj) => obj._id === event.target.value);
        $item('#matchingQuestionsFeedbackBox').value = savedData[currQuestionIndex].questions[matchingIndex].feedback[matchingResponseIndex]?.feedback;
    }
}

export function matchingQuestionsDeleteItem_click(event) {
    const matchingIndex = savedData[currQuestionIndex].questions.findIndex((obj) => obj.value === event.context.itemId);
    savedData[currQuestionIndex].questions.splice(matchingIndex, 1);
    updateData();
    $w('#matchingQuestionsRepeater').data = [];
    $w('#matchingQuestionsRepeater').data = savedData[currQuestionIndex].questions.map((obj) => { return { ...obj, _id: obj.value } });
}

export function matchingQuestionsNew_click(event) {
    let repeaterData = $w('#matchingQuestionsRepeater').data;
    const newId = generateRandom(6);
    repeaterData.push({
        "_id": newId,
        "label": null,
        "value": newId,
        "offerFeedback": false,
        "feedback": []
    });
    savedData[currQuestionIndex].questions.push({ label: null, value: newId, answer: null, offerFeedback: false, feedback: [] });
    updateData();
    $w('#matchingQuestionsRepeater').data = repeaterData;
}

export function matchingOptionsRepeater_itemReady($item, itemData) {
    $item('#matchingOptionsLabelInput').value = itemData.label;
}

export function multipleDropdownRepeater_itemReady($item, itemData) {
    $item('#multipleDropdownLabelInput').value = itemData.label;
}

export function matchingOptionsDeleteItem_click(event) {
    const optionindex = savedData[currQuestionIndex].responseoptions.findIndex((obj) => obj.value === event.context.itemId);
    savedData[currQuestionIndex].responseoptions.splice(optionindex, 1);
    savedData[currQuestionIndex].questions.forEach((question, index) => {
        if (question?.feedback) {
            if (savedData[currQuestionIndex].questions[index].feedback.some((obj) => obj._id === event.context.itemId)) {
                const matchingResponseIndex = savedData[currQuestionIndex].questions[index].feedback.find((obj) => obj._id === event.context.itemId);
                savedData[currQuestionIndex].questions[index].feedback.spice(matchingResponseIndex, 1);
            }
        }
    })
    $w('#matchingQuestionsDropdown').options = savedData[currQuestionIndex].responseoptions;
    $w('#matchingQuestionsFeedbackDropdown').options = savedData[currQuestionIndex].responseoptions;
    $w('#matchingQuestionsFeedbackDropdown').value = $w('#matchingQuestionsFeedbackDropdown').options[0].value;
    updateData();
    $w('#matchingOptionsRepeater').data = [];
    $w('#matchingOptionsRepeater').data = savedData[currQuestionIndex].responseoptions.map((obj) => { return { ...obj, _id: obj.value } });
}

export function multipleDropdownDeleteItem_click(event) {
    const optionindex = savedData[currQuestionIndex].options.findIndex((obj) => obj.value === event.context.itemId);
    savedData[currQuestionIndex].options.splice(optionindex, 1);
    $w('#multipleDropdownRepeater').data = [];
    $w('#multipleDropdownRepeater').data = savedData[currQuestionIndex].options.map((obj) => { return { ...obj, _id: obj.value } });
    let options = savedData[currQuestionIndex].options;
    let allHtml = savedData[currQuestionIndex].instructions;
    let htmlAnsLabelArray;
    if (allHtml) {
        htmlAnsLabelArray = allHtml.match(/(?<=\[)[^\][]*(?=])/g);
    }
    if (htmlAnsLabelArray && htmlAnsLabelArray?.length > 0) {
        savedData[currQuestionIndex].answer = htmlAnsLabelArray.map((label) => options.find((obj) => obj.label === label).value);
    }
    loadHtmlMultipleDropdown();
    updateData();
}

function loadHtmlMultipleDropdown() {
    console.log('loadhtml')
    let options = savedData[currQuestionIndex].options;
    let allHtml = $w('#questionInstructionsInput').value;
    const htmlAnsLabelArray = allHtml.match(/(?<=\[)[^\][]*(?=])/g);
    let responseArray = [];
    for (let i = 0; i < htmlAnsLabelArray?.length; i++) {
        responseArray.push('');
    }
    const allHtmlArray = allHtml.replace(/\[.*?\]/g, '|').split('|');
    let newHtml = '';
    allHtmlArray.forEach((val, index) => {
        if (index + 1 !== allHtmlArray.length) {
            newHtml = newHtml + val + createDropdownHtml(index);
        } else {
            newHtml = newHtml + val;
        }
    });

    function createDropdownHtml(index) {
        let selectText = `<select id="selectElem${index}" class="question_input" name="question_173213443_ec9a1c7e5a9f3a6278e9055d8dec00f0" aria-label="Multiple dropdowns, read surrounding text" onchange="sendReturnMessage(${index})" > <option value disabled selected="selected">Select</option>"`
        options.forEach((option, optionindex) => {
            selectText = selectText + `<option value="${option.value}">${option.label}</option>`;
            if (optionindex + 1 === options.length) {
                selectText = selectText + `</select>`;
            }
        })
        return selectText;
    }
    $w('#html1').postMessage({ type: 'htmlmsg', htmlval: newHtml });
    $w('#html1').postMessage({ type: 'select', selectArray: responseArray });
    $w('#html1').onMessage((event) => {
        responseArray.splice(event.data.index, 1, event.data.value);
        console.log(responseArray);
    });
}

export function matchingOptionsLabelInput_input(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        const optionindex = savedData[currQuestionIndex].responseoptions.findIndex((obj) => obj.value === event.context.itemId);
        savedData[currQuestionIndex].responseoptions[optionindex].label = event.target.value;
        $w('#matchingQuestionsDropdown').options = savedData[currQuestionIndex].responseoptions;
        updateData();
    }, 500);
}

export function multipleDropdownLabelInput_input(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        const optionindex = savedData[currQuestionIndex].options.findIndex((obj) => obj.value === event.context.itemId);
        savedData[currQuestionIndex].options[optionindex].label = event.target.value;
        let options = savedData[currQuestionIndex].options;
        let allHtml = savedData[currQuestionIndex].instructions;
        let htmlAnsLabelArray;
        if (allHtml) {
            htmlAnsLabelArray = allHtml.match(/(?<=\[)[^\][]*(?=])/g);
        }
        if (htmlAnsLabelArray && htmlAnsLabelArray?.length > 0) {
            savedData[currQuestionIndex].answer = htmlAnsLabelArray.map((label) => options.find((obj) => obj.label === label).value);
        }
        loadHtmlMultipleDropdown();
        updateData();
    }, 500);
}

export function radioOptionsLabelInput_input(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        const optionindex = savedData[currQuestionIndex].options.findIndex((obj) => obj.value === event.context.itemId);
        savedData[currQuestionIndex].options[optionindex].label = event.target.value
        updateData();
    }, 500);
}

export function radioFeedbackBox_input(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        const optionindex = savedData[currQuestionIndex].options.findIndex((obj) => obj.value === event.context.itemId);
        savedData[currQuestionIndex].options[optionindex].feedback = event.target.value;
        updateData();
    }, 500);
}

export function multiselectFeedbackBox_input(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        const optionindex = savedData[currQuestionIndex].options.findIndex((obj) => obj.value === event.context.itemId);
        savedData[currQuestionIndex].options[optionindex].feedback = event.target.value;
        updateData();
    }, 500);
}

export function addMultipleDropdownOptionsButton_click(event) {
    let repeaterData = $w('#multipleDropdownRepeater').data;
    const newId = generateRandom(6);
    repeaterData.push({
        "_id": newId,
        "label": null,
        "value": newId,
    });
    $w('#multipleDropdownRepeater').data = repeaterData;
    savedData[currQuestionIndex].options.push({ "label": null, "value": newId });
    loadHtmlMultipleDropdown();
    updateData();
}

export function addMatchingOptionsButton_click(event) {
    let repeaterData = $w('#matchingOptionsRepeater').data;
    const newId = generateRandom(6);
    repeaterData.push({
        "_id": newId,
        "label": null,
        "value": newId,
    });
    savedData[currQuestionIndex].responseoptions.push({ "label": null, "value": newId });
    updateData();
    $w('#matchingQuestionsDropdown').options = savedData[currQuestionIndex].responseoptions;
    $w('#matchingQuestionsFeedbackDropdown').options = savedData[currQuestionIndex].responseoptions;
    $w('#matchingQuestionsFeedbackDropdown').value = $w('#matchingQuestionsFeedbackDropdown').options[0].value;
    $w('#matchingOptionsRepeater').data = repeaterData;
}

export function deleteQuestionButton_click(event) {
    const questionremoveindex = savedData.findIndex((obj) => obj._id === event.context.itemId);
    wixData.remove("Questions", savedData[questionremoveindex]._id).finally(() => {
        savedData.splice(questionremoveindex, 1);
        updateData();
        if (questionremoveindex === 0) {
            currQuestionIndex = 1;
        } else {
            currQuestionIndex = questionremoveindex - 1;
        }
        loadQuestion($w('#questionRepeater').data[currQuestionIndex]);
        $w('#questionRepeater').data = savedData;
    });
}

export function placeholderRichTextBox_change(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        savedData[currQuestionIndex].placeholder = $w('#placeholderRichTextBox').value;
        updateData();
    }, 500);
}

export function numberInputAnswer_input(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        savedData[currQuestionIndex].answer = event.target.value
        updateData();
    }, 500);
}

export function precisionDropdown_change(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        savedData[currQuestionIndex].precision = event.target.value
        updateData();
    }, 500);
}

export function threeDotsMenu_click(event) {
    const repeaterIndex = $w('#activityRepeater').data.findIndex(obj => obj._id === event.context.itemId);
    contextIndex = repeaterIndex;
    $w('#previewButton').link = `/activity/${$w('#activityRepeater').data[contextIndex]._id}`;
    if (repeaterIndex + 1 === $w('#activityRepeater').data.length) {
        $w('#moveDown, #moveBottom').disable();
        $w('#moveUp, #moveTop').enable();
    } else {
        $w('#moveDown, #moveBottom').enable();
        if (repeaterIndex === 0) {
            $w('#moveUp, #moveTop').disable();
        } else {
            $w('#moveUp, #moveTop').enable();
        }
    }
    const timeline = wixAnimations.timeline();
    let yOffset;
    yOffset = 84 * repeaterIndex
    timeline.add($w('#contextMenu'), [{ "y": yOffset, "duration": 10 }]).play().onComplete(async () => {
        await $w('#contextMenu').show();
    });
}

export function contextMenu_mouseOut(event) {
    $w('#contextMenu').hide();
}

export function deleteActivity_click(event) {
    return wixData.removeReference("Lessons", "Activities", lesson._id, $w('#activityRepeater').data[contextIndex]._id).then(() => {
        lesson.activityOrder.splice(contextIndex, 1);
        wixData.save("Lessons", lesson);
        let activityRepeaterData = $w('#activityRepeater').data;
        activityRepeaterData.splice(activityRepeaterData.findIndex(obj => obj._id === event.context.itemId), 1);
        $w('#activityRepeater').data = activityRepeaterData;
        //generateSuccess("Activities Succesfully Removed.");
    }).catch((err) => {
        console.log(err)
        //generateError();
    })
}

export function reorderButton_click(event) {
    const timeline = wixAnimations.timeline();
    let yOffset;
    yOffset = 84 * contextIndex;
    timeline.add($w('#reorderBox'), [{ "y": yOffset, "duration": 10 }]).play().onComplete(async () => {
        await $w('#reorderBox').show();
    });
}

export function reorderBox_mouseOut(event) {
    $w('#reOrderBox, #contextMenu').hide('fade', { duration: 100 });
}

export async function moveUp_click(event) {
    const currentItemIndex = contextIndex;
    const activityIdArray = $w('#activityRepeater').data.map((obj) => { return obj._id });
    const reorderedArray = moveArray(activityIdArray, currentItemIndex, currentItemIndex - 1);
    updateSort(currentItemIndex, currentItemIndex - 1);
    contextIndex = currentItemIndex - 1;
    lesson.activityOrder = reorderedArray;
}

async function updateSort(fromIndex, toIndex) {
    let activityRepeaterData = $w('#activityRepeater').data;
    const elm = activityRepeaterData.splice(fromIndex, 1)[0];
    activityRepeaterData.splice(toIndex, 0, elm);
    $w('#activityRepeater').data = activityRepeaterData;
    $w('#reorderBox').hide();
    wixData.update("Lessons", lesson);
}

export function moveDown_click(event) {
    const currentItemIndex = contextIndex;
    const activityIdArray = $w('#activityRepeater').data.map((obj) => { return obj._id });
    const reorderedArray = moveArray(activityIdArray, currentItemIndex, currentItemIndex + 1);
    updateSort(currentItemIndex, currentItemIndex + 1);
    contextIndex = currentItemIndex + 1;
    lesson.activityOrder = reorderedArray;
}

export function moveBottom_click(event) {
    const currentItemIndex = contextIndex;
    const activityIdArray = $w('#activityRepeater').data.map((obj) => { return obj._id });
    const reorderedArray = moveArray(activityIdArray, currentItemIndex, $w('#activityRepeater').data.length - 1);
    updateSort(currentItemIndex, $w('#activityRepeater').data.length - 1);
    contextIndex = $w('#activityRepeater').data.length - 1;
    lesson.activityOrder = reorderedArray;
}

export function moveTop_click(event) {
    const currentItemIndex = contextIndex;
    const activityIdArray = $w('#activityRepeater').data.map((obj) => { return obj._id });
    const reorderedArray = moveArray(activityIdArray, currentItemIndex, 0);
    updateSort(currentItemIndex, 0);
    contextIndex = 0;
    lesson.activityOrder = reorderedArray;
}

/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/

export function addActivity_click(event) {
    $w('#newActivityBox').expand();
}

export function newActivityConfirm_click(event) {
    $w('#newActivityBox').collapse();
    addActivity();
}

async function addActivity() {
    try {
        let newItem = {
            "type": $w('#activityTypeDropdown').value,
            "data": [],
            "title": $w('#newActivityTitleInput').value
        };
        const newActivity = await wixData.insert("Activities", newItem);
        let repeaterData = $w('#activityRepeater').data;
        repeaterData.push(newActivity);
        $w('#activityRepeater').data = repeaterData;
        wixData.insertReference("Activities", "lessons", newActivity._id, lesson._id);
        //wixData.insert("Lesson", {"Activities": [newActivity._id]});
        lesson.activityOrder.push(newActivity._id);
        wixData.update("Lessons", lesson);
        $w('#newActivityTitleInput').value = null;
    } catch (error) {
        throw new Error(error);
    }
}

export function addExistingActivityButton_click(event) {
    wixData.insertReference("Lessons", "Activities", lesson._id, $w('#insertactivityIdInput').value).then(async () => {
        const activityIdList = $w('#activityRepeater').data.map((obj) => obj._id);
        let repeaterData = $w('#activityRepeater').data;
        const newActivity = await wixData.get("Activities", $w('#insertactivityIdInput').value);
        repeaterData.push(newActivity);
        $w('#activityRepeater').data = repeaterData;
        if (!lesson.activityOrder.includes(newActivity._id)) {
            lesson.activityOrder.push(newActivity._id)
        }
        console.log(lesson.activityOrder);
        wixData.save("Lessons", lesson).then(() => {
            $w("#newActivityBox").collapse();
            $w('#insertactivityIdInput').value = '';
        })
    })
}

export async function lessonEnterButton_click(event) {
    const lessonQuery = await wixData.query("Lessons").eq("_id", $w('#lessonIdInput').value).find();
    if (lessonQuery.totalCount > 0) {
        lesson = lessonQuery.items[0];
        $w('#activityDataset').setFilter(wixData.filter().hasSome('lessons', lesson._id)).then(async () => {
            const activityItemsQuery = await $w('#activityDataset').getItems(0, 100);
            const activityItemSorted = sortArray(activityItemsQuery.items, lesson.activityOrder);
            $w('#activityRepeater').data = activityItemSorted;
        });
        $w('#sidebarStatebox').changeState('Activities');
    }
}

export function activityRepeater_itemReady($item, itemData, index) {
    $item('#activityTitleTxt').text = itemData.title;
    $item('#activityTypeTxt').text = itemData.type;
    switch (itemData.type) {
    case 'Quiz':
        $item('#discussionIconRegular, #articleIconRegular').hide();
        $item('#quizIconRegular').show();
        break;
    case 'Discussion':
        $item('#articleIconRegular, #quizIconRegular').hide();
        $item('#discussionIconRegular').show();
        break;
    case 'Article':
        $item('#discussionIconRegular, #quizIconRegular').hide();
        $item('#articleIconRegular').show();
        break;
    }
}

export function lessonIdInput_keyPress(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        if (event.key === "Enter") {
            lessonEnterButton_click();
        }
    }, 10);
}

$w('#iconBox, #activityTitleTxt, #activityTypeTxt').onClick((event) => {
    $w('#activityDataset').setFilter(wixData.filter().eq('_id', event.context.itemId)).then(async () => {
        activity = await $w('#activityDataset').getCurrentItem();
        if (activity.type === 'Quiz') {
            $w('#sidebarStatebox').changeState('Questions');
            $w('#questionRepeater').data = activity.data;
            savedData = activity.data;
        }
    })
});

export function difficultyDropdown_change(event) {
    savedData[currQuestionIndex].difficulty = event.target.value;
    updateData();
}

export function courseTopicSelectionTags_change(event) {
    savedData[currQuestionIndex].topics = event.target.value;
    updateData();
}

export function reorderQuestionsButton_click(event) {
    let $item = $w.at(event.context);
    const repeaterIndex = $w('#questionRepeater').data.findIndex((obj) => obj._id === event.context.itemId);
    if (repeaterIndex + 1 === $w('#questionRepeater').data.length) {
        $item('#moveDownQuestions, #moveBottomQuestions').disable();
        $item('#moveUpQuestions, #moveTopQuestions').enable();
    } else {
        $item('#moveDownQuestions, #moveBottomQuestions').enable();
        if (repeaterIndex === 0) {
            $item('#moveUpQuestions, #moveTopQuestions').disable();
        } else {
            $item('#moveUpQuestions, #moveTopQuestions').enable();
        }
    }
    $w('#reorderQuestionBox').hide();
    $item('#reorderQuestionBox').show();
}

export async function moveUpQuestions_click(event) {
    const currentItemIndex = $w('#questionRepeater').data.findIndex((obj) => obj._id === event.context.itemId);
    const reorderedArray = moveArray($w('#questionRepeater').data, currentItemIndex, currentItemIndex - 1);
    activity.data = reorderedArray;
    updateSortQuestions(currentItemIndex, currentItemIndex - 1, event.context);
}

async function updateSortQuestions(fromIndex, toIndex, context) {
    let $item = $w.at(context);
    let activityRepeaterData = $w('#questionRepeater').data;
    const elm = activityRepeaterData.splice(fromIndex, 1)[0];
    activityRepeaterData.splice(toIndex, 0, elm);
    $w('#questionRepeater').data = activityRepeaterData;
    const repeaterIndex = $w('#questionRepeater').data.findIndex((obj) => obj._id === context.itemId);
    if (repeaterIndex + 1 === $w('#questionRepeater').data.length) {
        $item('#moveDownQuestions, #moveBottomQuestions').disable();
        $item('#moveUpQuestions, #moveTopQuestions').enable();
    } else {
        $item('#moveDownQuestions, #moveBottomQuestions').enable();
        if (repeaterIndex === 0) {
            $item('#moveUpQuestions, #moveTopQuestions').disable();
        } else {
            $item('#moveUpQuestions, #moveTopQuestions').enable();
        }
    }
    wixData.update("Activities", activity);
}

export function moveDownQuestions_click(event) {
    const currentItemIndex = $w('#questionRepeater').data.findIndex((obj) => obj._id === event.context.itemId);
    const reorderedArray = moveArray($w('#questionRepeater').data, currentItemIndex, currentItemIndex + 1);
    activity.data = reorderedArray;
    updateSortQuestions(currentItemIndex, currentItemIndex + 1, event.context);
}

export function moveBottomQuestions_click(event) {
    const currentItemIndex = $w('#questionRepeater').data.findIndex((obj) => obj._id === event.context.itemId);
    const reorderedArray = moveArray($w('#questionRepeater').data, currentItemIndex, $w('#questionRepeater').data.length - 1);
    activity.data = reorderedArray;
    updateSortQuestions(currentItemIndex, $w('#activityRepeater').data.length - 1, event.context);
}

export function moveTopQuestions_click(event) {
    const currentItemIndex = $w('#questionRepeater').data.findIndex((obj) => obj._id === event.context.itemId);
    const reorderedArray = moveArray($w('#questionRepeater').data, currentItemIndex, 0);
    activity.data = reorderedArray;
    updateSortQuestions(currentItemIndex, 0, event.context);
}

export function trueOrFalseRadioButton_click(event) {
    $w('#questionInstructionsInput').value = `<p><b>True</b> or <b>False</b>:</p>`;
    questionInstructionsInput_change();
    let repeaterData = [{
        "_id": generateRandom(6),
        "label": "True",
        "value": $w('#radioOptionsRepeater').data.length + 1,
    }, {
        "_id": generateRandom(6),
        "label": "False",
        "value": $w('#radioOptionsRepeater').data.length + 2,
    }];
    savedData[currQuestionIndex].options = repeaterData.map((obj) => { return { label: obj.label, value: obj._id } });
    updateData();
    $w('#radioOptionsRepeater').data = repeaterData;
}

export async function addQuestionbyId_click(event) {
    const question = await wixData.get("Questions", $w('#questionIdInput').value);
    savedData.push(question.data);
    updateData();
    $w('#questionRepeater').data = savedData;
    $w('#questionIdInput').value = null;
}

export function questionIdInput_keyPress(event) {
    debounceTimer = setTimeout(() => {
        if (event.key === "Enter") {
            addQuestionbyId_click();
        }
    }, 10);
}

export function allowToleranceCheckbox_change(event) {
    if (event.target.checked) {
        $w('#precisionDropdown').expand();
        $w('#precisionDropdown').value = savedData[currQuestionIndex].precision;
    } else {
        $w('#precisionDropdown').collapse();
    }
    savedData[currQuestionIndex].allowTolerance = event.target.checked;
    updateData();
}

export function duplicateQuestionButton_click(event) {
    let questionToDuplicate = Object.assign({}, savedData.find((obj) => obj._id === event.context.itemId));
    questionToDuplicate._id = generateRandom(6);
    savedData.push(questionToDuplicate);
    updateData();
    $w('#questionRepeater').data = savedData;
}