import { getRouterData, openLightbox } from 'wix-window';
import { getMemberData } from 'public/memberFunctions.js';
import wixLocation from 'wix-location';
import wixData from 'wix-data';

let assignment;
let submissions;
let activities;
let currentActivityResultsIndex;

$w.onReady(async function () {
    assignment = getRouterData().assignment;
    submissions = getRouterData().submissions;
    $w('#lessonTitle').text = assignment.title;
    $w('#backBtn').link = `/class/${assignment['class']}/student`;
    $w('#startAssignment, #startAssignmentButton2').link = `/assignment/${assignment._id}/take`;
    if (assignment.description) {
        $w('#descriptionTxt').html = assignment.description;
        $w('#descriptionTxt').expand();
    }
    const memberId = getMemberData('_id');
    let assignmentGroup;
    if (assignment.assignData.some((obj) => obj.students.includes(memberId))) {
        assignmentGroup = assignment.assignData.find((obj) => obj.students.includes(memberId));
    } else {
        assignmentGroup = assignment.assignData[0];
    }
    if (assignmentGroup.attempts.limitAttempts) {
        $w('#attemptstxt').text = assignmentGroup.attempts.maxAttempts;
    } else {
        $w('#attemptstxt').text = "Unlimited";
    }
    if (!assignmentGroup.dueDates.allowLateSubmissions) {
        $w('#lateSubmissionsAllowedCheckbox').style.backgroundColor = '#FF4040';
    }
    if (assignmentGroup.timer.enabled) {
        const countDownSeconds = assignmentGroup.timer.timeLimit;
        const countDownMinutes = Math.floor(countDownSeconds / 60);
        if (Number(countDownSeconds % 60) < 10) {
            $w('#timeTxt').text = countDownMinutes.toString() + ":" + "0" + (countDownSeconds % 60).toString();
        } else {
            $w('#timeTxt').text = countDownMinutes.toString() + ":" + (countDownSeconds % 60).toString();
        }
    } else {
        $w('#timeTxt').text = "Unlimited";
    }
    let dueDate;
    if (assignmentGroup.dueDates.enabled) {
        dueDate = new Date(assignmentGroup.dueDates.dueDate['$date']);
        $w('#dueDateTxt').text = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(dueDate);
    } else {
        $w('#dueDateTxt').text = "No Due Date";
        $w('#lateSubmissionsAllowedCheckbox').collapse();
    }
    const now = new Date();
    let maxAttempts;
    if (assignmentGroup.attempts.limitAttempts) {
        maxAttempts = assignmentGroup.attempts.maxAttempts;
    } else {
        maxAttempts = Number(Infinity);
    }
    const submissionCount = submissions.totalCount;
    if (!assignmentGroup.availability.limitAvailability) {
        $w('#availableTxt').text = "Always Available";
        if (assignmentGroup.dueDates.enabled) {
            if (dueDate.getTime() >= now.getTime()) {
                //if past due date
                if (assignmentGroup.dueDates.allowLateSubmissions && submissionCount < maxAttempts) {
                    //if late submissions allowed and submissionCount is below max attempts allowed.
                    if (submissions.totalCount > 0 && !submissions.items[0]?.submitted) {
                        $w('#startAssignment, #startAssignmentButton2').label = "Continue Assignment";
                    } else {
                        if (submissionCount > 0) {
                            $w('#startAssignment, #startAssignmentButton2').label = "Retry Assignment";
                        } else {
                            $w('#startAssignment, #startAssignmentButton2').label = "Start Assignment";
                        }
                    }
                } else {
                    $w('#startAssignment, #startAssignmentButton2').collapse();
                }
            } else {
                if (submissionCount < maxAttempts) {
                    //if submissionCount is below max attempts allowed.
                    if (submissions.totalCount > 0 && !submissions.items[0]?.submitted) {
                        $w('#startAssignment, #startAssignmentButton2').label = "Continue Assignment";
                    } else {
                        if (submissionCount > 0) {
                            $w('#startAssignment, #startAssignmentButton2').label = "Retry Assignment";
                        } else {
                            $w('#startAssignment, #startAssignmentButton2').label = "Start Assignment";
                        }
                    }
                } else {
                    $w('#startAssignment, #startAssignmentButton2').collapse();
                }
            }
        } else {
            if (submissionCount < maxAttempts) {
                //if submissionCount is below max attempts allowed.
                if (submissions.totalCount > 0 && !submissions.items[0]?.submitted) {
                    $w('#startAssignment, #startAssignmentButton2').label = "Continue Assignment";
                } else {
                    if (submissionCount > 0) {
                        $w('#startAssignment, #startAssignmentButton2').label = "Retry Assignment";
                    } else {
                        $w('#startAssignment, #startAssignmentButton2').label = "Start Assignment";
                    }
                }
            } else {
                $w('#startAssignment, #startAssignmentButton2').collapse();
            }
        }
    } else {
        const startDate = new Date(assignmentGroup.availability.startDate['$date']);
        const endDate = new Date(assignmentGroup.availability.endDate['$date']);
        $w('#availableTxt').text = `${new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(startDate)} - ${new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(endDate)}`;
        if (endDate.getTime() >= now.getTime() && startDate.getTime() <= now.getTime()) {
            if (assignmentGroup.dueDates.enabled) {
                let maxAttempts;
                if (assignmentGroup.attempts.limitAttempts) {
                    maxAttempts = assignmentGroup.attempts.maxAttempts;
                } else {
                    maxAttempts = Number(Infinity);
                }
                const submissionCount = submissions.totalCount;
                if (dueDate.getTime() >= now.getTime()) {
                    //if past due date
                    if (assignmentGroup.dueDates.allowLateSubmissions && submissionCount < maxAttempts) {
                        //if late submissions allowed and submissionCount is below max attempts allowed.
                        if (submissions.totalCount > 0 && !submissions.items[0]?.submitted) {
                            $w('#startAssignment, #startAssignmentButton2').label = "Continue Assignment";
                        } else {
                            if (submissionCount > 0) {
                                $w('#startAssignment, #startAssignmentButton2').label = "Retry Assignment";
                            } else {
                                $w('#startAssignment, #startAssignmentButton2').label = "Start Assignment";
                            }
                        }
                    } else {
                        $w('#startAssignment, #startAssignmentButton2').collapse();
                    }
                } else {
                    if (submissionCount < maxAttempts) {
                        //if submissionCount is below max attempts allowed.
                        if (submissions.totalCount > 0 && !submissions.items[0]?.submitted) {
                            $w('#startAssignment, #startAssignmentButton2').label = "Continue Assignment";
                        } else {
                            if (submissionCount > 0) {
                                $w('#startAssignment, #startAssignmentButton2').label = "Retry Assignment";
                            } else {
                                $w('#startAssignment, #startAssignmentButton2').label = "Start Assignment";
                            }
                        }
                    }
                }
            } else {
                if (submissionCount < maxAttempts) {
                    //if submissionCount is below max attempts allowed.
                    if (submissions.totalCount > 0 && !submissions.items[0]?.submitted) {
                        $w('#startAssignment, #startAssignmentButton2').label = "Continue Assignment";
                    } else {
                        if (submissionCount > 0) {
                            $w('#startAssignment, #startAssignmentButton2').label = "Retry Assignment";
                        } else {
                            $w('#startAssignment, #startAssignmentButton2').label = "Start Assignment";
                        }
                    }
                }
            }
        } else {
            $w('#startAssignment, #startAssignmentButton2').collapse();
        }
    }
    $w('#tabsBox').onChange((event) => {
        if (event.target.currentTab.label === 'Results') {
            if (submissions.totalCount > 0 && submissions.items.some((obj) => obj.submitted)) {
                $w('#submissionSelectDropdown').options = submissions.items.filter((obj) => obj.submitted === true).map((obj) => { return { "label": new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(obj._createdDate['$date'])), "value": obj._id } });
                $w('#submissionSelectDropdown').value = submissions.items.find((obj) => obj.submitted)._id;
                loadResults();
                $w('#stateboxResults').changeState('results');
            } else {
                $w('#stateboxResults').changeState('noResults')
            }
        }
    })
    $w('#gclassroom').link = `https://classroom.google.com/share?url=${wixLocation.url}`
});

async function loadResults() {
    const submission = submissions.items.find((obj) => obj._id === $w('#submissionSelectDropdown').value)
    if (submission.gradingComplete) {
        const assignmentActivityQuery = await wixData.queryReferenced("Assignments", assignment._id, "Activities");
        activities = assignmentActivityQuery.items;
        $w('#overallScoreTxt').text = submission.accuracy;
        currentActivityResultsIndex = 0;
        $w('#progressBarOverall').value = submission.accuracy;
        $w("#overallScoreTxt").text = `${Math.round(submission.accuracy * 100).toString()}%`;
        if (currentActivityResultsIndex + 1 === activities.length) {
            $w('#nextButton').disable();
        } else {
            $w('#nextButton').enable();
        }
    } else {
        $w('#notGradedYetTxt').expand();
    }
}

export function newCommentButton_click(event) {
    $w('#newCommentButton').collapse();
    $w('#commentGroup').expand();
}

export function assignmentCommentsDataset_ready() {
    const commentsCount = $w('#assignmentCommentsDataset').getTotalCount();
    if (commentsCount > 0) {
        $w('#newCommentButton').expand();
        $w('#commentGroup').collapse();
    } else {
        $w('#newCommentButton').collapse();
        $w('#commentGroup').expand();
    }
}

export function postCommentButton_click(event) {
    $w('#postCommentButton').disable();
    $w('#assignmentCommentsDataset').add().then(() => {
        $w("#assignmentCommentsDataset").setFieldValues({
            "commentText": $w('#commentTextBox').value,
            "author": wixUsers.currentUser.id,
            "assignment": currassignment._id
        });
        $w('#assignmentCommentsDataset').save().then(() => {
            $w('#commentGroup').collapse();
            $w('#newCommentButton').expand();
        });
    });
}

export function commentTextBox_input(event) {
    if (event.target.value.length > 0) {
        $w('#postCommentButton').enable();
    }
}

export function cancelCommentButton_click(event) {
    $w('#commentTextBox').value = null;
    $w('#commentGroup').collapse();
    $w('#newCommentButton').expand();
}

let quizscore = 0;

export function gradingQuestionsRepeater_itemReady($item, itemData, index) {
    const submission = submissions.items.find((obj) => obj._id === $w('#submissionSelectDropdown').value);
    $item('#quizresultinstructions').html = itemData.instructions;
    $item('#quizrepeaternumber').text = (index + 1).toString();
    const activitySubmissionDataIndex = submission.data.findIndex(obj => obj._id === activities[currentActivityResultsIndex]._id);
    const activityResponseData = submission.data[activitySubmissionDataIndex]?.questions.filter(obj => obj._id === itemData._id)[0];
    const activityScoringDataIndex = submission.scoringData.findIndex(obj => obj._id === activities[currentActivityResultsIndex]._id);
    const questionObj = submission.scoringData[activityScoringDataIndex].questions.find((obj) => obj._id === itemData._id);
    if (questionObj?.accuracy) {
        $item('#scoreDisplayTxt').text = parseFloat(questionObj?.accuracy.toFixed(2)).toString();
    } else {
        $item('#scoreDisplayTxt').text = "Ungraded";
    }
    if (itemData.type === 'link' || itemData.type === 'fileupload') {
        if (submission.data[activitySubmissionDataIndex]?.questions.some(obj => obj._id === itemData._id)) {
            $item('#quizResponseTxt').text = activityResponseData.response;
        } else {
            $item('#quizResponseTxt').html = '<p style="line-height:normal; font-size:18px; color: #FF0000;"><span style="letter-spacing:normal;"><span>No Response</span></span></p>';
        }
    } else if (itemData.type === 'text') {
        if (submission.data[activitySubmissionDataIndex]?.questions.some(obj => obj._id === itemData._id)) {
            $item('#quizResponseTxt').html = activityResponseData.response;
        } else {
            $item('#quizResponseTxt').html = '<p style="line-height:normal; font-size:18px; color: #FF0000;"><span style="letter-spacing:normal;"><span>No Response</span></span></p>';
        }
        quizscore++;
        $item('#quizResultCorrectAnswer, #correctLabel').collapse();
    } else if (itemData.type === 'multiselect') {
        $item('#correctLabel').text = 'Correct Answers';
        const filteredanswersobjArray = itemData.options.filter(option => itemData.answer.includes(option.value));
        const filteredanswersArray = filteredanswersobjArray.map(option => { return option.label });
        if (submission.data[activitySubmissionDataIndex]?.questions.some(obj => obj._id === itemData._id)) {
            const filteredoptionsobjArray = itemData.options.filter(option => activityResponseData.response.includes(option.value));
            const filteredoptionsArray = filteredoptionsobjArray.map(option => { return option.label });
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
        $item('#quizResultCorrectAnswer').text = filteredanswersArray.toString().split(',').join(', ');
    } else if (itemData.type === 'matching') {
        let matchingScore = 0;
        let tableArray = [];
        itemData.questions.forEach((question, index) => {
            const matchingresponse = activityResponseData?.response.filter((obj) => obj._id === question.value)[0] || '';
            const matchingResponseIndex = itemData.responseoptions.findIndex((responseoption) => responseoption.value === matchingresponse?.response);
            const matchingAnswerIndex = itemData.responseoptions.findIndex((responseoption) => responseoption.value === question.answer);
            let textColor;
            if (question.answer === matchingresponse?.response) {
                textColor = '#13C402';
                matchingScore++;
            } else {
                textColor = '#ff412b';
            }
            let hasFeedback = false;
            const selectedText = `<p style="color: ${textColor}; font-size:14px;"><span style="font-size:14px;">${itemData.responseoptions[matchingResponseIndex]?.label || 'No Response'}</span></p>`;
            let tableArrayObj = { "prompt": question.label, "selected": selectedText, "answer": itemData.responseoptions[matchingAnswerIndex].label };
            if (question?.offerFeedback) {
                if (question.feedback.some((obj) => obj._id === matchingresponse.response)) {
                    const matchingFeedbackIndex = question.feedback.findIndex((obj) => obj._id === matchingresponse.response);
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
        if (submission.data[activitySubmissionDataIndex]?.questions.some(obj => obj._id === itemData._id)) {
            $item('#quizResponseTxt').text = activityResponseData.response.toString();
            const roundedResponse = round(Number(activityResponseData.response), itemData.precision);
            const roundedAnswer = round(Number(itemData.answer), itemData.precision)
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
    } else {
        const filteredanswers = itemData.options.filter(obj => obj.value === itemData.answer);
        if (submission.data[activitySubmissionDataIndex]?.questions.some(obj => obj._id === itemData._id)) {
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
            $item('#correctLabel, #quizResultCorrectAnswer').collapse();
        }
        $item('#quizResultCorrectAnswer').text = filteredanswers[0].label;
    }
    $item('#quizrepeaterNumber').text = (index + 1).toString();
    if (index + 1 === $w('#gradingQuestionsRepeater').data.length) {
        $w('#recievedscoreNumber').text = quizscore.toString();
        $w('#progressBarActivity').value = quizscore;
        quizscore = 0;
        //$w('#quizstatebox').changeState('results');
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

export function seeDetailsBtn_click(event) {
    if ($w('#line1').collapsed) {
        $w('#seeDetailsBtn').label = "- Hide Details";
        $w('#activityTitleGroup, #activityGroup, #gradingQuestionsRepeater, #line1, #nextButton, #prevButton').expand();
        loadActivityResults();
    } else {
        $w('#seeDetailsBtn').label = "+ Show Details";
        $w('#activityTitleGroup, #activityGroup, #gradingQuestionsRepeater, #line1, #nextButton, #prevButton').collapse();
    }
}

function loadActivityResults() {
    switch (activities[currentActivityResultsIndex].type) {
    case 'Quiz':
        $w('#articleIconBig, #discussionIconBig').hide();
        $w('#quizIconBig').show();
        $w('#gradingQuestionsRepeater').expand();
        $w('#gradingQuestionsRepeater').data = activities[currentActivityResultsIndex].data;
        break;
    case 'Article':
        $w('#quizIconBig, #discussionIconBig').hide();
        $w('#articleIconBig').show();
        $w('#outofScoreNumber').text = '1';
        const submission = submissions.items.find((obj) => obj._id === $w('#submissionSelectDropdown').value);
        const questionScore = submission.scoringData.find((obj) => obj._id === activities[currentActivityResultsIndex]._id).accuracy;
        $w('#progressBarActivity').targetValue = 1;
        $w('#progressBarActivity').value = questionScore;
        $w('#recievedscoreNumber').text = questionScore.toString();
        $w('#gradingQuestionsRepeater').collapse();
        break;
    case 'Discussion':
        $w('#quizIconBig, #articleIconBig').hide();
        $w('#discussionIconBig').show();
        $w('#gradingQuestionsRepeater').expand();
        break;
    }
    $w('#activityNameTxt').text = activities[currentActivityResultsIndex].title;
    $w('#activityTypeTxt').text = activities[currentActivityResultsIndex].type;
    $w("#gradingQuestionsRepeater").data = activities[currentActivityResultsIndex].data;
    $w('#progressBarActivity').targetValue = activities[currentActivityResultsIndex].data.length;
    $w('#outofScoreNumber').text = activities[currentActivityResultsIndex].data.length.toString();
}

export function nextButton_click(event) {
    currentActivityResultsIndex = currentActivityResultsIndex + 1;
    if (currentActivityResultsIndex + 1 === activities.length) {
        $w('#nextButton').disable();
    } else {
        $w('#nextButton').enable();
    }
    $w('#prevButton').enable();
    $w('#prevButton').style.borderWidth = '2px';
    loadActivityResults();
}

export function prevButton_click(event) {
    currentActivityResultsIndex = currentActivityResultsIndex - 1;
    if (currentActivityResultsIndex === 0) {
        $w('#prevButton').style.borderWidth = '0';
        $w('#prevButton').disable();
    } else {
        $w('#prevButton').enable();
    }
    loadActivityResults();
}

export function submissionSelectDropdown_change(event) {
    loadResults();
    seeDetailsBtn_click();
}

export function matchingTable_cellSelect(event) {
    const submission = submissions.items.find((obj) => obj._id === $w('#submissionSelectDropdown').value);
    let $item = $w.at(event.context.itemId);
    if (event.cellColumnId === 'Feedback') {
        const activityQuestion = $item('#gradingQuestionsRepeater').data.find(obj => obj._id === event.context.itemId);
        const question = activityQuestion.questions.find((obj) => obj.label === event.target.rows[event.cellRowIndex].prompt);
        if (question?.offerFeedback) {
            const activitySubmissionDataIndex = submission.data.findIndex(obj => obj._id === activities[currentActivityResultsIndex]._id);
            const activityResponseData = submission.data[activitySubmissionDataIndex]?.questions.filter(obj => obj._id === itemData._id)[0];
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