import wixData from 'wix-data';
import wixLocation from 'wix-location';
import wixUsers from 'wix-users';
import { startTimer } from 'public/assignmenttimer.js';
//import { gradeAssignment } from 'backend/assignments.jsw';

let currentactivity;
let activityIndexNum;
let questiondata;
let quizIndexNum = -1;
let submission;
let quizquestionId;
let editedsubmissionData;
let debounceTimer;
let activityparam = Number(wixLocation.query.activity);
let buttonClickCount = null;
let edit = false;
let assignment;
let gradingComplete = true;

$w.onReady(async function () {
    console.log($w('#quizResponseTxt').html);
    assignment = $w('#dynamicDataset').getCurrentItem();
    if (activityparam) {
        $w('#activitiesDataset').onReady(() => {
            //$w('#pagination').currentPage = activity + 1;
            activityIndexNum = activityparam;
            insertActivities(activityparam);
            updatequestion();
        });
    } else {
        $w('#activitiesDataset').onReady(() => {
            activityIndexNum = 0;
            insertActivities(0);
            updatequestion();
        });
    }
    /*
    $w('#submissionsDataset').onReady(() => {
        $w('#submissionsDataset').getItems(0, 1)
            .then((results) => {
                if (results.items[0].lastSaved) {
                    $w('#lastsavedtext').text = 'Last Saved: ' + results.items[0].lastSaved.toLocaleString();
                    $w('#lastsavedtext').show();
                }
            })
    });
    $w("#activitiesDataset").onCurrentIndexChanged((index) => {
        activityIndexNum = index;
        updatequestion(activityIndexNum);
        wixLocation.queryParams.add({ 'activity': [activityIndexNum] })
        //saveQuizData(activityIndexNum);
    });
    /*
    $w('#submissionsDataset').getItems(0, 1)
    .then((submissiont) => {
            submission = submissiont.items[0];
    });
    */
});

export function submissionsDataset_ready() {
    if ($w('#submissionsDataset').getTotalCount() > 0 /*|| (submission.timerEnd).getTime() - (new Date()).getTime() > 0*/) {
        submission = $w('#submissionsDataset').getCurrentItem();
        if (assignment.timerEnabled === true && !submission.timerEnd) {
            console.log(submission.timerEnd);
            const timerEnd = new Date(new Date().getTime() + assignment.timerLength * 1000);
            $w("#submissionsDataset").setFieldValues({
                "timerEnd": timerEnd
            });
            $w('#submissionsDataset').save().then(() => {
                tSt(timerEnd, assignment.timerLength);
            });
        } else {
            if (assignment.timerEnabled === true) {
                startTimer($w('#submissionsDataset').getCurrentItem().timerEnd, assignment.timerLength);
            }
        }
    } else {
        wixLocation.to(assignment['link-assignments-1-title']);
    }
}

async function updatequestion() {
    //setTimeout(() => {
    currentactivity = $w('#activitiesDataset').getCurrentItem(); //.items[0];
    $w('#activityStateBox').changeState(currentactivity.type);
    updateStateBox();
    //}, 200);
}

async function insertActivities(indexnum) {
    const activitiesItems = await $w('#activitiesDataset').getItems(indexnum, 1);
    const activitiesId = activitiesItems.items[0]._id;
    console.log(activitiesId);
    if (!submission.data.some(obj => obj._id === activitiesId)) {
        let newElement;
        console.log(currentactivity);
        if (currentactivity.type === 'Quiz') {
            newElement = {
                activityId: activitiesId,
                completed: false,
                questions: []
            };
        } else if (currentactivity.type === 'Article') {
            newElement = {
                activityId: activitiesId,
                completed: true
            }
        } else {
            newElement = {
                activityId: activitiesId,
                completed: false
            }
        }
        submission.data.push(newElement);
        return $w('#submissionsDataset').onReady(() => {
            $w("#submissionsDataset").setFieldValues({
                "data": submission.data,
                "lastSaved": new Date(),
            });
            $w('#submissionsDataset').save().then(() => {
                console.log('Saved Data');
                console.log(submission.data);
                return { status: true };
            }).catch((error) => {
                console.error(error);
            })
        });
    } else {
        return { status: true };
    }
}

async function markActivityComplete() {
    console.log('marked');
    const indexnum = $w('#activitiesDataset').getCurrentItemIndex();
    const activitiesItems = await $w('#activitiesDataset').getItems(indexnum, 1);
    const activitiesId = activitiesItems.items[0]._id;
    console.log('AcT _ ' + activitiesId);
    submission.data = submission.data.map(obj => {
        if (obj._id === activitiesId) {
            return { ...obj, completed: true };
        }
        return obj;
    });
    //setTimeout(() => {
    $w("#submissionsDataset").setFieldValues({
        "data": submission.data,
        "lastSaved": new Date()
    });
    $w('#submissionsDataset').save();
    //});
}

function saveQuizData(type) {
    let activitySubmissionDataIndex = submission.data.findIndex(obj => obj._id === currentactivity._id);

    function updateResponseData(responsevalue) {
        console.log(submission.data[activitySubmissionDataIndex]);
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
        evalResponseData($w('#responsemultiselect').selectedIndices);
        break;
    case 'link':
        evalResponseData($w('#responselink').value);
        break;
    case 'matching':
        evalResponseData(null);
        break;
    case 'fileupload':
        console.log('filesubmitted');
        break;
    }
    setTimeout(() => {
        console.log(submission.data);
        $w("#submissionsDataset").setFieldValues({
            "data": submission.data,
            "lastSaved": new Date(),
        });
        $w('#submissionsDataset').save();
    }, 500);
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
        "lastSaved": new Date(),
    });
    $w('#lastsavedtext').text = 'Last Saved: ' + submission.lastSaved.toLocaleString();
}
*/

async function setUpQuiz() {
    if (quizIndexNum === -1) {
        quizIndexNum = quizIndexNum + 1;
        $w('#prevButton').hide();
    } else if (quizIndexNum === 0) {
        $w('#prevButton').hide();
    } else {
        $w('#prevButton').show();
    }
    $w('#nextButton').show();
    $w('#progressBar').targetValue = currentactivity.data.length;
    $w('#progressBar').value = quizIndexNum;
    quizquestionId = currentactivity.data[quizIndexNum]._id;
    questiondata = currentactivity.data[quizIndexNum];
    let activitySubmissionDataIndex = submission.data.findIndex(obj => obj._id === currentactivity._id);
    const activityResponsesArray = submission.data[activitySubmissionDataIndex].questions.filter(obj => obj._id === quizquestionId);
    const activityResponseData = activityResponsesArray[0];
    switch (questiondata.type) {
    case 'text':
        $w('#instructtext').text = currentactivity.data[quizIndexNum].instructions;
        if (activityResponsesArray.length > 0) { $w('#responsetext').value = activityResponseData.response }
        $w('#quizstatebox').changeState('text');
        break;
    case 'radio':
        $w('#responseradio').options = currentactivity.data[quizIndexNum].options;
        $w('#instructquiz').text = currentactivity.data[quizIndexNum].instructions;
        if (activityResponsesArray.length > 0) { $w('#responseradio').value = activityResponseData.response }
        $w('#quizstatebox').changeState('radio');
        break;
    case 'dropdown':
        console.log(currentactivity.data[quizIndexNum].options);
        $w('#responsedropdown').options = currentactivity.data[quizIndexNum].options;
        $w('#instructdropdown').text = currentactivity.data[quizIndexNum].instructions;
        if (activityResponsesArray.length > 0) { $w('#responsedropdown').value = activityResponseData.response }
        $w('#quizstatebox').changeState('dropdown');
        break;
    case 'multiselect':
        $w('#responsemultiselect').options = currentactivity.data[quizIndexNum].options;
        $w('#instructmultiselect').text = currentactivity.data[quizIndexNum].instructions;
        if (activityResponsesArray.length > 0) { $w('#responsemultiselect').selectedIndices = JSON.parse(activityResponseData.response) }
        $w('#quizstatebox').changeState('multiselect');
        break;
    case 'link':
        $w('#instructlink').text = currentactivity.data[quizIndexNum].instructions;
        if (activityResponsesArray.length > 0) { $w('#responseradio').value = activityResponseData.response }
        validatelink();
        $w('#quizstatebox').changeState('link');
        break;
    case 'matching':
        $w('#matchingRepeater').data = currentactivity.data[quizIndexNum].options;
        $w('#quizstatebox').changeState('matching');
        break;
    case 'fileupload':
        console.log('filesubmitted');
        break;
    }
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
    markActivityComplete();
    $w('#activityStateBox').changeState('Article');

}

export function responsetext_change(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        let activityIndexNum = $w("#activitiesDataset").getCurrentItemIndex();
        saveQuizData(activityIndexNum);
    }, 500);
}

export function responseradio_change(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        let activityIndexNum = $w("#activitiesDataset").getCurrentItemIndex();
        saveQuizData(activityIndexNum);
    }, 500);
}

export function responsedropdown_change(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        let activityIndexNum = $w("#activitiesDataset").getCurrentItemIndex();
        saveQuizData(activityIndexNum);
    }, 500);
}

export function responsemultiselect_change(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        let activityIndexNum = $w("#activitiesDataset").getCurrentItemIndex();
        saveQuizData(activityIndexNum);
    }, 500);
}

export function responselink_keyPress(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        let activityIndexNum = $w("#activitiesDataset").getCurrentItemIndex();
        //saveQuizData(activityIndexNum);
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

function postComment(commentid) {

    if (commentid) {
        if (edit === true) {
            console.log('edit')
        } else {
            let activityIndexNum = $w("#activitiesDataset").getCurrentItemIndex();
            $w('#activitiesDataset').getItems(activityIndexNum, 1)
                .then((results) => {
                    let toInsert = {
                        activity: results.items[0],
                        user: wixUsers.currentUser.id,
                        thread: commentid,
                        text: $w('#postcommentBox').value
                    };
                    wixData.insert("Discussions", toInsert)
                        .catch((err) => {
                            console.log(err);
                        });
                });
        }
    }
}

export function commentsRepeater_itemReady($item, itemData, index) {
    $item("#replyButton").onClick((event) => {
        $w('#postgroup').expand();
        buttonClickCount = itemData._id;
    });
}

export function addCommentButton_click(event) {
    $w('#postgroup').expand();
    buttonClickCount = null;
}

export function postButton_click(event) {
    if (buttonClickCount) {
        /*
        $w('#discussionsDataset').getItems(buttonClickCount, 1)
        .then((results) => {
            let commentid = results.items[0]._id;
            postComment(commentid)
        })
        */
        postComment(buttonClickCount);
    } else {
        postComment();
    }
}

export function cancelButton_click(event) {
    $w('#postgroup').collapse();
    $w('#postcommentBox').value = null;
}

export function replyText_click(event) {
    //if(buttonClickCount) {
    //let buttonClickCount = $w('#discussionsDataset').getCurrentItem()._id;
    $w('#discussionsDataset').setFilter(wixData.filter().eq('thread', $w('#discussionsDataset').getCurrentItem()._id))
        .then(() => {
            $w('#cTextIndicator').text = '◀ Back to All Comments'
        })
    //} else { 
    //$w('#postgroup').expand()     
    //}
}

export function replynumber_click(event) {
    replyText_click();
}

export function cTextIndicator_click(event) {
    if ($w('#cTextIndicator').text === '◀ Back to All Comments') {
        $w('#discussionsDataset').setFilter(wixData.filter().eq('thread', null).eq('activity', $w('#activitiesDataset').getCurrentItem()._id))
            .then(() => {
                $w('#cTextIndicator').text = 'Comments'
            });
    }
}

export function activityStateBox_change(event) {
    updateStateBox();
}

function updateStateBox() {
    switch ($w('#activityStateBox').currentState.id) {
    case 'Quiz':
        setUpQuiz();
        break;
    case 'Discussion':
        //setUpDiscussion();
        break;
    case 'Article':
        setUpArticle();
        break;
    }
}

export function nextButton_click(event) {
    saveQuizData($w('#quizstatebox').currentState.id);
    if (quizIndexNum + 1 === currentactivity.data.length) {
        setUpQuizReview();
    } else {
        quizIndexNum = quizIndexNum + 1;
        setUpQuiz();
    }
}

export function prevButton_click(event) {
    $w('#nextButton').show();
    quizIndexNum = quizIndexNum - 1;
    setUpQuiz();
}

export function activityRepeater_itemReady($item, itemData, index) {
    $w('#column21').expand();
    const submissionArrayFiltered = submission.data.filter(obj => obj._id === itemData._id);
    if (submissionArrayFiltered.length > 0) {
        if (submissionArrayFiltered[0].completed === true) {
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
    if (index === 0 && !activityparam) {
        editRepeater(itemData._id);
    }
    $item('#activityContainer').onClick((event) => {
        activityIndexNum = index;
        editRepeater(itemData._id);
        //updatequestion();
    });
}

function editRepeater(itemId) {
    /*
    if (formFactor === 'Mobile') {
        $w('#lessonColumn').collapse();
        $w('#materialsColumn').expand();
    }
    */
    $w('#activitiesDataset').setCurrentItemIndex(activityIndexNum);
    $w("#activityRepeater").forEachItem(($item, itemData, index) => {
        if (itemData._id === itemId) {
            $item('#iconBox').style.backgroundColor = '#00A2FF';
            $item('#activityTitleTxt').html = `<h4 style="color: #00A2FF; font-size:18px;">${itemData.title}</h4>`;
        } else {
            $item('#iconBox').style.backgroundColor = '#7F808A';
            $item('#activityTitleTxt').html = `<h4 style="color: #000000; font-size:18px;">${itemData.title}</h4>`;
        }
    });
}

async function setUpQuizReview() {
    $w('#progressBar').value = $w('#progressBar').targetValue;
    $w('#nextButton').hide();
    console.log(currentactivity.data);
    $w("#quizreviewRepeater").data = currentactivity.data.map((obj, index) => ({ ...obj, _id: index + 'R' }));
    //$w("#quizreviewRepeater").data = currentactivity.data.map((obj, index) => ({ _id: index + 'R', instructions: obj.instructions, type: obj.type }));
    $w("#quizreviewRepeater").forEachItem(async function ($item, itemData, index) {
        $item('#quizreviewinstructions').text = itemData.instructions;
        const activitySubmissionDataIndex = submission.data.findIndex(obj => obj._id === currentactivity._id);
        if (submission.data[activitySubmissionDataIndex].questions.some(obj => obj._id === itemData._id)) {
            const activityResponseData = submission.data[activitySubmissionDataIndex].questions.filter(obj => obj._id === itemData._id)[0];
            console.log(activityResponseData);
            if (itemData.type === 'link' || itemData.type === 'fileupload') {
                $item('#quizResponseTxt').text = activityResponseData.response;
            } else if (itemData.type === 'text') {
                $item('#quizResponseTxt').html = activityResponseData.response;
            } else if (itemData.type === 'multiselect') {
                const filteredoptionsobjArray = itemData.options.filter(obj => obj.value === activityResponseData.response);
                const filteredoptionsArray = filteredoptionsobjArray.options.map(option => { option.label });
                $item('#quizResponseTxt').text = String(filteredoptionsArray);
            } else {
                const filteredoptions = itemData.options.filter(obj => obj.value === activityResponseData.response);
                $item('#quizResponseTxt').text = filteredoptions[0].label;
            }
        } else {
            $item('#quizResponseTxt').html = '<p style="line-height:normal; font-size:18px; color: #FF0000;"><span style="letter-spacing:normal;"><span>No Response</span></span></p>';
            //$item('#quizResponseTxt').html = '<p2 style="color: #FF0000; font-size:18px;">No Response</p2>';
        }
        $item('#quizrepeaterNumber').text = (index + 1).toString();
    });
    $w('#quizstatebox').changeState('review');
}

export function schooleditButton_click(event) {
    quizIndexNum = Number(event.context.itemId.slice(0, 1)) - 1;
    //console.log(event.context.itemId);
    setUpQuiz();
}

function finishedwithAssignment() {
    $w('#activityStateBox').changeState('Finished');
}

export function saveAnswers_click(event) {
    $w("#submissionsDataset").setFieldValues({
        "lastSaved": new Date(),
    });
    if ($w('#activitiesDataset').hasNext()) { $w('#activitiesDataset').next() } else {
        $w('#submissionsDataset').save();
        finishedwithAssignment()
    }
}

export function articlefinishedButton_click(event) {
    if ($w('#activitiesDataset').hasNext()) { $w('#activitiesDataset').next(); } else { finishedwithAssignment() }
}

export function activitiesDataset_currentIndexChanged(index) {
    console.log('change');
    quizIndexNum = 0;
    insertActivities(index) /*.then(() => {*/
    //setTimeout(()=> {
    updatequestion();
    //}, 500);
}

export async function submitassignment_click(event) {
    //const allactivities = (await $w('#activitiesDataset').getItems(0, 12)).items;
    $w('#activityStateBox').changeState('Loading');
    $w('#submitSecondButton, #submitassignment').disable();
    gradeAssignment( /*assignment, allactivities, submission*/ ).then((res) => {
        if (res.result === true) {
            $w("#submissionsDataset").setFieldValues({
                "totalScore": res.totalAssignmentScore,
                "submitted": true,
                "lastSaved": new Date(),
                "gradingComplete": res.gradingStatus
            });
            $w('#submissionsDataset').save().then(() => {
                wixLocation.to(assignment['link-assignments-1-title']);
            });
        }
    });
}

async function gradeAssignment() {
    const allactivities = (await $w('#activitiesDataset').getItems(0, 12)).items;
    let totalAssignmentScore = 0;
    allactivities.forEach((activityobj) => {
        const activityScoringDetailsobj = assignment.scoringDetails.filter(obj => obj._id === activityobj._id)[0];
        if (activityobj.type === 'Quiz') {
            activityobj.data.forEach((questionobj) => {
                const submissionarray = submission.data.filter(obj => obj._id === activityobj._id);
                if (submissionarray.length > 0) {
                    const responseobj = submissionarray[0].questions.filter(obj => obj._id === questionobj._id)[0];
                    const questionScoringDetails = activityScoringDetailsobj.questions.filter(obj => obj._id === questionobj._id)[0];
                    //const questionTypes = ["Quiz", ""]
                    let totalActivityScore = 0;
                    if (questionobj.type === 'radio' ||
                        questionobj.type === 'dropdown' ||
                        questionobj.type === 'multiselect' ||
                        questionobj.type === 'matching') {
                        switch (questionobj.type) {
                        case 'radio':
                            if (questionobj.answer === responseobj.response) {
                                totalActivityScore = totalActivityScore + Number(questionScoringDetails.maxScore);
                            }
                            console.log(questionScoringDetails);
                            break;
                        case 'dropdown':
                            if (questionobj.answer === responseobj.response) {
                                totalActivityScore = totalActivityScore + Number(questionScoringDetails.maxScore);
                            }
                            console.log(questionScoringDetails);
                            break;
                        case 'multiselect':
                            if (questionobj.answers === responseobj.response) {
                                totalActivityScore = totalActivityScore + Number(questionScoringDetails.maxScore);
                            }
                            console.log(questionScoringDetails);
                            break;
                        case 'matching':
                            break;
                        }
                        console.log(totalActivityScore);
                        totalAssignmentScore = totalAssignmentScore + totalActivityScore;
                        console.log(totalAssignmentScore);
                    } else {
                        gradingComplete = false;
                    }
                }
            })
        } else {
            totalAssignmentScore = totalAssignmentScore + activityScoringDetailsobj.maxScore;
        }
    });
    return { result: true, totalAssignmentScore: totalAssignmentScore };
}

/**
*	Sets the function that runs when a new repeated item is created.
	[Read more](https://www.wix.com/corvid/reference/$w.Repeater.html#onItemReady)
*	 @param {$w.$w} $item
*/
export function matchingRepeater_itemReady($item, itemData, index) {
    $item('#matchinginstructionText').text = itemData.option;
    $item('#matchingDropdown').options = currentactivity.data[quizIndexNum].responseoptions;
}