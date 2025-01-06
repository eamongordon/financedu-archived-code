import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { getRouterData, getBoundingRect } from 'wix-window';
import { formFactor } from 'wix-window';
import { timeline } from 'wix-animations-frontend';

let activityIndexNum;
let questiondata;
let quizIndexNum = -1;
let submission;
let quizquestionId;
let activities;
let debounceTimer;
let activityparam = Number(wixLocation.query.activity);
let assignment;
let quizscore = 0;
let isQuizRetake = false;

$w.onReady(async function () {
    assignment = getRouterData().assignment;
    activities = getRouterData().activities;
    submission = getRouterData().submission;
    activityIndexNum = activityparam || 0;
    $w('#assignmentTitleTxt').text = assignment.title;
    $w('#backButton').link = `/class/${assignment.class}/student`;
    if (formFactor === 'Mobile') {
        $w('#backButton').show();
    } else {
        const timelineBreadcrumbs = timeline();
        const windowInfo = await getBoundingRect();
        let xOffset = -(windowInfo.window.width - 980) / 2 + ((windowInfo.window.width - 980) * 0.115);
        timelineBreadcrumbs.add($w('#backButton'), [{ "x": xOffset, "duration": 10 }]).play().onComplete(async () => {
            await $w('#backButton').show();
        });
    }
    try {
        if (!activityparam && activityparam !== 0 && submission.data.length > 0) {
            const completedActivitiesIds = submission.data.filter((obj) => obj.completed === true).map((obj) => { return obj._id });
            const correspondingActivityIndex = activities.items.findLastIndex((obj) => completedActivitiesIds.includes(obj._id)) + 1;
            if (correspondingActivityIndex !== -1 && correspondingActivityIndex < activities.totalCount) {
                activityIndexNum = correspondingActivityIndex;
            }
        }
        setUpActivities();
    } catch (error) {
        console.log(error);
    }

    function setUpActivities() {
        insertActivities(activityparam).then(async function () {
            $w('#activityRepeater').data = activities.items;
            if (activityIndexNum !== 0) {
                editRepeater($w('#activityRepeater').data[activityIndexNum]._id /*(await $w('#activitiesDataset').getItems(0, 10)).items[0]._id*/ );
            }
            updatequestion();
            $w('#completedBar').targetValue = activities.totalCount;
            checkassignmentCompletion();
        });
    }
});

const padding = (text) => {
    if (formFactor === 'Mobile') {
        if (text.length > 27) {
            return 0;
        } else {
            return 9;
        }
    } else {
        if (text.length > 18) {
            return 0;
        } else {
            return 11;
        }
    }
}

async function updatequestion() {
    $w('#activityName').text = activities.items[activityIndexNum].title;
    $w('#activityType').text = activities.items[activityIndexNum].type;
    switch (activities.items[activityIndexNum].type) {
    case 'Quiz':
        isQuizRetake === false;
        $w('#articleIconBig, #discussionIconBig').hide();
        $w('#quizIconBig').show();
        $w('#nextActivity').collapse();
        setUpQuiz() //.then(() => {$w('#activityStateBox').changeState('Quiz')})
        break;
    case 'Article':
        $w('#quizIconBig, #discussionIconBig').hide();
        $w('#articleIconBig').show();
        setUpArticle() //.then(() => {$w('#activityStateBox').changeState('Article')})
        break;
    case 'Discussion':
        $w('#quizIconBig, #articleIconBig').hide();
        $w('#discussionIconBig').show();
        break;
    }
    if (activityIndexNum + 1 === activities.totalCount) {
        $w('#nextActivity').label = 'Continue';
        $w('#nextActivity').style.backgroundColor = '#13C402';
    } else {
        $w('#nextActivity').label = 'Next Activity';
        $w('#nextActivity').style.backgroundColor = '#00B5EA';
    }
    $w('#activityStateBox').changeState(activities.items[activityIndexNum].type);
}

async function insertActivities(indexnum) {
    if (!submission.data.some(obj => obj._id === activities.items[activityIndexNum]._id)) {
        let newElement;
        console.log(activities);
        console.log(activityIndexNum);
        if (activities.items[activityIndexNum].type === 'Quiz') {
            newElement = {
                _id: activities.items[activityIndexNum]._id,
                startedDate: new Date(),
                completed: false,
                questions: [],
            };
        } else if (activities.items[activityIndexNum].type === 'Article') {
            newElement = {
                _id: activities.items[activityIndexNum]._id,
                startedDate: new Date(),
                completed: true,
                completedDate: new Date()
            }
        } else {
            newElement = {
                _id: activities.items[activityIndexNum]._id,
                startedDate: new Date(),
                completed: false,
            }
        }
        submission.data.push(newElement);
        return wixData.save("AssignmentSubmissions", submission).then(() => {
            Promise.resolve();
        }).catch((error) => {
            Promise.reject(error);
        })
        //});
    } else {
        Promise.resolve();
    }
}

function saveQuizData(type, markComplete) {
    let activitySubmissionDataIndex = submission.data.findIndex(obj => obj._id === activities.items[activityIndexNum]._id);

    function updateResponseData(responsevalue) {
        submission.data[activitySubmissionDataIndex].questions = submission.data[activitySubmissionDataIndex].questions.map((obj, index) => {
            if (obj._id === quizquestionId) {
                return { ...obj, response: responsevalue };
            }
            return obj;
        });
    }

    function createResponseData(responsevalue) {
        const newElement = {
            response: responsevalue,
            _id: quizquestionId
        };
        submission.data[activitySubmissionDataIndex].questions.push(newElement);
    }

    function deleteResponseData() {
        const indextoDelete = submission.data[activitySubmissionDataIndex].questions.findIndex(obj => obj._id === quizquestionId);
        submission.data[activitySubmissionDataIndex].questions = submission.data[activitySubmissionDataIndex].questions.splice(indextoDelete, 1);
    }

    function evalResponseData(responsevalue) {
        if (responsevalue.length > 0) {
            if (submission.data[activitySubmissionDataIndex].questions.some(obj => obj._id === quizquestionId)) {
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
    case 'info':
        if (!submission.data[activitySubmissionDataIndex].questions.some(obj => obj._id === quizquestionId)) {
            submission.data[activitySubmissionDataIndex].questions.push({ _id: quizquestionId });
        }
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
    case 'fileupload':
        break;
    }
    if (markComplete) {
        const activitiesId = activities.items[activityIndexNum]._id;
        const submissionDataActivityIndex = submission.data.findIndex((obj) => obj._id === activitiesId);
        if (submission.data[submissionDataActivityIndex].completed === false) {
            submission.data[submissionDataActivityIndex].completed = true;
            submission.data[submissionDataActivityIndex].completedDate = new Date();
            wixData.save("AssignmentSubmissions", submission);
        }
        setUpQuizReview();
    } else {
        wixData.save("AssignmentSubmissions", submission);
    }
}

async function setUpQuiz(infoobj) {
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
    $w('#progressBar').targetValue = activities.items[activityIndexNum].data.length;
    $w('#progressBar').value = quizIndexNum;
    quizquestionId = activities.items[activityIndexNum].data[quizIndexNum]._id;
    questiondata = activities.items[activityIndexNum].data[quizIndexNum];
    let activitySubmissionDataIndex = submission.data.findIndex(obj => obj._id === activities.items[activityIndexNum]._id);
    const activityResponsesArray = submission.data[activitySubmissionDataIndex].questions.filter(obj => obj._id === quizquestionId);
    const activityResponseData = activityResponsesArray[0];
    if (!submission.data[activitySubmissionDataIndex].completed === true || isQuizRetake === true) {
        isQuizRetake = false;
        switch (questiondata.type) {
        case 'text':
            $w('#instructtext').html = activities.items[activityIndexNum].data[quizIndexNum].instructions;
            if (activityResponsesArray.length > 0) {
                $w('#responsetext').value = activityResponseData.response
            } else {
                $w('#responsetext').value = activities.items[activityIndexNum].data[quizIndexNum]?.placeholder;
            }
            $w('#quizstatebox').changeState('text');
            break;
        case 'radio':
            $w('#responseradio').options = activities.items[activityIndexNum].data[quizIndexNum].options;
            $w('#instructquiz').html = activities.items[activityIndexNum].data[quizIndexNum].instructions;
            if (activityResponsesArray.length > 0) { $w('#responseradio').value = activityResponseData.response }
            $w('#quizstatebox').changeState('radio');
            break;
        case 'dropdown':
            $w('#responsedropdown').options = activities.items[activityIndexNum].data[quizIndexNum].options;
            $w('#instructdropdown').html = activities.items[activityIndexNum].data[quizIndexNum].instructions;
            if (activityResponsesArray.length > 0) { $w('#responsedropdown').value = activityResponseData.response }
            $w('#quizstatebox').changeState('dropdown');
            break;
        case 'number':
            $w('#instructnumber').html = activities.items[activityIndexNum].data[quizIndexNum].instructions;
            if (activityResponsesArray.length > 0) { $w('#responsenumber').value = activityResponseData.response }
            $w('#quizstatebox').changeState('number');
            break;
        case 'multiselect':
            $w('#responsemultiselect').options = activities.items[activityIndexNum].data[quizIndexNum].options;
            $w('#instructmultiselect').html = activities.items[activityIndexNum].data[quizIndexNum].instructions;
            if (activityResponsesArray.length > 0) { $w('#responsemultiselect').value = activityResponseData.response }
            $w('#quizstatebox').changeState('multiselect');
            break;
        case 'link':
            $w('#instructlink').html = activities.items[activityIndexNum].data[quizIndexNum].instructions;
            if (activityResponsesArray.length > 0) { $w('#responseradio').value = activityResponseData.response }
            validatelink();
            $w('#quizstatebox').changeState('link');
            break;
        case 'matching':
            $w('#matchingInstructionsTxt').html = activities.items[activityIndexNum].data[quizIndexNum].instructions;
            $w('#matchingRepeater').data = activities.items[activityIndexNum].data[quizIndexNum].questions.map((obj) => { return { ...obj, _id: obj.value } });
            $w('#matchingDropdown').options = activities.items[activityIndexNum].data[quizIndexNum].responseoptions;
            $w('#quizstatebox').changeState('matching');
            break;
        case 'info':
            $w('#instructinfo').html = activities.items[activityIndexNum].data[quizIndexNum].instructions;
            $w('#quizstatebox').changeState('info');
            break;
        case 'fileupload':
            break;
        }
    } else {
        setUpQuizReview();
    }
    Promise.resolve();
}

async function setUpDiscussion() {
    /*
    $w('#membersDataset').onReady(() => {
        $w('#discussionsDataset').setFilter(wixData.filter().eq('_id', wixUsers.currentUser.id))
            .then(() => {
                $w('#classesDataset').refresh();
                $w('#discussionsDataset').refresh();
            });
        $w('#discussionsDataset').onReady(() => {
            $w("#discussionsDataset").setCurrentItemIndex(activityIndexNum);
        });
        $w('#statebox').changeState('discussion');
    });
    */
}

async function setUpArticle() {
    $w('#articleRichContent').value = activities.items[activityIndexNum].richContent;
    $w('#activityStateBox').changeState('Article');
    $w('#nextActivity').expand();
}

export function responsetext_change(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        saveQuizData(activityIndexNum);
    }, 500);
}

export function responseradio_change(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        saveQuizData(activityIndexNum);
    }, 500);
}

export function responsedropdown_change(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        saveQuizData(activityIndexNum);
    }, 500);
}

export function responsemultiselect_change(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        saveQuizData(activityIndexNum);
    }, 500);
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
    if (quizIndexNum + 1 === activities.items[activityIndexNum].data.length) {
        saveQuizData($w('#quizstatebox').currentState.id, true);
    } else {
        saveQuizData($w('#quizstatebox').currentState.id);
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

export function activityRepeater_itemReady($item, itemData, index) {
    if (formFactor !== 'Mobile') {
        $w('#activitySelectColumn').expand();
    }
    $w('#activityTitleGroup, #saveandExit').expand();
    $item('#activityTitleTxt').text = itemData.title;
    const submissionArrayFiltered = submission.data.filter(obj => obj._id === itemData._id);
    if (submissionArrayFiltered.length > 0) {
        if (submissionArrayFiltered[0].completed === true && index !== activityIndexNum) {
            $item('#iconBox').style.backgroundColor = '#13C402';
            $item('#activityTitleTxt').html = `<h4 style="color: #13C402; font-size:18px; padding: ${padding(itemData.title)}px 0;">${itemData.title}</h4>`;
        }
    }
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
    /*
    if (formFactor !== 'Mobile' && index === 0) {
            const savedData = $w('#activityRepeater').data;
            $w('#activityRepeater').data = [];
            setTimeout(() => {
                $w('#activityRepeater').data = savedData;
                $w('#assignmentsDataset').setCurrentItemIndex(index);
                $w('#assignmentTitleTxt').html = `<h5 style="color: #00A2FF; font-size:20px;">${itemData.title}</h5>`;
                $w('#moduleTxt').html = `<p style="color: #00A2FF; font-size:16px;"><span style="font-size:16px;">${module.title}</span></p>`
                $w('#selectedLine').show();
            });
    }
    */
    if (index === 0 && activityIndexNum === 0) {
        editRepeater(itemData._id);
    }
    $item('#activityContainer').onClick((event) => {
        activityIndexNum = index;
        editRepeater(itemData._id);
        activityIndexChange();
    });
}

function editRepeater(itemId) {
    /*
    if (formFactor === 'Mobile') {
        $w('#assignmentColumn').collapse();
        $w('#materialsColumn').expand();
    }
    */
    $w("#activityRepeater").forEachItem(($item, itemData, index) => {
        if (itemData._id === itemId) {
            $item('#iconBox').style.backgroundColor = '#00A2FF';
            $item('#activityTitleTxt').html = `<h4 style="color: #00A2FF; font-size:18px; padding: ${padding(itemData.title)}px 0;">${itemData.title}</h4>`;
        } else {
            const activitySubmissionDataIndex = submission.data.findIndex(obj => obj._id === itemData._id);
            if (activitySubmissionDataIndex !== -1) {
                if (submission.data[activitySubmissionDataIndex].completed === true && index !== activityIndexNum) {
                    $item('#iconBox').style.backgroundColor = '#13C402';
                    $item('#activityTitleTxt').html = `<h4 style="color: #13C402; font-size:18px; padding: ${padding(itemData.title)}px 0;">${itemData.title}</h4>`;

                } else {
                    $item('#iconBox').style.backgroundColor = '#7F808A';
                    $item('#activityTitleTxt').html = `<h4 style="color: #000000; font-size:18px; padding: ${padding(itemData.title)}px 0;">${itemData.title}</h4>`;
                }
            } else {
                $item('#iconBox').style.backgroundColor = '#7F808A';
                $item('#activityTitleTxt').html = `<h4 style="color: #000000; font-size:18px; padding: ${padding(itemData.title)}px 0;">${itemData.title}</h4>`;
            }
        }
    });
}

async function setUpQuizReview() {
    $w('#nextActivity').expand();
    $w("#prevButton").collapse();
    $w('#progressBar').value = $w('#progressBar').targetValue;
    $w('#nextButton').collapse();
    $w("#quizReviewRepeater").data = [];
    $w("#quizReviewRepeater").data = activities.items[activityIndexNum].data;
    checkassignmentCompletion();
}

export function schooleditButton_click(event) {
    quizIndexNum = Number(event.context.itemId.slice(0, 1)) - 1;
    setUpQuiz();
}

function activityIndexChange() {
    quizIndexNum = 0;
    wixLocation.queryParams.add({ activity: activityIndexNum });
    if ($w('#activityTitleGroup').collapsed) {
        $w('#activityTitleGroup, #nextActivity, #saveandExit').expand();
    }
    return insertActivities(activityIndexNum).then(() => {
        updatequestion();
        checkassignmentCompletion();
        Promise.resolve();
    });
}

function checkassignmentCompletion() {
    const completedActivitiesLength = submission.data.filter(obj => obj.completed === true).length;
    const activityCount = activities.totalCount;
    $w('#completedBar').value = completedActivitiesLength;
    $w('#assignmentCompletedAmounTxt').text = `${completedActivitiesLength}/${activityCount} Completed`;

    if (completedActivitiesLength === activityCount) {
        $w('#submitSecondButton').enable();
        const activitySubmissionDataIndex = submission.data.findIndex(obj => obj._id === activities.items[activityIndexNum]._id);
        if (submission.data[activitySubmissionDataIndex].completed === false) {
            submission.data[activitySubmissionDataIndex].completed = true;
            submission.data[activitySubmissionDataIndex].completedDate = new Date();
            wixData.save("AssignmentSubmissions", submission);
        }
    }
}

export function matchingRepeater_itemReady($item, itemData) {
    $item('#matchinginstructionText').text = itemData.label;
    const activitySubmissionDataIndex = submission.data.findIndex(obj => obj._id === activities.items[activityIndexNum]._id);
    const activityResponsesArray = submission.data[activitySubmissionDataIndex].questions.filter(obj => obj._id === quizquestionId);
    const activityResponseData = activityResponsesArray[0];
    if (activityResponsesArray.length > 0 && activityResponseData?.response.filter((obj) => obj._id === itemData._id)[0].response) {
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
    prevButton_click();
}

export function nextActivity_click(event) {
    activityIndexNum++;
    if (activityIndexNum === activities.totalCount) {
        submitSecondButton_click();
    } else {
        $w('#activityTitleGroup').scrollTo();
        activityIndexChange().then(() => {
            editRepeater($w('#activityRepeater').data[activityIndexNum]._id);
        });
    }
}

export async function submitSecondButton_click(event) {
    $w('#activityTitleGroup, #nextActivity, #saveandExit').collapse();
    $w('#submitSecondButton').disable();
    $w('#activityStateBox').changeState('Finished');
}

export function quizReviewRepeater_itemReady($item, itemData, index) {
    $item('#quizreviewinstructions').html = itemData.instructions;
    const activitySubmissionDataIndex = submission.data.findIndex(obj => obj._id === activities.items[activityIndexNum]._id);
    if (submission.data[activitySubmissionDataIndex].questions.some(obj => obj._id === itemData._id)) {
        const activityResponseData = submission.data[activitySubmissionDataIndex].questions.filter(obj => obj._id === itemData._id)[0];
        if (itemData.type === 'link' || itemData.type === 'fileupload') {
            $item('#quizResponseTxt').text = activityResponseData.response;
        } else if (itemData.type === 'text') {
            $item('#quizResponseTxt').html = activityResponseData.response;
        } else if (itemData.type === 'multiselect') {
            const filteredoptionsobjArray = itemData.options.filter(option => activityResponseData.response.includes(option.value));
            const filteredoptionsArray = filteredoptionsobjArray.map(option => { return option.label });
            $item('#quizResponseTxt').text = filteredoptionsArray.toString().split(',').join(', ');
        } else if (itemData.type === 'matching') {
            let matchingScore = 0;
            let tableArray = [];
            itemData.questions.forEach((question, index) => {
                const matchingresponse = activityResponseData.response.filter((obj) => obj._id === question.value)[0];
                const matchingResponseIndex = itemData.responseoptions.findIndex((responseoption) => responseoption.value === matchingresponse.response);
                const matchingAnswerIndex = itemData.responseoptions.findIndex((responseoption) => responseoption.value === question.answer);
                let textColor;
                if (question.answer === matchingresponse.response) {
                    textColor = '#13C402';
                    matchingScore++;
                } else {
                    textColor = '#ff412b';
                }
                const selectedText = `<p style="color: ${textColor}; font-size:14px;"><span style="font-size:14px;">${itemData.responseoptions[matchingResponseIndex]?.label || 'No Response'}</span></p>`;
                tableArray.push({ "prompt": question.label, "selected": selectedText });
                if (index + 1 === itemData.questions.length) {
                    $w('#matchingTable').rows = tableArray;
                    $item('#matchingTable').expand();
                    //$item('#responseLabel, #quizResponseTxt, #correctLabel').hide();
                }
            })

        } else if (itemData.type === 'number') {
            $item('#quizResponseTxt').text = activityResponseData.response.toString();
            $item('#quizResultCorrectAnswer').text = itemData.answer.toString();
        } else if (itemData.type === 'info') {
            $item('#quizResultCorrectAnswer, #correctLabel, #responseLabel, #quizResponseTxt').collapse();
        } else {
            const filteredoptions = itemData.options.filter(obj => obj.value === activityResponseData.response);
            $item('#quizResponseTxt').text = filteredoptions[0].label;
        }
    } else {
        $item('#quizResponseTxt').html = '<p style="line-height:normal; font-size:18px; color: #FF0000;"><span style="letter-spacing:normal;"><span>No Response</span></span></p>';
    }
    $item('#quizrepeaterNumber').text = (index + 1).toString();
    if (index + 1 === $w('#quizReviewRepeater').data.length) {
        $w('#quizstatebox').changeState('review');
    }
}

export function matchingDropdown_change(event) {
    saveQuizData('matching');
}

export function mobileActivitiesButton_click(event) {
    if ($w('#activitySelectColumn').collapsed) {
        $w('#activitySelectColumn').expand();
        $w('#mobileActivitiesButton').label = "Hide All Activities";
    } else {
        $w('#activitySelectColumn').collapse();
        $w('#mobileActivitiesButton').label = "Show All Activities";
    }
}

export async function saveandExit_click(event) {
    wixLocation.to(`/class/${assignment['class']._id}/view`)
}

export function editQuestionButton_click(event) {
    quizIndexNum = $w('#quizReviewRepeater').data.findIndex((obj) => event.context.itemId === obj._id);
    isQuizRetake = true;
    setUpQuiz();
}

export function submitAssignment_click(event) {
    $w('#submitAssignment').disable();
    submission.submitted = true;
    submission.submittedDate = new Date();
    return wixData.update("AssignmentSubmissions", submission).then(() => {
        wixLocation.to(`/class/${assignment['class']}/student`);
    }).catch((error) => {
        console.log(error);
    });
}

export function reviewAnswersButton_click(event) {
    activityIndexNum = 0;
    editRepeater($w('#activityRepeater').data[0]._id);
    activityIndexChange();
}