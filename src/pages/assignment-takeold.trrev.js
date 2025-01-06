import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { getRouterData } from 'wix-window';
import { formFactor } from 'wix-window'

let activityIndexNum;
let questiondata;
let quizIndexNum = -1;
let submission;
let quizquestionId;
let activities;
let debounceTimer;
let activityparam = Number(wixLocation.query.activity);
let buttonClickCount = null;
let edit = false;
let lesson;
let quizscore = 0;
let gradingComplete = true;
let isQuizRetake = false;

let lessonIndex;

$w.onReady(async function () {
    lesson = getRouterData().lesson;
    activities = getRouterData().activities;
    console.log(activities);
    activityIndexNum = activityparam || 0;
    $w('#lessonTitleTxt').text = lesson.title;
    try {
        const learnerSubmissionQuery = await wixData.query("LearnerSubmissionData").eq("course", wixLocation.query.course).find()
        if (learnerSubmissionQuery.length > 0) {
            submission = learnerSubmissionQuery.items[0];
            if (submission.data.some(obj => obj.lessonId === lesson._id)) {
                lessonIndex = submission.data.findIndex(obj => obj.lessonId === lesson._id);
                if (!activityparam && activityparam !== 0) {
                    //const lastCompletedActivity = /*submission.data.activities[submission.data.activities.map((obj) => obj.completed === true).lastIndexOf(true)];*/ submission.data[lessonIndex].activities.findLast((obj) => obj.completed === true);
                    const completedActivitiesIds = submission.data[lessonIndex].activities.filter((obj) => obj.completed === true).map((obj) => { return obj._id });
                    console.log(completedActivitiesIds)
                    const correspondingActivityIndex = activities.items.findLastIndex((obj) => completedActivitiesIds.includes(obj._id)) + 1;
                    if (correspondingActivityIndex !== -1 && correspondingActivityIndex < activities.totalCount) {
                        activityIndexNum = correspondingActivityIndex;
                    }
                }
                setUpActivities();
            } else {
                const newElement = {
                    lessonId: lesson._id,
                    startedDate: new Date(),
                    completed: false,
                    activities: []
                }
                submission.data.push(newElement);
                lessonIndex = submission.data.length - 1;
                wixData.save("LearnerSubmissionData", submission).then(() => {
                    setUpActivities();
                })
            }
        } else {
            //No Submission Existing
            const newLessonArray = [{
                lessonId: lesson._id,
                startedDate: new Date(),
                completed: false,
                activities: []
            }]
            wixData.save("LearnerSubmissionData", {
                data: newLessonArray,
                course: wixLocation.query.course
            }).then((item) => {
                submission = item;
                lessonIndex = 0;
                setUpActivities();
            });
        }
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
            checkLessonCompletion();
        });
    }
});

async function updatequestion() {
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
        $w('#nextActivity').label = 'Next Lesson';
        $w('#nextActivity').style.backgroundColor = '#13C402';
    } else {
        $w('#nextActivity').label = 'Next Activity';
        $w('#nextActivity').style.backgroundColor = '#00B5EA';
    }
    console.log('updateQuestion' + activities.items[activityIndexNum].type);
    $w('#activityStateBox').changeState(activities.items[activityIndexNum].type);
    //}, 200);
}

async function insertActivities(indexnum) {
    console.log('activities.items[activityIndexNum]' + activities.items[activityIndexNum].type);
    console.log('le' + lessonIndex);
    console.log('submissiondata');
    if (!submission.data[lessonIndex].activities.some(obj => obj._id === activities.items[activityIndexNum]._id)) {
        let newElement;
        console.log(activities.items[activityIndexNum]);
        if (activities.items[activityIndexNum].type === 'Quiz') {
            newElement = {
                activityId: activities.items[activityIndexNum]._id,
                startedDate: new Date(),
                completed: false,
                questions: [],
            };
        } else if (activities.items[activityIndexNum].type === 'Article') {
            newElement = {
                activityId: activities.items[activityIndexNum]._id,
                startedDate: new Date(),
                completed: true,
                completedDate: new Date()
            }
        } else {
            newElement = {
                activityId: activities.items[activityIndexNum]._id,
                startedDate: new Date(),
                completed: false,
            }
        }
        submission.data[lessonIndex].activities.push(newElement);
        return wixData.save("LearnerSubmissionData", submission).then(() => {
            Promise.resolve();
        }).catch((error) => {
            console.error(error);
            Promise.reject(error);
        })
        //});
    } else {
        Promise.resolve();
    }
}

async function markActivityComplete() {
    submission.data[lessonIndex].activities = submission.data[lessonIndex].activities.map(obj => {
        if (obj._id === activities.items[activityIndexNum]._id) {
            return { ...obj, completed: true, completedDate: new Date() };
        }
        return obj;
    });
    wixData.save("LearnerSubmissionData", submission);
}

function saveQuizData(type, markComplete) {
    let activitySubmissionDataIndex = submission.data[lessonIndex].activities.findIndex(obj => obj._id === activities.items[activityIndexNum]._id);

    function updateResponseData(responsevalue) {
        console.log(submission.data[lessonIndex].activities[activitySubmissionDataIndex]);
        submission.data[lessonIndex].activities[activitySubmissionDataIndex].questions = submission.data[lessonIndex].activities[activitySubmissionDataIndex].questions.map((obj, index) => {
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
        submission.data[lessonIndex].activities[activitySubmissionDataIndex].questions.push(newElement);
    }

    function deleteResponseData() {
        const indextoDelete = submission.data[lessonIndex].activities[activitySubmissionDataIndex].questions.findIndex(obj => obj._id === quizquestionId);
        submission.data[lessonIndex].activities[activitySubmissionDataIndex].questions = submission.data[lessonIndex].activities[activitySubmissionDataIndex].questions.splice(indextoDelete, 1);
    }

    function evalResponseData(responsevalue) {
        if (responsevalue.length > 0) {
            if (submission.data[lessonIndex].activities[activitySubmissionDataIndex].questions.some(obj => obj._id === quizquestionId)) {
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
        console.log('filesubmitted');
        break;
    }
    //setTimeout(() => {
    if (markComplete) {
        const activitiesId = activities.items[activityIndexNum]._id;
        const submissionDataActivityIndex = submission.data[lessonIndex].activities.findIndex((obj) => obj._id === activitiesId);
        if (submission.data[lessonIndex].activities[submissionDataActivityIndex].completed === false) {
            submission.data[lessonIndex].activities[submissionDataActivityIndex].completed = true;
            submission.data[lessonIndex].activities[submissionDataActivityIndex].completedDate = new Date();
            wixData.save("LearnerSubmissionData", submission);
        }
        setUpQuizResults();
        /*
        submission.data[lessonIndex].activities = submission.data[lessonIndex].activities.map(obj => {
            if (obj._id === activitiesId && obj.completed !== true) {
                return { ...obj, completed: true, completedDate: new Date() };
            }
            return obj;
        });
        */
    } else {
        wixData.save("LearnerSubmissionData", submission);
    }
    //}, 500);
}

/*
function bulksaveQuizData() {
    submission.data.forEach((element, index) => {
        // Filter Edited Submission Data Array Element to match Submission Data Array Element
        const filteredarray = editedsubmissionData.filter(obj => obj.id === submission.data[index].id)
        // If Edited Submision Data still has object that matches Submission Data Array Element
        if (editedsubmissionData.some(obj => obj.id === submission.data[index].id)) {
            //Update the Element
            element = filteredarray[0];
        }
    });
    $w("#submissionsDataset").setFieldValues({
        "data": submission.data,
        ,
    });
    $w('#lastsavedtext').text = 'Last Saved: ' + submission.lastSaved.toLocaleString();
}
*/

async function setUpQuiz(infoobj) {
    if (quizIndexNum === -1) {
        quizIndexNum = quizIndexNum + 1;
        $w('#prevButton').collapse();
    } else if (quizIndexNum === 0) {
        $w('#prevButton').collapse();
    } else {
        $w('#nextButton').expand();
    }
    $w('#nextButton').expand();
    $w('#progressBar').targetValue = activities.items[activityIndexNum].data.length;
    $w('#progressBar').value = quizIndexNum;
    quizquestionId = activities.items[activityIndexNum].data[quizIndexNum]._id;
    questiondata = activities.items[activityIndexNum].data[quizIndexNum];
    let activitySubmissionDataIndex = submission.data[lessonIndex].activities.findIndex(obj => obj._id === activities.items[activityIndexNum]._id);
    const activityResponsesArray = submission.data[lessonIndex].activities[activitySubmissionDataIndex].questions.filter(obj => obj._id === quizquestionId);
    console.log(submission.data[lessonIndex].activities[activitySubmissionDataIndex].questions);
    const activityResponseData = activityResponsesArray[0];
    if (!submission.data[lessonIndex].activities[activitySubmissionDataIndex].completed === true || isQuizRetake === true) {
        switch (questiondata.type) {
        case 'text':
            $w('#instructtext').text = activities.items[activityIndexNum].data[quizIndexNum].instructions;
            if (activityResponsesArray.length > 0) { $w('#responsetext').value = activityResponseData.response }
            $w('#quizstatebox').changeState('text');
            break;
        case 'radio':
            $w('#responseradio').options = activities.items[activityIndexNum].data[quizIndexNum].options;
            $w('#instructquiz').text = activities.items[activityIndexNum].data[quizIndexNum].instructions;
            if (activityResponsesArray.length > 0) { $w('#responseradio').value = activityResponseData.response }
            $w('#quizstatebox').changeState('radio');
            break;
        case 'dropdown':
            console.log(activities.items[activityIndexNum].data[quizIndexNum].options);
            $w('#responsedropdown').options = activities.items[activityIndexNum].data[quizIndexNum].options;
            $w('#instructdropdown').text = activities.items[activityIndexNum].data[quizIndexNum].instructions;
            if (activityResponsesArray.length > 0) { $w('#responsedropdown').value = activityResponseData.response }
            $w('#quizstatebox').changeState('dropdown');
            break;
        case 'multiselect':
            $w('#responsemultiselect').options = activities.items[activityIndexNum].data[quizIndexNum].options;
            $w('#instructmultiselect').text = activities.items[activityIndexNum].data[quizIndexNum].instructions;
            if (activityResponsesArray.length > 0) { $w('#responsemultiselect').value = activityResponseData.response }
            $w('#quizstatebox').changeState('multiselect');
            break;
        case 'link':
            $w('#instructlink').text = activities.items[activityIndexNum].data[quizIndexNum].instructions;
            if (activityResponsesArray.length > 0) { $w('#responseradio').value = activityResponseData.response }
            validatelink();
            $w('#quizstatebox').changeState('link');
            break;
        case 'matching':
            $w('#matchingInstructionsTxt').text = activities.items[activityIndexNum].data[quizIndexNum].instructions;
            $w('#matchingRepeater').data = activities.items[activityIndexNum].data[quizIndexNum].questions.map((obj) => { return { ...obj, _id: obj.value } });
            $w('#matchingDropdown').options = activities.items[activityIndexNum].data[quizIndexNum].responseoptions;
            $w('#quizstatebox').changeState('matching');
            break;
        case 'fileupload':
            console.log('filesubmitted');
            break;
        }
    } else {
        setUpQuizResults();
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
    $w('#activityTitleGroup, #saveandExit').show();
    $item('#activityTitleTxt').text = itemData.title;
    const submissionArrayFiltered = submission.data[lessonIndex].activities.filter(obj => obj._id === itemData._id);
    if (submissionArrayFiltered.length > 0) {
        if (submissionArrayFiltered[0].completed === true && index !== activityIndexNum) {
            $item('#iconBox').style.backgroundColor = '#13C402';
            $item('#activityTitleTxt').html = `<h4 style="color: #13C402; font-size:18px;">${itemData.title}</h4>`;
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
                $w('#lessonsDataset').setCurrentItemIndex(index);
                $w('#lessonTitleTxt').html = `<h5 style="color: #00A2FF; font-size:20px;">${itemData.title}</h5>`;
                $w('#moduleTxt').html = `<p style="color: #00A2FF; font-size:16px;"><span style="font-size:16px;">${module.title}</span></p>`
                $w('#selectedLine').show();
            });
    }
    */
    if (index === 0 && activityIndexNum === 0) {
        console.log('EDITREPEATE');
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
        $w('#lessonColumn').collapse();
        $w('#materialsColumn').expand();
    }
    */
    $w("#activityRepeater").forEachItem(($item, itemData, index) => {
        if (itemData._id === itemId) {
            console.log('YES IS' + itemId);
            $item('#iconBox').style.backgroundColor = '#00A2FF';
            $item('#activityTitleTxt').html = `<h4 style="color: #00A2FF; font-size:18px;">${itemData.title}</h4>`;
        } else {
            const activitySubmissionDataIndex = submission.data[lessonIndex].activities.findIndex(obj => obj._id === itemData._id);
            if (activitySubmissionDataIndex !== -1) {
                if (submission.data[lessonIndex].activities[activitySubmissionDataIndex].completed === true && index !== activityIndexNum) {
                    console.log("DONE!");
                    console.log(activitySubmissionDataIndex);
                    console.log(submission.data[lessonIndex].activities[activitySubmissionDataIndex]);
                    $item('#iconBox').style.backgroundColor = '#13C402';
                    $item('#activityTitleTxt').html = `<h4 style="color: #13C402; font-size:18px;">${itemData.title}</h4>`;

                } else {
                    $item('#iconBox').style.backgroundColor = '#7F808A';
                    $item('#activityTitleTxt').html = `<h4 style="color: #000000; font-size:18px;">${itemData.title}</h4>`;
                }
            } else {
                $item('#iconBox').style.backgroundColor = '#7F808A';
                $item('#activityTitleTxt').html = `<h4 style="color: #000000; font-size:18px;">${itemData.title}</h4>`;
            }
        }
    });
}

async function setUpQuizResults() {
    $w('#nextActivity').expand();
    //markActivityComplete();
    $w('#progressBar').value = $w('#progressBar').targetValue;
    $w('#progressBarScore').targetValue = activities.items[activityIndexNum].data.length;
    $w('#outofScoreNumber').text = activities.items[activityIndexNum].data.length.toString();
    $w('#nextButton').collapse();
    $w("#quizResultRepeater").data = [];
    $w("#quizResultRepeater").data = activities.items[activityIndexNum].data;
    $w('#nextActivity').expand();
    checkLessonCompletion();
    /*
    $w("#quizResultRepeater").forEachItem(async function ($item, itemData, index) {
        $item('#quizresultinstructions').text = itemData.instructions;
        const activitySubmissionDataIndex = submission.data[lessonIndex].activities.findIndex(obj => obj._id === activities.items[activityIndexNum]._id);
        if (submission.data[lessonIndex].activities[activitySubmissionDataIndex].questions.some(obj => obj._id === itemData._id)) {
            const activityResponseData = submission.data[lessonIndex].activities[activitySubmissionDataIndex].questions.filter(obj => obj._id === itemData._id)[0];
            console.log(activityResponseData);
            if (itemData.type === 'link' || itemData.type === 'fileupload') {
                $item('#quizResponseTxt').text = activityResponseData.response;
            } else if (itemData.type === 'text') {
                $item('#quizResponseTxt').html = activityResponseData.response;
                $item('#quizResultCorrectAnswer, #correctLabel').collapse();
            } else if (itemData.type === 'multiselect') {
                const filteredoptionsobjArray = itemData.options.some(obj => activityResponseData.response.includes(obj.value));
                const filteredoptionsArray = filteredoptionsobjArray.options.map(option => { option.label });
                const filteredanswersobjArray = itemData.options.some(obj => itemData.answer.includes(obj.value));
                const filteredanswersArray = filteredanswersobjArray.options.map(option => { option.label });
                $item('#quizResponseTxt').text = String(filteredoptionsArray);
                $item('#quizResultCorrectAnswer').text = String(filteredanswersArray);
                if (filteredoptionsArray.equals(filteredanswersArray)) {
                    $item('#correctLabel').text = "Correct Answer (Selected)";
                    quizscore++;
                } else {
                    $item('#quizResponseTxt').html = `<p style="line-height:normal; font-size:18px; color: #FF0000;"><span style="letter-spacing:normal;"><span>"${$item('#quizResponseTxt').text}"</span></span></p>`;
                }
            } else {
                const filteredoptions = itemData.options.filter(obj => obj.value === activityResponseData.response);
                console.log(filteredoptions);
                const filteredanswers = itemData.options.filter(obj => obj.value === itemData.answer);
                console.log(filteredanswers);
                $item('#quizResponseTxt').text = filteredoptions[0].label;
                $item('#quizResultCorrectAnswer').text = filteredanswers[0].label;
                if (filteredoptions[0].value === filteredanswers[0].value) {
                    $item('#correctLabel').text = "Correct Answer (Selected)";
                    quizscore++;
                } else {
                    $item('#quizResponseTxt').html = `<p style="line-height:normal; font-size:18px; color: #FF0000;"><span style="letter-spacing:normal;"><span>"${$item('#quizResponseTxt').text}"</span></span></p>`;
                }
            }
        } else {
            $item('#quizResponseTxt').html = '<p style="line-height:normal; font-size:18px; color: #FF0000;"><span style="letter-spacing:normal;"><span>No Response</span></span></p>';
            console.log('A'+itemData._id);
            //$item('#quizResponseTxt').html = '<p2 style="color: #FF0000; font-size:18px;">No Response</p2>';
        }
        $item('#quizrepeaterNumber').text = (index + 1).toString();
    });
    */
}

export function schooleditButton_click(event) {
    quizIndexNum = Number(event.context.itemId.slice(0, 1)) - 1;
    //console.log(event.context.itemId);
    setUpQuiz();
}

function finishedwithlesson() {
    $w('#activityStateBox').changeState('Finished');
}

function activityIndexChange() {
    quizIndexNum = 0;
    wixLocation.queryParams.add({ activity: activityIndexNum });
    return insertActivities(activityIndexNum).then(() => {
        updatequestion();
        checkLessonCompletion();
        Promise.resolve();
    });
}

function checkLessonCompletion() {
    console.log('checkLessonCompletion');
    const completedActivitiesLength = submission.data[lessonIndex].activities.filter(obj => obj.completed === true).length;
    const activityCount = activities.totalCount;
    $w('#completedBar').value = completedActivitiesLength;
    $w('#assignmentCompletedAmounTxt').text = `${completedActivitiesLength}/${activityCount} Completed`;
    if (completedActivitiesLength === activityCount) {
        if (submission.data[lessonIndex].completed === false) {
            submission.data[lessonIndex].completed = true;
            submission.data[lessonIndex].completedDate = new Date();
            wixData.save("LearnerSubmissionData", submission);
        }
        $w('#submitSecondButton').enable();
    }
}

export function matchingRepeater_itemReady($item, itemData) {
    $item('#matchinginstructionText').text = itemData.label;
    const activitySubmissionDataIndex = submission.data[lessonIndex].activities.findIndex(obj => obj._id === activities.items[activityIndexNum]._id);
    const activityResponsesArray = submission.data[lessonIndex].activities[activitySubmissionDataIndex].questions.filter(obj => obj._id === quizquestionId);
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
    //$w('#activitiesDataset').next();
    if (activityIndexNum === activities.totalCount) {
        submitSecondButton_click();
    } else {
        activityIndexChange().then(() => {
            editRepeater($w('#activityRepeater').data[activityIndexNum]._id);
        });
    }
}

export async function submitSecondButton_click(event) {
    //const firstModule = (await wixData.queryReferenced("Lessons", lesson._id, "Modules")).items[0];
    wixData.query("Modules").hasAll("lessons", lesson._id).find().then((res) => {
        console.log(res);
        wixLocation.to(`/courses/${wixLocation.query.course}?section=singleTab3&module=${lesson.module}`);
    })
}

export function quizResultRepeater_itemReady($item, itemData, index) {
    $item('#quizresultinstructions').text = itemData.instructions;
    const activitySubmissionDataIndex = submission.data[lessonIndex].activities.findIndex(obj => obj._id === activities.items[activityIndexNum]._id);
    if (submission.data[lessonIndex].activities[activitySubmissionDataIndex].questions.some(obj => obj._id === itemData._id)) {
        const activityResponseData = submission.data[lessonIndex].activities[activitySubmissionDataIndex].questions.filter(obj => obj._id === itemData._id)[0];
        if (itemData.type === 'link' || itemData.type === 'fileupload') {
            $item('#quizResponseTxt').text = activityResponseData.response;
        } else if (itemData.type === 'text') {
            $item('#quizResponseTxt').html = activityResponseData.response;
            quizscore++;
            $item('#quizResultCorrectAnswer, #correctLabel').collapse();
        } else if (itemData.type === 'multiselect') {
            $item('#correctLabel').text = 'Correct Answers';
            const filteredoptionsobjArray = itemData.options.filter(option => activityResponseData.response.includes(option.value));
            const filteredoptionsArray = filteredoptionsobjArray.map(option => { return option.label });
            const filteredanswersobjArray = itemData.options.filter(option => itemData.answers.includes(option.value));
            const filteredanswersArray = filteredanswersobjArray.map(option => { return option.label });
            $item('#quizResponseTxt').text = filteredoptionsArray.toString().split(',').join(', ');
            $item('#quizResultCorrectAnswer').text = filteredanswersArray.toString().split(',').join(', ');
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
                tableArray.push({ "prompt": question.label, "selected": selectedText, "answer": itemData.responseoptions[matchingAnswerIndex].label });
                if (index + 1 === itemData.questions.length) {
                    console.log('matchingScore' + matchingScore);
                    quizscore = quizscore + Math.round((matchingScore / itemData.questions.length) * 100) / 100;
                    matchingScore = 0;
                    $item('#matchingTable').rows = tableArray;
                    $item('#matchingTable').show();
                    $item('#responseLabel, #quizResponseTxt, #correctLabel, #quizResultCorrectAnswer').hide();
                }
            })

        } else {
            const filteredoptions = itemData.options.filter(obj => obj.value === activityResponseData.response);
            const filteredanswers = itemData.options.filter(obj => obj.value === itemData.answer);
            $item('#quizResponseTxt').text = filteredoptions[0].label;
            $item('#quizResultCorrectAnswer').text = filteredanswers[0].label;
            if (filteredoptions[0].value === filteredanswers[0].value) {
                $item('#correctLabel').text = "Correct Answer (Selected)";
                quizscore++;
            } else {
                $item('#quizResponseTxt').html = `<p style="line-height:normal; font-size:18px; color: #FF0000;"><span style="letter-spacing:normal;"><span>"${$item('#quizResponseTxt').text}"</span></span></p>`;
            }
        }
    } else {
        $item('#quizResponseTxt').html = '<p style="line-height:normal; font-size:18px; color: #FF0000;"><span style="letter-spacing:normal;"><span>No Response</span></span></p>';
    }
    $item('#quizrepeaterNumber').text = (index + 1).toString();
    if (index + 1 === $w('#quizResultRepeater').data.length) {
        $w('#recievedscoreNumber').text = quizscore.toString();
        $w('#progressBarScore').value = quizscore;
        submission.data[lessonIndex].activities[activitySubmissionDataIndex].accuracy = quizscore / activities.items[activityIndexNum].data.length;
        wixData.save("LearnerSubmissionData", submission);
        quizscore = 0;
        $w('#quizstatebox').changeState('results');
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