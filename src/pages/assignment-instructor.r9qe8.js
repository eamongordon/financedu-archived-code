import wixAnimations from 'wix-animations';
import { getRouterData, openLightbox, formFactor } from 'wix-window';
import wixLocation from 'wix-location';
import { generateError, generateSuccess } from 'public/statusbox.js';
import { saveAssignment, fetchAssignmentStudents, fetchAssignmentActivities, insertAssignmentActivity, removeAssignmentActivity, updateAssignmentActivityOrder, fetchAssignmentSubmissions } from 'backend/assignments.jsw';
import { memory } from 'wix-storage';
import { generateRandom, moveArray } from 'public/util.js';
import wixData from 'wix-data';

let assignment;
let students;
let activities;
let contextIndex;
let submissions;
let debounceTimer;

$w.onReady(async function () {
    const routerData = getRouterData();
    assignment = routerData.assignment;
    students = (await fetchAssignmentStudents(assignment['class'])).items;
    $w('#tabsBox').onChange((event) => {
        if (event.target.currentTab.label === 'Activities') {
            loadActivities();
        } else if (event.target.currentTab.label === 'Grading') {
            loadGrading();
        } else if (event.target.currentTab.label === 'Analytics') {
            loadAnalytics();
        } else if (event.target.currentTab.label === 'Standards') {
            loadStandards();
        }
    });
    $w('#title').text = assignment.title;
    $w('#titleInputField').value = assignment.title;
    $w('#backButton').link = `/class/${assignment['class']}/instructor`;
    if (assignment.assignToSelectedStudents) {
        loadSelectedStudents();
    } else {
        $w('#assignDropdown').value = 'All';
    }
    if (assignment.published) {
        $w('#published').show();
    } else {
        $w('#unpublished').show();
    }
    $w('#assignDataRepeater').data = assignment.assignData.map((obj) => { return { ...obj, _id: generateRandom(8) } });
    if (wixLocation.query?.section) {
        const tabToSelect = $w('#tabsBox').tabs.find((obj) => obj.label = wixLocation.query?.section);
        $w('#tabsBox').changeTab(tabToSelect);
        if (wixLocation.query?.submissionOwner) {
            loadGrading(wixLocation.query.submissionOwner);
        }
    }
});

function loadSelectedStudents() {
    $w('#assignDropdown').value = "Selected";
    const assignmentStudents = students.filter((obj) => assignment.selectedStudents.includes(obj._id));
    $w('#checkboxGroupStudents').options = students.map((obj) => {
        return {
            "label": `${obj.firstName} ${obj.lastName}`,
            "value": obj._id
        }
    });
    $w('#checkboxGroupStudents').value = assignmentStudents.map((obj) => obj._id);
    $w('#checkboxGroupStudents').expand();
}

async function loadActivities() {
    await loadActivityItems();
    $w('#activityRepeater').data = activities.items;
    $w('#activitiesTxt').text = `${activities.totalCount} Activities`;
    $w('#stateboxActivities').changeState('activities');
}

async function loadAnalytics() {
    await loadActivityItems();
    if (!submissions) {
        submissions = await fetchAssignmentSubmissions([assignment['class']], [assignment._id]);
    }
    if (submissions.length > 0) {
        let questions = [];
        activities.items.forEach((activity) => {
            activity.accuracyValues = [];
            if (activity.type === 'Quiz') {
                activity.data.forEach((question) => {
                    question.activityId = activity._id;
                    question.accuracyValues = [];
                    questions.push(question);
                });
            }
        });
        submissions.forEach((submission) => {
            submission.scoringData.forEach((activitysub) => {
                const activityIndex = activities.items.findIndex((obj) => obj._id === activitysub._id)
                if (activitysub.accuracy) {
                    activities.items[activityIndex].accuracyValues.push(activitysub.accuracy);
                }
                const matchingActivity = activities.items.find((obj) => obj._id == activitysub._id);
                if (matchingActivity.type === 'Quiz') {
                    activitysub.questions.forEach((questionsub) => {
                        const questionIndex = questions.findIndex((obj) => obj._id === questionsub._id)
                        if (questionsub.accuracy) {
                            questions[questionIndex].accuracyValues.push(questionsub.accuracy);
                        }
                    });
                }
            })
        });
        activities.items.forEach((activitygroup) => {
            if (activitygroup.accuracyValues?.length > 0) {
                activitygroup.averageAccuracy = activitygroup.accuracyValues.reduce((a, b) => a + b) / activitygroup.accuracyValues.length;
            }
        });
        questions.forEach((questiongroup) => {
            if (questiongroup.accuracyValues?.length > 0) {
                questiongroup.averageAccuracy = questiongroup.accuracyValues.reduce((a, b) => a + b) / questiongroup.accuracyValues.length;
            }
        });
        $w('#activitiesAnalyticsRepeater').data = activities.items;
        $w('#questionAnalyticsRepeater').data = questions;
        $w('#stateboxAnalytics').changeState('analytics');
    } else {
        $w('#stateboxAnalytics').changeState('noSubmissionsAnalytics')
    }
}

async function loadStandards() {
    await loadActivityItems();
    const activitiesIdList = activities.items.map((obj) => obj._id);
    if ($w('#stateboxStandards').currentState.id === 'loadingStandards') {
        const standardsQuery = await wixData.query("Standards").hasSome("Activities", activitiesIdList).find();
        if (standardsQuery.totalCount > 0) {
            $w('#standardsRepeater').data = standardsQuery.items;
        } else {
            $w('#stateboxStandards').changeState('noStandards');
        }
    }
}

export function editTitle_click(event) {
    $w('#cancelSettingsBtn, #saveSettingsBtn').enable();
    $w('#title, #editTitle').hide();
    $w('#saveTitle, #titleInputField').show();
}

export function saveTitle_click(event) {
    $w('#cancelSettingsBtn, #saveSettingsBtn').enable();
    $w('#title, #editTitle').show();
    $w('#title').text = $w('#titleInputField').value;
    assignment.title = $w('#titleInputField').value;
    $w('#saveTitle, #titleInputField').hide();
}

export async function unpublished_click(event) {
    await loadActivityItems();
    if (activities.items.length > 0) {
        try {
            assignment.published = true;
            wixData.update("Assignments", assignment);
            generateSuccess("Assignment Published");
            $w('#unpublished').hide();
            $w('#published').show();
        } catch (error) {
            generateError(null, error);
        }
    } else {
        generateError("No activities are in this lesson. You must add activities before publishing the assignment.");
    }
}

export function published_click(event) {
    assignment.published = false;
    return wixData.update("Assignments", assignment).then(() => {
        generateSuccess("Assignment Unpublished");
        $w('#published').hide();
        $w('#unpublished').show();
    }).catch((error) => {
        generateError(null, error);
    });
}

export function activityRepeater_itemReady($item, itemData, index) {
    $item('#activitiyTitleTxt').text = itemData.title;
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

export function assignDataRepeater_itemReady($item, itemData, index) {
    if (index === 0) {
        $item('#deleteGroup').hide();
        $item('#detailsShowBtn').label = "- Collapse Details";
        $item('#detailBox').expand();
        $item('#editPeopleBtn').hide();
    } else {
        const studentList = students.items.filter((obj) => itemData.students.includes(obj._id));
        $item('#studentList').text = studentList.map((obj) => obj.name).join(", ");
    }
    if (itemData.attempts.limitAttempts === true) {
        $item('#limitAttemptsCheckbox').checked = true;
        $item('#maxAttemptsSlider').value = itemData.attempts.maxAttempts;
        $item('#maxAttemptsSlider').expand();
    } else {
        $item('#limitAttemptsCheckbox').checked = false;
    }
    if (itemData.availability.limitAvailability === true) {
        $item('#startGroup, #endGroup').expand();
        $item('#limitAvailabilityCheckbox').checked = true;
        if (itemData.availability.startDate) {
            const startDate = new Date(itemData.availability.startDate['$date'] || itemData.availability.startDate);
            $item('#startDatePicker').value = startDate;
            const hoursValue = startDate.getHours() > 9 ? startDate.getHours().toString() : '0' + startDate.getHours().toString();
            const minutesValue = startDate.getMinutes() > 9 ? startDate.getMinutes().toString() : '0' + startDate.getMinutes().toString();
            $item('#startTimePicker').value = `${hoursValue}:${minutesValue}`;
        }
        if (itemData.availability.endDate) {
            const endDate = new Date(itemData.availability.endDate['$date'] || itemData.availability.endDate);
            $item('#endDatePicker').value = endDate;
            const hoursValue = endDate.getHours() > 9 ? endDate.getHours().toString() : '0' + endDate.getHours().toString();
            const minutesValue = endDate.getMinutes() > 9 ? endDate.getMinutes().toString() : '0' + endDate.getMinutes().toString();
            $item('#endTimePicker').value = `${hoursValue}:${minutesValue}`;
        }
    }
    if (itemData.dueDates.enabled) {
        $item('#dueDateGroup, #allowLateSubmissionsCheckbox').expand();
        $item('#dueDatesCheckbox').checked = true;
        if (itemData.dueDates.dueDate) {
            const dueDate = new Date(itemData.dueDates.dueDate['$date'] || itemData.dueDates.dueDate);
            $item('#dueDatePicker').value = dueDate;
            const hoursValue = dueDate.getHours() > 9 ? dueDate.getHours().toString() : '0' + dueDate.getHours().toString();
            const minutesValue = dueDate.getMinutes() > 9 ? dueDate.getMinutes().toString() : '0' + dueDate.getMinutes().toString();
            $item('#dueTimePicker').value = `${hoursValue}:${minutesValue}`;
        }
        if (itemData.dueDates.allowLateSubmissions === true) {
            $item('#allowLateSubmissionsCheckbox').checked = true;
        }
    }
    if (itemData.grading.manualGrading) {
        $item('#manuallyGradeWritingCheckbox').checked = true;
    }
    if (itemData.timer.enabled === true) {
        $item('#timeGroup').expand();
        $item('#timeLimitCheckbox').checked = true;
        $item('#minutesInput').value = Math.round(itemData.timer.timeLimit / 60);
        $item('#secondsInput').value = itemData.timer.timeLimit % 60;
    }
    $item('#maxAttemptsSlider').onChange((event) => {
        $w('#cancelSettingsBtn, #saveSettingsBtn').enable();
        assignment.assignData[index].attempts.maxAttempts = event.target.value;
    });
    if (index + 1 === $w('#assignDataRepeater').data.length) {
        $w('#settingstatebox').changeState('Settings');
    }
}

const combineDateTime = (date, time) => {
    date = new Date(date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // Jan is 0, dec is 11
    const day = date.getDate();
    const dateString = '' + year + '-' + month + '-' + day;
    const combined = new Date(dateString + ' ' + time);
    return combined;
}

export function startDatePicker_change(event) {
    $w('#cancelSettingsBtn, #saveSettingsBtn').enable();
    let $item = $w.at(event.context);
    const assignmentIndex = $w('#assignDataRepeater').data.findIndex((obj) => obj._id === event.context.itemId);
    const startDate = new Date(combineDateTime($item('#startDatePicker').value, $item('#startTimePicker').value));
    const endDate = new Date(combineDateTime($item('#endDatePicker').value, $item('#endTimePicker').value));
    if (startDate.getTime() > endDate.getTime()) {
        let newEndDate = new Date($item('#endDatePicker').value);
        newEndDate.setDate(startDate.getDate() + 1);
        $item('#endDatePicker').value = newEndDate;
        const hoursValue = newEndDate.getHours() > 9 ? newEndDate.getHours().toString() : '0' + newEndDate.getHours().toString();
        const minutesValue = newEndDate.getMinutes() > 9 ? newEndDate.getMinutes().toString() : '0' + newEndDate.getMinutes().toString();
        $item('#endTimePicker').value = `${hoursValue}:${minutesValue}`;
        assignment.assignData[assignmentIndex].availability.endDate = combineDateTime($item('#endDatePicker').value, $item('#endTimePicker').value);
    }
    assignment.assignData[assignmentIndex].availability.startDate = combineDateTime($item('#startDatePicker').value, $item('#startTimePicker').value);
}

export function startTimePicker_change(event) {
    $w('#cancelSettingsBtn, #saveSettingsBtn').enable();
    let $item = $w.at(event.context);
    const assignmentIndex = $w('#assignDataRepeater').data.findIndex((obj) => obj._id === event.context.itemId);
    const startDate = new Date(combineDateTime($item('#startDatePicker').value, $item('#startTimePicker').value));
    const endDate = new Date(combineDateTime($item('#endDatePicker').value, $item('#endTimePicker').value));
    if (startDate.getTime() > endDate.getTime()) {
        let newEndDate = new Date($item('#endDatePicker').value);
        newEndDate.setDate(startDate.getDate() + 1);
        $item('#endDatePicker').value = newEndDate
        const hoursValue = newEndDate.getHours() > 9 ? newEndDate.getHours().toString() : '0' + newEndDate.getHours().toString();
        const minutesValue = newEndDate.getMinutes() > 9 ? newEndDate.getMinutes().toString() : '0' + newEndDate.getMinutes().toString();
        $item('#endTimePicker').value = `${hoursValue}:${minutesValue}`;
        assignment.assignData[assignmentIndex].availability.endDate = combineDateTime($item('#endDatePicker').value, $item('#endTimePicker').value)
    }
    assignment.assignData[assignmentIndex].availability.startDate = combineDateTime($item('#startDatePicker').value, $item('#startTimePicker').value)
}

export function endDatePicker_change(event) {
    $w('#cancelSettingsBtn, #saveSettingsBtn').enable();
    let $item = $w.at(event.context);
    const assignmentIndex = $w('#assignDataRepeater').data.findIndex((obj) => obj._id === event.context.itemId);
    const startDate = new Date(combineDateTime($item('#startDatePicker').value, $item('#startTimePicker').value));
    const endDate = new Date(combineDateTime($item('#endDatePicker').value, $item('#endTimePicker').value));
    if (startDate.getTime() > endDate.getTime()) {
        $item('#startDatePicker').value = endDate;
        $item('#endTimePicker').value = '00:00';
        assignment.assignData[assignmentIndex].availability.startDate = combineDateTime($item('#startDatePicker').value, $item('#startTimePicker').value);
    }
    assignment.assignData[assignmentIndex].availability.endDate = combineDateTime($item('#endDatePicker').value, $item('#endTimePicker').value);
}

export function endTimePicker_change(event) {
    $w('#cancelSettingsBtn, #saveSettingsBtn').enable();
    let $item = $w.at(event.context);
    const assignmentIndex = $w('#assignDataRepeater').data.findIndex((obj) => obj._id === event.context.itemId);
    const startDate = new Date(combineDateTime($item('#startDatePicker').value, $item('#startTimePicker').value));
    const endDate = new Date(combineDateTime($item('#endDatePicker').value, $item('#endTimePicker').value));
    if (startDate.getTime() > endDate.getTime()) {
        $item('#startDatePicker').value = endDate;
        $item('#endTimePicker').value = '00:00';
        assignment.assignData[assignmentIndex].availability.startDate = combineDateTime($item('#startDatePicker').value, $item('#startTimePicker').value);
    }
    assignment.assignData[assignmentIndex].availability.endDate = combineDateTime($item('#endDatePicker').value, $item('#endTimePicker').value);
}

export function dueDatePicker_change(event) {
    $w('#cancelSettingsBtn, #saveSettingsBtn').enable();
    let $item = $w.at(event.context);
    const assignmentIndex = $w('#assignDataRepeater').data.findIndex((obj) => obj._id === event.context.itemId);
    const dueDate = new Date(combineDateTime($item('#dueDatePicker').value, $item('#dueTimePicker').value));
    const endDate = new Date(combineDateTime($item('#endDatePicker').value, $item('#endTimePicker').value));
    if (dueDate.getTime() > endDate.getTime()) {
        $item('#endDatePicker').value = dueDate;
        $item('#endTimePicker').value = $item('#dueTimePicker').value;
        assignment.assignData[assignmentIndex].availability.endDate = combineDateTime($item('#endDatePicker').value, $item('#endTimePicker').value);
    }
    assignment.assignData[assignmentIndex].dueDates.dueDate = combineDateTime($item('#dueDatePicker').value, $item('#dueTimePicker').value);
}

export function dueTimePicker_change(event) {
    $w('#cancelSettingsBtn, #saveSettingsBtn').enable();
    let $item = $w.at(event.context);
    const assignmentIndex = $w('#assignDataRepeater').data.findIndex((obj) => obj._id === event.context.itemId);
    const dueDate = new Date(combineDateTime($item('#dueDatePicker').value, $item('#dueTimePicker').value));
    const endDate = new Date(combineDateTime($item('#endDatePicker').value, $item('#endTimePicker').value));
    if (dueDate.getTime() > endDate.getTime()) {
        $item('#endDatePicker').value = dueDate;
        $item('#endTimePicker').value = $item('#dueTimePicker').value;
        assignment.assignData[assignmentIndex].availability.endDate = combineDateTime($item('#endDatePicker').value, $item('#endTimePicker').value);
    }
    assignment.assignData[assignmentIndex].dueDates.dueDate = combineDateTime($item('#dueDatePicker').value, $item('#dueTimePicker').value);
}

export function detailsShowBtn_click(event) {
    let $item = $w.at(event.context);
    if ($item('#detailBox').collapsed) {
        $item('#detailBox').expand();
        $item('#detailsShowBtn').label = "- Collapse Details";
    } else {
        $item('#detailBox').collapse();
        $item('#detailsShowBtn').label = "+ Expand Details";
    }
}

export function saveSettingsBtn_click(event) {
    $w('#cancelSettingsBtn, #saveSettingsBtn').disable();
    saveAssignment(assignment).then(() => {
        $w('#cancelSettingsBtn, #saveSettingsBtn').enable();
        generateSuccess("Assignment Succesfully Saved.");
    }).catch((error) => {
        generateError("An error occured. Try again later.", error)
    });
}

export function limitAttemptsCheckbox_change(event) {
    $w('#cancelSettingsBtn, #saveSettingsBtn').enable();
    let $item = $w.at(event.context);
    const assignmentIndex = $w('#assignDataRepeater').data.findIndex((obj) => obj._id === event.context.itemId);
    if (event.target.checked === true) {
        $item('#maxAttemptsSlider').expand();
        $item('#maxAttemptsSlider').value = assignment.assignData[assignmentIndex].attempts.maxAttempts || 1;
        assignment.assignData[assignmentIndex].attempts.limitAttempts = true;
    } else {
        $item('#maxAttemptsSlider').collapse();
        assignment.assignData[assignmentIndex].attempts.limitAttempts = false;
    }
}

/*
export function maxAttemptsSlider_change(event) {
    let $item = $w.at(event.context);
    console.log(event.context);
    const assignmentIndex = $w('#assignDataRepeater').data.findIndex((obj) => obj._id === event.context.itemId);
    console.log(assignmentIndex);
    assignment.assignData[assignmentIndex].attempts.maxAttempts = event.target.value;
}
*/

export function limitAvailabilityCheckbox_change(event) {
    $w('#cancelSettingsBtn, #saveSettingsBtn').enable();
    let $item = $w.at(event.context);
    const assignmentIndex = $w('#assignDataRepeater').data.findIndex((obj) => obj._id === event.context.itemId);
    if (event.target.checked === true) {
        $item('#startGroup, #endGroup').expand();
        assignment.assignData[assignmentIndex].availability.limitAvailability = true;
        const newStartDate = new Date();
        const hoursValue = newStartDate.getHours() > 9 ? newStartDate.getHours().toString() : '0' + newStartDate.getHours().toString();
        const minutesValue = newStartDate.getMinutes() > 9 ? newStartDate.getMinutes().toString() : '0' + newStartDate.getMinutes().toString();
        $item('#startTimePicker').value = `${hoursValue}:${minutesValue}`;
        $item('#startDatePicker').value = newStartDate;
        assignment.assignData[assignmentIndex].availability.startDate = combineDateTime(newStartDate, $item('#startTimePicker').value);
        $item('#endTimePicker').value = '23:59:59';
        $item('#endDatePicker').value = newStartDate;
        assignment.assignData[assignmentIndex].availability.endDate = combineDateTime(newStartDate, $item('#endTimePicker').value);
    } else {
        $item('#startGroup, #endGroup').collapse();
        assignment.assignData[assignmentIndex].availability.limitAvailability = false;
    }
}

export function dueDatesCheckbox_change(event) {
    $w('#cancelSettingsBtn, #saveSettingsBtn').enable();
    let $item = $w.at(event.context);
    const assignmentIndex = $w('#assignDataRepeater').data.findIndex((obj) => obj._id === event.context.itemId);
    if (event.target.checked === true) {
        $item('#dueDateGroup').expand();
        assignment.assignData[assignmentIndex].availability.limitAvailability = true;
        const newDueDate = new Date();
        $item('#dueTimePicker').value = `23:59:59`;
        $item('#dueDatePicker').value = newDueDate;
        assignment.assignData[assignmentIndex].dueDates.enabled = true;
        assignment.assignData[assignmentIndex].dueDates.dueDate = combineDateTime(newDueDate, $item('#dueTimePicker').value);
    } else {
        $item('#dueDateGroup').collapse();
        assignment.assignData[assignmentIndex].dueDates.enabled = false;
    }
}

export function allowLateSubmissionsCheckbox_change(event) {
    $w('#cancelSettingsBtn, #saveSettingsBtn').enable();
    let $item = $w.at(event.context);
    const assignmentIndex = $w('#assignDataRepeater').data.findIndex((obj) => obj._id === event.context.itemId);
    if (event.target.checked === true) {
        assignment.assignData[assignmentIndex].dueDates.allowLateSubmissions = true;
        const dueDate = new Date(assignment.assignData[assignmentIndex].dueDates.dueDate['$date'] || assignment.assignData[assignmentIndex].dueDates.dueDate);
        const endDate = new Date(assignment.assignData[assignmentIndex].availability.endDate['$date'] || assignment.assignData[assignmentIndex].availability.endDate);
        if (dueDate.getTime() > endDate.getTime()) {
            const hoursValue = dueDate.getHours() > 9 ? dueDate.getHours().toString() : '0' + dueDate.getHours().toString();
            const minutesValue = dueDate.getMinutes() > 9 ? dueDate.getMinutes().toString() : '0' + dueDate.getMinutes().toString();
            $item('#endDatePicker').value = dueDate;
            $item('#endTimePicker').value = `${hoursValue}:${minutesValue}`;
            if (assignment.assignData[assignmentIndex].availability.startDate) {
                const startDate = new Date(assignment.assignData[assignmentIndex].availability.startDate['$date'] || assignment.assignData[assignmentIndex].availability.startDate);
                $item('#startDatePicker').value = startDate;
                const starthoursValue = startDate.getHours() > 9 ? startDate.getHours().toString() : '0' + startDate.getHours().toString();
                const startminutesValue = startDate.getMinutes() > 9 ? startDate.getMinutes().toString() : '0' + startDate.getMinutes().toString();
                $item('#startTimePicker').value = `${starthoursValue}:${startminutesValue}`;
            } else {
                const startDate = new Date();
                $item('#startDatePicker').value = startDate;
                const starthoursValue = startDate.getHours() > 9 ? startDate.getHours().toString() : '0' + startDate.getHours().toString();
                const startminutesValue = startDate.getMinutes() > 9 ? startDate.getMinutes().toString() : '0' + startDate.getMinutes().toString();
                $item('#startTimePicker').value = `${starthoursValue}:${startminutesValue}`;
                assignment.assignData[assignmentIndex].availability.startDate = combineDateTime(startDate, $item('#startTimePicker').value);
            }
            assignment.assignData[assignmentIndex].availability.endDate = combineDateTime(dueDate, $item('#endTimePicker').value);
        }
    } else {
        $item('#dueDateGroup').collapse();
        assignment.assignData[assignmentIndex].dueDates.enabled = false;
    }
}

export function manuallyGradeWritingCheckbox_change(event) {
    $w('#cancelSettingsBtn, #saveSettingsBtn').enable();
    const assignmentIndex = $w('#assignDataRepeater').data.findIndex((obj) => obj._id === event.context.itemId);
    if (event.target.checked === true) {
        assignment.assignData[assignmentIndex].grading.manualGrading = true;
    } else {
        assignment.assignData[assignmentIndex].gradingmanualGrading = false;
    }
}

export function timeLimitCheckbox_change(event) {
    $w('#cancelSettingsBtn, #saveSettingsBtn').enable();
    let $item = $w.at(event.context);
    const assignmentIndex = $w('#assignDataRepeater').data.findIndex((obj) => obj._id === event.context.itemId);
    if (event.target.checked === true) {
        $item('#timeGroup').expand();
        assignment.assignData[assignmentIndex].timer.enabled = true;
        if (assignment.assignData[assignmentIndex].timer.timeLimit) {
            $item('#minutesInput').value = Math.round(assignment.assignData[assignmentIndex].timer.timeLimit / 60);
            $item('#secondsInput').value = assignment.assignData[assignmentIndex].timer.timeLimit % 60;
        }
    } else {
        $item('#timeGroup').collapse();
        assignment.assignData[assignmentIndex].timer.enabled = false;
    }
}

export function minutesInput_input(event) {
    $w('#cancelSettingsBtn, #saveSettingsBtn').enable();
    let $item = $w.at(event.context);
    const assignmentIndex = $w('#assignDataRepeater').data.findIndex((obj) => obj._id === event.context.itemId);
    const secondsValue = $item('#secondsInput').value || 0;
    const minutesValue = $item('#minutesInput').value || 0;
    if (secondsValue === 0) {
        $item('#secondsInput').value = 0;
    }
    if (minutesValue === 0) {
        $item('#minutesInput').value = 0;
    }
    assignment.assignData[assignmentIndex].timer.timeLimit = secondsValue + minutesValue * 60;
}

export function secondsInput_input(event) {
    $w('#cancelSettingsBtn, #saveSettingsBtn').enable();
    let $item = $w.at(event.context);
    const assignmentIndex = $w('#assignDataRepeater').data.findIndex((obj) => obj._id === event.context.itemId);
    const secondsValue = $item('#secondsInput').value || 0;
    const minutesValue = $item('#minutesInput').value || 0;
    if (secondsValue === 0) {
        $item('#secondsInput').value = 0;
    }
    if (minutesValue === 0) {
        $item('#minutesInput').value = 0;
    }
    assignment.assignData[assignmentIndex].timer.timeLimit = secondsValue + minutesValue * 60;
}

export function cancelSettingsBtn_click(event) {
    wixLocation.to(wixLocation.url);
}

export function addGroupBtn_click(event) {
    openLightbox("Assignment People", { students: students.items }).then((res) => {
        if (res) {
            $w('#cancelSettingsBtn, #saveSettingsBtn').enable();
            let newAssignmentGroup = assignment.assignData[0];
            newAssignmentGroup.students = res.data;
            /*
            let newAssignmentGroup = {
                attempts: {
                    limitAttempts: false
                },
                students: res.data,
                availability: {
                    limitAvailability: false
                },
                dueDates: {
                    enabled: false
                },
                timer: {
                    enabled: false
                }
            }
            */
            assignment.assignData.push(newAssignmentGroup);
            $w('#assignDataRepeater').data = assignment.assignData.map((obj) => { return { ...obj, _id: generateRandom(8) } });
            $w('#assignDataRepeater').forEachItem(($item, itemData, index) => {
                if (index + 1 === $w('#assignDataRepeater').data.length) {
                    $item('#studentList').scrollTo();
                }
            });
        }
    });
}

export function editPeopleBtn_click(event) {
    let $item = $w.at(event.context);
    const assignmentIndex = $w('#assignDataRepeater').data.findIndex((obj) => obj._id === event.context.itemId);
    openLightbox("Assignment People", { students: students.items, selectedStudents: assignment.assignData[assignmentIndex].students }).then((res) => {
        if (res) {
            $w('#cancelSettingsBtn, #saveSettingsBtn').enable();
            assignment.assignData[assignmentIndex].students = res.data;
            const studentList = students.items.filter((obj) => assignment.assignData[assignmentIndex].students.includes(obj._id));
            $item('#studentList').text = studentList.map((obj) => obj.name).join(", ");
        }
    });
}

export function deleteGroup_click(event) {
    $w('#cancelSettingsBtn, #saveSettingsBtn').enable();
    const assignmentIndex = $w('#assignDataRepeater').data.findIndex((obj) => obj._id === event.context.itemId);
    assignment.assignData.splice(assignmentIndex, 1);
    let repeaterData = $w('#assignDataRepeater').data
    repeaterData.splice(assignmentIndex, 1);
    $w('#assignDataRepeater').data = repeaterData;
}

export function addActivityBtn_click(event) {
    openLightbox("Select Activity", { oldActivities: activities.items.map(obj => obj._id) }).then((res) => {
        if (res.data && res.data.length > 0) {
            $w('#activityRepeater').data = $w('#activityRepeater').data.concat(res.data);;
            $w('#activitiesTxt').text = `${$w('#activityRepeater').data.length} Activities`;
            insertAssignmentActivity(assignment, $w('#activityRepeater').data.map(obj => obj._id)).then(() => {
                updateAssignmentActivityOrder(assignment, res.data.map(obj => obj._id))
                generateSuccess("Activities Succesfully Added.");
            }).catch((error) => {
                generateError(null, error);
            })
        }
    })
}

export function threeDotsMenu_click(event) {
    const repeaterIndex = $w('#activityRepeater').data.findIndex(obj => obj._id === event.context.itemId);
    contextIndex = repeaterIndex;
    memory.setItem("prevUrl", wixLocation.url);
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
    if (formFactor === 'Mobile') {
        yOffset = 90 * repeaterIndex;
    } else {
        yOffset = 108 * repeaterIndex
    }
    timeline.add($w('#contextMenu'), [{ "y": yOffset, "duration": 10 }]).play().onComplete(async () => {
        await $w('#contextMenu').show();
    });
}

export function contextMenu_mouseOut(event) {
    $w('#contextMenu').hide();
}

export function deleteActivity_click(event) {
    removeAssignmentActivity(assignment, $w('#activityRepeater').data[contextIndex]._id).then(() => {
        let activityRepeaterData = $w('#activityRepeater').data;
        activityRepeaterData.splice(activityRepeaterData.findIndex(obj => obj._id === event.context.itemId), 1);
        $w('#activityRepeater').data = activityRepeaterData;
        generateSuccess("Activities Succesfully Removed.");
    }).catch(() => {
        generateError(null, error);
    })
}

export function reorderButton_click(event) {
    const timeline = wixAnimations.timeline();
    let yOffset;
    if (formFactor === 'Mobile') {
        yOffset = 90 * contextIndex;
    } else {
        yOffset = 108 * contextIndex;
    }
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
    console.log(reorderedArray);
    updateAssignmentActivityOrder(assignment, reorderedArray);
}

async function updateSort(fromIndex, toIndex) {
    let activityRepeaterData = $w('#activityRepeater').data;
    const elm = activityRepeaterData.splice(fromIndex, 1)[0];
    activityRepeaterData.splice(toIndex, 0, elm);
    $w('#activityRepeater').data = activityRepeaterData;
    $w('#reorderBox').hide();
}

export function moveDown_click(event) {
    const currentItemIndex = contextIndex;
    const activityIdArray = $w('#activityRepeater').data.map((obj) => { return obj._id });
    const reorderedArray = moveArray(activityIdArray, currentItemIndex, currentItemIndex + 1);
    updateSort(currentItemIndex, currentItemIndex + 1);
    contextIndex = currentItemIndex + 1;
    updateAssignmentActivityOrder(assignment, reorderedArray);
}

export function moveBottom_click(event) {
    const currentItemIndex = contextIndex;
    const activityIdArray = $w('#activityRepeater').data.map((obj) => { return obj._id });
    const reorderedArray = moveArray(activityIdArray, currentItemIndex, $w('#activityRepeater').data.length - 1);
    updateSort(currentItemIndex, $w('#activityRepeater').data.length - 1);
    contextIndex = $w('#activityRepeater').data.length - 1;
    updateAssignmentActivityOrder(assignment, reorderedArray);
}

export function moveTop_click(event) {
    const currentItemIndex = contextIndex;
    const activityIdArray = $w('#activityRepeater').data.map((obj) => { return obj._id });
    const reorderedArray = moveArray(activityIdArray, currentItemIndex, 0);
    updateSort(currentItemIndex, 0);
    contextIndex = 0;
    updateAssignmentActivityOrder(assignment, reorderedArray);
}

async function loadGrading(submissionOwner) {
    await loadActivityItems();
    let studentSubmissionArrayUngraded = [];
    let studentsSubmissionArrayGraded = [];
    if (!submissions) {
        submissions = await fetchAssignmentSubmissions([assignment['class']], [assignment._id]);
    }
    if (submissions.length > 0) {
        console.log(students);
        console.log(submissions);
        students.forEach((student, index, array) => {
            const matchedSubmissionsArray = submissions.filter((obj) => obj._owner === student._id);
            if (matchedSubmissionsArray.length > 0) {
                const matchedItem = {
                    person: {
                        name: `${student.firstName} ${student.lastName}`,
                        _id: student._id,
                    },
                    submissions: matchedSubmissionsArray
                }
                if (matchedSubmissionsArray[0].gradingComplete) {
                    // matchedItem.submission.gradingComplete = true;
                    studentsSubmissionArrayGraded.push(matchedItem);
                } else {
                    studentSubmissionArrayUngraded.push(matchedItem)
                }
            }
        });
        const studentSubmissionArray = studentSubmissionArrayUngraded.concat(studentsSubmissionArrayGraded);;
        const dropdownData = studentSubmissionArray.map((obj) => {
            let dropdownObj = {
                value: obj.person._id
            };
            if (obj.submissions[0].gradingComplete) {
                dropdownObj.label = `${obj.person.name} (Graded)`
            } else {
                dropdownObj.label = obj.person.name
            }
            return dropdownObj;
        });
        $w('#studentDropdown').options = dropdownData;
        if (submissionOwner) {
            $w('#studentDropdown').value = submissionOwner;
        } else {
            const firstSubmissionStudent = studentSubmissionArray.find((obj) => obj.submissions.length > 0);
            $w('#studentDropdown').value = firstSubmissionStudent.person._id;
        }
        $w('#submissionsDropdown').options = submissions.filter((obj) => obj._owner === $w('#studentDropdown').value).map((submission) => {
            return {
                "value": submission._id,
                "label": new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(submission._createdDate)
            }
        })
        $w('#submissionsDropdown').value = $w('#submissionsDropdown').options[0].value;
        let questions = [];
        $w('#stateboxStudentSubmission').changeState('StudentSubmission');
        /*
        let assignmentGroup;
        if (assignment.assignData.some((obj) => obj.students.includes(userId))) {
            assignmentGroup = assignment.assignData.find((obj) => obj.students.includes(userId));
        } else {
            assignmentGroup = assignment.assignData[0];
        }
        */
        activities.items.forEach((activity) => {
            if (activity.type === 'Quiz') {
                activity.data.forEach((question) => {
                    question.activityId = activity._id;
                    questions.push(question);
                });
            } else if (activity.type === 'Article') {
                questions.push({
                    "title": activity.title,
                    "activityId": activity._id,
                    "type": "Article",
                    "_id": activity._id
                });
            }
        });
        $w('#gradingQuestionsRepeater').data = questions;
        $w('#gradingQuestionsRepeater').expand();
        //const matchingSubmissionsFirst = submissions.find((obj) => obj._owner === $w('#studentDropdown').value);
        //$w('#submissionsDropdown').value = matchingSubmissionsFirst._id;
        /*
        $w('#gradingQuestionsRepeater').data = questions;
        const matchingSubmission = studentSubmissionArray.find((obj) => obj._id === $w('#studentDropdown').value).submissions[0];
        $w('#startedDate').text = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(matchingSubmission._createdDate['$date']);
        $w('#finishedDate').text = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(matchingSubmission._updatedDate['$date']);
        $w('#gradingStatebox').changeState('GradingAll');
        */
        $w('#gradingStatebox').changeState('GradingAll');
    } else {
        $w('#gradingStatebox').changeState('GradingNoSubmission');
    }
    /*
    submission.scoringData[activityIndex].questions[questionIndex].score = SCORE_ENTERED;
    submission.gradingComplete = true;
    */
}

let quizscore;

export function gradingQuestionsRepeater_itemReady($item, itemData, index) {
    const submission = submissions.find((obj) => obj._id === $w('#submissionsDropdown').value);
    $item('#quizresultinstructions').html = itemData.instructions;
    $item('#quizrepeaternumber').text = (index + 1).toString();
    const activitySubmissionDataIndex = submission.data.findIndex(obj => obj._id === itemData.activityId);
    if (itemData.type === 'Article') {
        console.log(activitySubmissionDataIndex);
        console.log(submission.data[activitySubmissionDataIndex]?.completed);
        if (activitySubmissionDataIndex !== -1 && submission.data[activitySubmissionDataIndex]?.completed) {
            $item('#scoreDisplayTxt').text = "1";
        }
        $item('#quizresultinstructions').html = `<h5 class="color_14 wixui-rich-text__text">${itemData.title}</h5>`;
        $item('#responseLabel').collapse();
        $item('#quizResponseTxt').html = `<h6 class="color_33 wixui-rich-text__text">Article</h6>`;
        $item('#correctLabel').collapse();
        $item('#quizResultCorrectAnswer').collapse();
    } else {
        const activityResponseData = submission.data[activitySubmissionDataIndex]?.questions.filter(obj => obj._id === itemData._id)[0];
        const scoringDataActivityIndex = submission.scoringData.findIndex((obj) => obj._id === itemData.activityId);
        const scoringData = submission.scoringData[scoringDataActivityIndex]?.questions.filter(obj => obj._id === itemData._id)[0];
        console.log("Is" + itemData.type);
        console.log(submission.scoringData[scoringDataActivityIndex].questions);
        if (scoringData.accuracy) {
            console.log("Has Accuracy" + itemData.type);
            $item('#scoreDisplayTxt').text = parseFloat(scoringData.accuracy.toFixed(2)).toString();
        } else {
            console.log(scoringData.accuracy);
            console.log("No Accuracy" + itemData.type);
        }
        if (itemData.type === 'link' || itemData.type === 'fileupload') {
            if (submission.data[activitySubmissionDataIndex]?.questions.some(obj => obj._id === itemData._id)) {
                //$item('#quizResponseTxt').text = activityResponseData.response;
                $item('#quizResponseTxt').html = `<p style="line-height:normal; font-size:18px; color: #FEC178;"><span style="letter-spacing:normal;"><span>${activityResponseData.response}</span></span></p>`;
            } else {
                $item('#quizResponseTxt').html = '<p style="line-height:normal; font-size:18px; color: #FF0000;"><span style="letter-spacing:normal;"><span>No Response</span></span></p>';
            }
        } else if (itemData.type === 'text') {
            let assignmentGroup;
            if (assignment.assignData.some((obj) => obj.students.includes(submission._owner))) {
                assignmentGroup = assignment.assignData.find((obj) => obj.students.includes(submission._owner));
            } else {
                assignmentGroup = assignment.assignData[0];
            }
            if (assignmentGroup.grading.manualGrading) {
                $item('#scoreDisplayTxt').hide();
                $item('#gradingRepeaterScoreInput').show();
                $item('#gradingRepeaterScoreInput').value = scoringData.accuracy;
            } else {
                /*
                if (activityResponseData?.response.length > 0) {
                    $item('#scoreDisplayTxt').text = '1';
                } else {
                    $item('#scoreDisplayTxt').text = '0';
                }
                */
            }
            if (submission.data[activitySubmissionDataIndex]?.questions.some(obj => obj._id === itemData._id)) {
                $item('#quizResponseTxt').html = `<p style="line-height:normal; font-size:18px; color: #FEC178;"><span style="letter-spacing:normal;"><span>${activityResponseData.response}</span></span></p>`;
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
                        $item('#quizResponseTxt').html = `<p style="line-height:normal; font-size:18px; color: #FEC178;"><span style="letter-spacing:normal;"><span>"${$item('#quizResponseTxt').text}"</span></span></p>`;
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
                const matchingResponseIndex = itemData.responseoptions.findIndex((responseoption) => responseoption.value === matchingresponse.response);
                const matchingAnswerIndex = itemData.responseoptions.findIndex((responseoption) => responseoption.value === question.answer);
                let textColor;
                if (question.answer === matchingresponse.response) {
                    textColor = '#13C402';
                    matchingScore++;
                } else {
                    textColor = '#ff412b';
                }
                if (submission.data[activitySubmissionDataIndex]?.questions.some(obj => obj._id === itemData._id)) {
                    //$item('#scoreDisplayTxt').text = (matchingScore / itemData.questions.length).toString();
                }
                const selectedText = `<p style="color: ${textColor}; font-size:14px;"><span style="font-size:14px;">${itemData.responseoptions[matchingResponseIndex]?.label || 'No Response'}</span></p>`;
                tableArray.push({ "prompt": question.label, "selected": selectedText, "answer": itemData.responseoptions[matchingAnswerIndex].label });
                if (index + 1 === itemData.questions.length) {
                    quizscore = quizscore + Math.round((matchingScore / itemData.questions.length) * 100) / 100;
                    matchingScore = 0;
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
                        $item('#quizResponseTxt').html = `<p style="line-height:normal; font-size:18px; color: #FEC178;"><span style="letter-spacing:normal;"><span>${$item('#quizResponseTxt').text}</span></span></p>`;
                        quizscore++;
                    } else {
                        $item('#quizResponseTxt').html = `<p style="line-height:normal; font-size:18px; color: #FF0000;"><span style="letter-spacing:normal;"><span>${$item('#quizResponseTxt').text}</span></span></p>`;
                    }
                } else {
                    if (activityResponseData.response === itemData.answer) {
                        $item('#quizResponseTxt').html = `<p style="line-height:normal; font-size:18px; color: #FEC178;"><span style="letter-spacing:normal;"><span>${$item('#quizResponseTxt').text}</span></span></p>`;
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
        } else {
            const filteredanswers = itemData.options.filter(obj => obj.value === itemData.answer);
            if (submission.data[activitySubmissionDataIndex]?.questions.some(obj => obj._id === itemData._id)) {
                const filteredoptions = itemData.options.filter(obj => obj.value === activityResponseData.response);
                $item('#quizResponseTxt').text = filteredoptions[0].label;
                if (filteredoptions[0].value === filteredanswers[0].value) {
                    //$item('#scoreDisplayTxt').text = '1';
                    $item('#correctLabel').text = "Correct Answer (Selected)";
                    $item('#quizResponseTxt').html = `<p style="line-height:normal; font-size:18px; color: #FEC178;"><span style="letter-spacing:normal;"><span>${$item('#quizResponseTxt').text}</span></span></p>`;
                    quizscore++;
                } else {
                    $item('#quizResponseTxt').html = `<p style="line-height:normal; font-size:18px; color: #FF0000;"><span style="letter-spacing:normal;"><span>"${$item('#quizResponseTxt').text}"</span></span></p>`;
                }
            } else {
                $item('#quizResponseTxt').html = '<p style="line-height:normal; font-size:18px; color: #FF0000;"><span style="letter-spacing:normal;"><span>No Response</span></span></p>';
            }
            $item('#quizResultCorrectAnswer').text = filteredanswers[0].label;
        }
    }
    $item('#quizrepeaterNumber').text = (index + 1).toString();
    if (index + 1 === $w('#gradingQuestionsRepeater').data.length) {
        //$w('#recievedscoreNumber').text = quizscore.toString();
        //$w('#progressBarScore').value = quizscore;
        quizscore = 0;
        //$w('#quizstatebox').changeState('results');
    }
    /*
    const matchingSubmission = submissions.find((obj) => obj._id === $w('#studentDropdown').value);
    $item('#gradingRepeaterInstructionText').html = itemData.instructions;
    const activityIndex = matchingSubmission.data.findIndex((obj) => obj._id === itemData._id);
    const questionIndex = matchingSubmission.data[activityIndex].questions.findIndex((obj) => obj._id === itemData._id);
    const scoringDataActivityIndex = matchingSubmission.scoringData.findIndex((obj) => obj._id === itemData._id);
    const scoringDataQuestionIndex = matchingSubmission.scoringData[scoringDataActivityIndex].questions.findIndex((obj) => obj._id === itemData._id);
    $item('#gradingRepeaterScoreInput').value = matchingSubmission.scoringData[scoringDataActivityIndex].questions[scoringDataQuestionIndex].accuracy;
    $item('#gradingRepeaterResponseTxt').html = matchingSubmission.data[activityIndex].questions[questionIndex].response || "No Response";
    */
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

export function gradingRepeaterScoreInput_change(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        const gradingRepeaterItem = $w('#gradingQuestionsRepeater').data.find((obj) => obj._id === event.context.itemId);
        let matchingSubmission = submissions.find((obj) => obj._id === $w('#submissionsDropdown').value);
        const activityIndex = matchingSubmission.scoringData.findIndex((obj) => obj._id === gradingRepeaterItem.activityId);
        const questionIndex = matchingSubmission.scoringData[activityIndex].questions.findIndex((obj) => obj._id === gradingRepeaterItem._id);
        matchingSubmission.scoringData[activityIndex].questions[questionIndex].accuracy = Number(event.target.value);
        let totalPoints = 0;
        let gradingComplete = true;
        matchingSubmission.scoringData.forEach((activity, index) => {
            if (!activity.accuracy && activity.questions && activity?.accuracy !== 0) {
                let activityPoints = 0;
                activity.questions.forEach((question) => {
                    activityPoints += question.accuracy;
                    if (!question.accuracy) {
                        gradingComplete = false;
                    }
                });
                activity.accuracy = Number(activityPoints / activity.questions.length);
            }
            totalPoints += activity.accuracy;
        });
        if (gradingComplete) {
            matchingSubmission.accuracy = totalPoints / matchingSubmission.scoringData.length;
            matchingSubmission.gradingComplete = true;
            let studentDropdownOptions = $w('#studentDropdown').options;
            let studentDropdownOption = studentDropdownOptions.find((obj) => obj.value === $w('#studentDropdown').value);
            if (!studentDropdownOption.label.includes("(Graded)")) {
                studentDropdownOption.label = `${studentDropdownOption.label} (Graded)`
            }
            $w('#studentDropdown').options = studentDropdownOptions;
        }
        return wixData.update("AssignmentSubmissions", matchingSubmission).then(() => {
            generateSuccess("Score saved.");
        })
    }, 500);
}

export async function studentDropdown_change(event) {
    await loadGrading($w('#studentDropdown').value);
    const matchingSubmission = submissions.find((obj) => obj._id === $w('#submissionsDropdown').value);
    $w('#startedDate').text = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(matchingSubmission._createdDate);
    $w('#finishedDate').text = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(matchingSubmission._updatedDate);
    $w('#gradingQuestionsRepeater').forEachItem(($item, itemData, index) => {
        gradingQuestionsRepeater_itemReady($item, itemData, index);
        /*
        $item('#quizresultinstructions').html = itemData.instructions;
        const activityIndex = matchingSubmission.data.findIndex((obj) => obj._id === itemData._id);
        const questionIndex = matchingSubmission.data[activityIndex].findIndex((obj) => obj._id === itemData._id);
        $item('#gradingRepeaterScoreInput').value = matchingSubmission.scoringData[activityIndex].questions[questionIndex].score;
        $item('#quizresultinstructions').html = matchingSubmission.data[activityIndex].questions[questionIndex].response || "No Response";
        */
    });
}

export function previousSubmission_click(event) {
    // This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
    // Add your code for this event here: 
}

export function nextSubmission_click(event) {

}

export function checkboxGroupStudents_change(event) {
    $w('#cancelSettingsBtn, #saveSettingsBtn').enable();
    assignment.selectedStudents = event.target.value;
}

export function assignDropdown_change(event) {
    $w('#cancelSettingsBtn, #saveSettingsBtn').enable();
    if (event.target.value === "Selected") {
        assignment.assignToSelectedStudents = true;
        loadSelectedStudents();
    } else {
        $w('#checkboxGroupStudents').collapse();
        assignment.assignToSelectedStudents = false;
    }
}

let prevSelectedValue = 'all';

export function menuselectiontags_change(event) {
    // Prevent deselecting the only selected tag. Radio buttons do not allow it so tags shouldn't either.
    if (!event.target.value || event.target.value.length === 0) {
        // Re-apply the previously selected tag.
        event.target.value = [prevSelectedValue];
        // Replace the previously selected tag with the newly selected one.
    } else {
        // Note: Array.filter() was added in ES7. Only works in some browsers.
        event.target.value = event.target.value.filter(x => x !== prevSelectedValue);
        prevSelectedValue = event.target.value[0];
    }
    const selectedValue = event.target.value[0];
    let questions = [];
    activities.items.forEach((activity) => {
        if (activity.type === 'Quiz') {
            activity.data.forEach((question) => {
                question.activityId = activity._id;
                questions.push(question);
                /*
                if (question.type === "text") {
                    question._id = activity._id
                    questions.push(question);
                }
                */
            });
        } else if (activity.type === 'Article') {
            questions.push({
                "title": activity.title,
                "type": "Article",
                "activityId": activity._id,
                "_id": activity._id
            });
        }
    });
    switch (selectedValue) {
    case 'all':
        $w('#gradingQuestionsRepeater').data = questions;
        break;
    case 'writing':
        $w('#gradingQuestionsRepeater').data = questions.filter((obj) => obj.type === 'text');
        break;
    case 'articles':
        $w('#gradingQuestionsRepeater').data = questions.filter((obj) => obj.type === 'Article');
        break;
    }
}

export function submissionsDropdown_change(event) {
    $w('#gradingQuestionsRepeater').forEachItem(($item, itemData, index) => {
        gradingQuestionsRepeater_itemReady($item, itemData, index);
    });
}

export async function activitiesAnalyticsRepeater_itemReady($item, itemData, index) {
    if (!submissions) {
        submissions = await fetchAssignmentSubmissions([assignment['class']], [assignment._id]);
    }
    $w('#activityTitleAnalytics').text = itemData.title;
    $w('#activityTypeAnalytics').text = itemData.type;
    switch (itemData.type) {
    case 'Quiz':
        $item('#articleIconAnalytics, #discussionIconAnalytics').hide();
        $item('#quizIconAnalytics').show();
        break;
    case 'Article':
        $item('#quizIconAnalytics, #discussionIconAnalytics').hide();
        $item('#articleIconAnalytics').show();
        break;
    case 'Discussion':
        $item('#quizIconAnalytics, #articleIconAnalytics').hide();
        $item('#discussionIconAnalytics').show();
        break;
    }
    const accuracyPercentage = Math.round((itemData.averageAccuracy) * 100);
    let textColor;
    switch (true) {
    case (accuracyPercentage > 90):
        textColor = '#1D9C00';
        break;
    case (accuracyPercentage > 75):
        textColor = '#61D836';
        break;
    case (accuracyPercentage > 50):
        textColor = '#FFD932';
        break;
    case (accuracyPercentage > 25):
        textColor = '#F27200'
        break;
    default:
        textColor = '#FF4040';
        break;
    }
    if (itemData.averageAccuracy) {
        $item('#activityAccuracy').html = `<h5 style="font-size:21px; line-height:normal;"><span style="color:${textColor};"><span style="font-size:21px;"><span style="letter-spacing:normal;">${accuracyPercentage}%</span></span></span></h5>`;
        $item('#activityAccuracyProgressBar').style.foregroundColor = textColor;
        $item('#activityAccuracyProgressBar').value = itemData.averageAccuracy;
    }
    //let questionGroups = [{_id: activity._id, accuracyValues : []}]

}

export function questionAnalyticsRepeater_itemReady($item, itemData, index) {
    $item('#quizrepeaterinstructionsAnalytics').html = itemData.instructions;
    $item('#quizrepeaternumberAnalytics').text = (index + 1).toString();
    if (itemData.averageAccuracy) {
        const accuracyPercentage = Math.round((itemData.averageAccuracy) * 100);
        let textColor;
        switch (true) {
        case (accuracyPercentage > 90):
            textColor = '#1D9C00';
            break;
        case (accuracyPercentage > 75):
            textColor = '#61D836';
            break;
        case (accuracyPercentage > 50):
            textColor = '#FFD932';
            break;
        case (accuracyPercentage > 25):
            textColor = '#F27200'
            break;
        default:
            textColor = '#FF4040';
            break;
        }
        $item('#averageAccuracyQuestion').html = `<h5 style="font-size:21px; line-height:normal;"><span style="color:${textColor};"><span style="font-size:21px;"><span style="letter-spacing:normal;">${accuracyPercentage}%</span></span></span></h5>`;
    }
    if (itemData.type === 'link' || itemData.type === 'fileupload') {

    } else if (itemData.type === 'text') {
        $item('#quizResultCorrectAnswerAnalytics, #correctLabelAnalytics').collapse();
    } else if (itemData.type === 'multiselect') {
        $item('#correctLabelAnalytics').text = 'Correct Answers';
        const filteredanswersobjArray = itemData.options.filter(option => itemData.answer.includes(option.value));
        const filteredanswersArray = filteredanswersobjArray.map(option => { return option.label });
        $item('#quizResultCorrectAnswerAnalytics').text = filteredanswersArray.toString().split(',').join(', ');
    } else if (itemData.type === 'matching') {
        let tableArray = [];
        itemData.questions.forEach((question, index) => {
            const matchingAnswerIndex = itemData.responseoptions.findIndex((responseoption) => responseoption.value === question.answer);
            tableArray.push({ "prompt": question.label, "answer": itemData.responseoptions[matchingAnswerIndex].label });
            if (index + 1 === itemData.questions.length) {
                $item('#matchingTableAnalytics').rows = tableArray;
                $item('#matchingTableAnalytics').expand();
                $item('#correctLabelAnalytics, #quizResultCorrectAnswerAnalytics').hide();
            }
        })
    } else if (itemData.type === 'number') {
        $item('#quizResultCorrectAnswerAnalytics').text = itemData.answer.toString();
    } else {
        const filteredanswers = itemData.options.filter(obj => obj.value === itemData.answer);
        $item('#quizResultCorrectAnswerAnalytics').text = filteredanswers[0].label;
    }
    $item('#quizrepeaterNumberAnalytics').text = (index + 1).toString();
}

export function standardsRepeater_itemReady($item, itemData, index) {
    $item('#numberTxt').text = (index + 1).toString();
    $item('#standardsTitle').text = itemData.title;
    $item('#standardsCategory').text = itemData.category;
    $item('#standardsDescription').text = itemData.description;
    $item('#standardsApplications').html = itemData.applications;
    if (index + 1 === $w('#standardsRepeater').data.length) {
        $w('#stateboxStandards').changeState('Standards');
    }
}

export function responsetext_change(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        assignment.description = $w('#responsetext').value;
        $w('#cancelSettingsBtn, #saveSettingsBtn').enable();
    }, 500);
}

async function loadActivityItems() {
    if (!activities) {
        activities = await fetchAssignmentActivities(assignment);
        const classesDataSorted = (array, sortArray) => {
            return [...array].sort(
                (a, b) => sortArray.indexOf(a._id) - sortArray.indexOf(b._id)
            )
        }
        activities.items = classesDataSorted(activities.items, assignment.activityOrder);
    }
}