import wixData from 'wix-data';
import wixLocation from 'wix-location';
import wixUsers from 'wix-users';

let currentactivity;
let activityIndexNum;
let questiondata;
let quizIndexNum = -1;
let submission;
let editedsubmissionData;
let debounceTimer;
let activity = Number(wixLocation.query.activity);
let buttonClickCount = null;
let edit = false;

$w.onReady(function () {
    if (activity) {
        $w('#activitiesDataset').onReady(() => {
            //$w('#pagination').currentPage = activity + 1;
            activityIndexNum = activity;
            updatequestion();
        });
    } else {
        $w('#activitiesDataset').onReady(() => {
            activityIndexNum = 0
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
        //savedata(activityIndexNum);
    });
    /*
    $w('#submissionsDataset').getItems(0, 1)
    .then((submissiont) => {
            submission = submissiont.items[0];
    });
    */
});

/*
export function getSubmission() {
    return $w('#submissionsDataset').getItems(0, 1)
        .then((results) => {
            return results.items[0] // items is an array of locations from the collection
        })
        .catch((err) => {
            let errorMsg = err;
            console.log(errorMsg);
        });
}
*/

//filter($w('#iTitle').value, lastFilterregion);  

async function updatequestion() {
    /*
    let allsubmissions = await $w('#submissionsDataset').getItems(0, 1)
    submission = allsubmissions.items[0];
    */
    //submissionfield = 'data' + activityIndexNum.toString();
    let allactivities = await $w('#activitiesDataset').getItems(0, 20);
    currentactivity = allactivities.items[0];
    $w('#activityStateBox').changeState(currentactivity.type);
}

function bulksaveData() {
    //submission[quizIndexNum].data;
    submission.data.forEach((element, index) => {
        const filteredarray = editedsubmissionData.filter(obj => obj.id === submission.data[index].id)
        if (editedsubmissionData.some(obj => obj.id === submission.data[index].id)) {
           element = filteredarray[0];
        }
    });
    /*
    if (currentactivity.type === 'text') {
        input = $w('#responsetext').value;
    } else if (currentactivity.type === 'quiz') {
        input = $w('#responsequiz').selectedIndex.toString();
    } else if (currentactivity.type === 'dropdown') {
        input = $w('#responsedropdown').value;
    } else if (currentactivity.type === 'checkbox') {
        input = '[' + $w('#responsecheckbox').selectedIndices.toString() + ']';
        console.log(input);
    } else if (currentactivity.type === 'link') {
        input = $w('#responselink').value;
    } else if (currentactivity.type === 'fileupload') {
        console.log('#filesubmitted')
    }
    let insertfield = 'data' + Number(activityIndexNum).toString();
    submission[insertfield] = input;
    submission.lastSaved = new Date();
    */
    wixData.update("Submissions", submission)
        .then((upitem) => {
            $w('#submissionsDataset').refresh();
            $w('#lastsavedtext').text = 'Last Saved: ' + upitem.lastSaved.toLocaleString();
        })
        .catch((err) => {
            let errorMsg = err;
            console.log(errorMsg)
        });
    //});
}

export function responsetext_change(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        let activityIndexNum = $w("#activitiesDataset").getCurrentItemIndex();
        savedata(activityIndexNum);
    }, 500);
}

export function responsequiz_change(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        let activityIndexNum = $w("#activitiesDataset").getCurrentItemIndex();
        savedata(activityIndexNum);
    }, 500);
}

export function responsedropdown_change(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        let activityIndexNum = $w("#activitiesDataset").getCurrentItemIndex();
        savedata(activityIndexNum);
    }, 500);
}

export function responsecheckbox_change(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        let activityIndexNum = $w("#activitiesDataset").getCurrentItemIndex();
        savedata(activityIndexNum);
    }, 500);
}

export function responselink_keyPress(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        let activityIndexNum = $w("#activitiesDataset").getCurrentItemIndex();
        savedata(activityIndexNum);
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
    console.log('change');
    switch (event.target.currentState.id) {
    case 'Quiz':
        setUpQuiz();
        break;
    case 'Discussion':
        //setUpDiscussion();
        break;
    case 'Article':
        //setUpArticle();
        break;
    }
}

async function setUpQuiz() {
    if (quizIndexNum === -1) {
        quizIndexNum = quizIndexNum + 1;
    }
    console.log(currentactivity.data[quizIndexNum]);
    $w('#progressBar').targetValue = currentactivity.data.length;
    $w('#progressBar').value = quizIndexNum;
    questiondata = currentactivity.data[quizIndexNum];
    switch (questiondata.type) {
    case 'text':
        $w('#instructtext').text = currentactivity[quizIndexNum].instructions;
        $w('#responsetext').value = submission.data[quizIndexNum].response;
        $w('#statebox').changeState('text');
        break;
    case 'radio':
        $w('#responsequiz').options = currentactivity.data[quizIndexNum].options;
        $w('#instructquiz').text = currentactivity.data[quizIndexNum].instructions;
        $w('#responsequiz').value = submission.data[quizIndexNum].response;
        $w('#statebox').changeState('radio');
        break;
    case 'dropdown':
        console.log(currentactivity.data[quizIndexNum].options);
        $w('#responsedropdown').options = currentactivity.data[quizIndexNum].options;
        $w('#instructdropdown').text = currentactivity.data[quizIndexNum].instructions;
        $w('#responsedropdown').value = submission.data[quizIndexNum].response;
        $w('#statebox').changeState('dropdown');
        break;
    case 'checkbox':
        $w('#responsecheckbox').options = currentactivity.data[quizIndexNum].options;
        $w('#instructcheckbox').text = currentactivity.data[quizIndexNum].instructions;
        $w('#responsecheckbox').selectedIndices = JSON.parse(submission.data[quizIndexNum].response);
        $w('#statebox').changeState('checkbox');
        break;
    case 'link':
        $w('#instructlink').text = currentactivity.data[quizIndexNum].instructions;
        $w('#responselink').value = submission.data[quizIndexNum].response;
        validatelink();
        $w('#statebox').changeState('link');
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

}

export function nextButton_click(event) {
    $w('#prevButton').show();
    if (quizIndexNum + 1 === currentactivity.data.length) {
        $w('#nextButton').hide();
    } else {
        quizIndexNum = quizIndexNum + 1;
        setUpQuiz();
    }
}

export function prevButton_click(event) {
    $w('#nextButton').show();
    if (quizIndexNum - 1 === -1) {
        $w('#prevButton').hide();
    } else {
        quizIndexNum = quizIndexNum - 1;
        setUpQuiz();
    }
}

export function activityRepeater_itemReady($item, itemData, index) {
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
    $item('#activityContainer').onClick(() => { editRepeater() });

    function editRepeater() {
        /*
        if (formFactor === 'Mobile') {
            $w('#lessonColumn').collapse();
            $w('#materialsColumn').expand();
        }
        */
        const savedData = $w('#activityRepeater').data;
        $w('#activityRepeater').data = [];
        setTimeout(() => {
            $w('#activityRepeater').data = savedData;
            $w('#activitiesDataset').setCurrentItemIndex(index);
            $item('#activityTitleTxt').html = `<h4 style="color: #00A2FF; font-size:18px;">${itemData.title}</h4>`;
            //$item('#selectedLine').show();
        });
    }

}