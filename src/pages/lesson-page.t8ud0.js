import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { authentication } from 'wix-members';
import { getRouterData, openLightbox, getBoundingRect } from 'wix-window';
import { formFactor } from 'wix-window'
import { getRoles, getMemberData } from 'public/memberFunctions.js';
import { timeline } from 'wix-animations';
import { session } from 'wix-storage'

let activityIndexNum;
let questiondata;
let quizIndexNum = -1;
let submission;
let quizquestionId;
let activities;
let debounceTimer;
let activityparam = Number(wixLocation.query.activity);
let lesson;
let quizscore = 0;
let isQuizRetake = false;

let lessonIndex;
let courseId;

$w.onReady(async function () {
    lesson = getRouterData().lesson;
    activities = getRouterData().activities;
    activityIndexNum = activityparam || 0;
    $w('#lessonTitleTxt').text = lesson.title;
    try {
        const module = await wixData.get("Modules", lesson.module);
        courseId = module.course;
        const course = await wixData.get("Courses", courseId);
        let breadcrumbItems = [];
        breadcrumbItems.push({ 'label': 'Courses', 'link': '/course-catalog' }, { 'label': course.title, 'link': course['link-courses-title'] }, { 'label': module.title, 'link': `${course['link-courses-title']}?section=Modules&moduleId=${module._id}`, 'isCurrent': false });
        $w('#breadcrumbs').items = breadcrumbItems;
        if (formFactor === 'Mobile') {
            $w('#breadcrumbs').show();
        } else {
            const timelineBreadcrumbs = timeline();
            const windowInfo = await getBoundingRect();
            let xOffset = -(windowInfo.window.width - 980) / 2 + ((windowInfo.window.width - 980) * 0.115);
            timelineBreadcrumbs.add($w('#breadcrumbs'), [{ "x": xOffset, "duration": 10 }]).play().onComplete(async () => {
                await $w('#breadcrumbs').show();
            });
        }
        const newLessonArray = [{
            _id: lesson._id,
            startedDate: new Date(),
            completed: false,
            activities: []
        }];
        if (authentication.loggedIn()) {
            const learnerSubmissionQuery = await wixData.query("LearnerSubmissionData").eq("course", courseId).find()
            if (learnerSubmissionQuery.length > 0) {
                submission = learnerSubmissionQuery.items[0];
                if (submission.data.some(obj => obj._id === lesson._id)) {
                    lessonIndex = submission.data.findIndex(obj => obj._id === lesson._id);
                    if (!activityparam && activityparam !== 0) {
                        const completedActivitiesIds = submission.data[lessonIndex].activities.filter((obj) => obj.completed === true).map((obj) => { return obj._id });
                        const correspondingActivityIndex = activities.items.findLastIndex((obj) => completedActivitiesIds.includes(obj._id)) + 1;
                        if (correspondingActivityIndex !== -1 && correspondingActivityIndex < activities.totalCount) {
                            activityIndexNum = correspondingActivityIndex;
                        }
                    }
                    setUpActivities();
                } else {
                    const newElement = {
                        _id: lesson._id,
                        startedDate: new Date(),
                        completed: false,
                        activities: []
                    }
                    submission.data.push(newElement);
                    lessonIndex = submission.data.length - 1;
                    wixData.save("LearnerSubmissionData", submission).then(() => {
                        setUpActivities();
                    });
                }
            } else {
                //No Submission Existing
                wixData.save("LearnerSubmissionData", {
                    data: newLessonArray,
                    course: courseId
                }).then((item) => {
                    submission = item;
                    lessonIndex = 0;
                    setUpActivities();
                });
            }
            const roles = await getRoles();
            if (roles.includes("Teacher")) {
                if (formFactor === 'Mobile') {
                    $w('#assignLesson').expand();
                } else {
                    const timelineAssign = timeline();
                    const windowInfo = await getBoundingRect();
                    let xOffset = (windowInfo.window.width - 980) / 2 - ((windowInfo.window.width - 980) * 0.115);
                    timelineAssign.add($w('#assignLesson'), [{ "x": xOffset, "duration": 10 }]).play().onComplete(async () => {
                        await $w('#assignLesson').expand();
                    });
                }
                $w('#assignActivity').expand();
            }
        } else {
            $w('#loginStrip').expand();
            const sessionProgress = session.getItem(`lessondata-${lesson._id}`);
            if (sessionProgress) {
                submission = JSON.parse(sessionProgress);
            } else {
                submission = { data: newLessonArray, course: courseId };
                session.setItem(`lessondata-${lesson._id}`, JSON.stringify(submission))
            }
            lessonIndex = 0;
            setUpActivities();
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
        $w('#nextActivity').label = 'Next Lesson';
        const completedActivitiesLength = submission.data[lessonIndex].activities.filter(obj => obj.completed === true).length;
        const activityCount = activities.totalCount;
        if (completedActivitiesLength === activityCount) {
            $w('#nextActivity').style.backgroundColor = '#13C402';
            $w('#nextActivity').enable();
        } else {
            $w('#nextActivity').style.backgroundColor = '#E2E2E2';
            $w('#nextActivity').disable();
        }
    } else {
        $w('#nextActivity').label = 'Next Activity';
        $w('#nextActivity').style.backgroundColor = '#00B5EA';
        $w('#nextActivity').enable();
    }
    $w('#activityStateBox').changeState(activities.items[activityIndexNum].type);
}

async function insertActivities(indexnum) {
    if (!submission.data[lessonIndex].activities.some(obj => obj._id === activities.items[activityIndexNum]._id)) {
        let newElement;
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
        submission.data[lessonIndex].activities.push(newElement);
        if (authentication.loggedIn()) {
            return wixData.save("LearnerSubmissionData", submission).then(() => {
                Promise.resolve();
            }).catch((error) => {
                console.error(error);
                Promise.reject(error);
            })
        } else {
            session.setItem(`lessondata-${lesson._id}`, JSON.stringify(submission))
        }
        //});
    } else {
        Promise.resolve();
    }
}

function saveQuizData(type, markComplete) {
    let activitySubmissionDataIndex = submission.data[lessonIndex].activities.findIndex(obj => obj._id === activities.items[activityIndexNum]._id);

    function updateResponseData(responsevalue) {
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
        if (!submission.data[lessonIndex].activities[activitySubmissionDataIndex].questions.some(obj => obj._id === quizquestionId)) {
            submission.data[lessonIndex].activities[activitySubmissionDataIndex].questions.push({ _id: quizquestionId });
        }
        break;
    case 'fileupload':
        break;
    }
    if (markComplete) {
        const activitiesId = activities.items[activityIndexNum]._id;
        const submissionDataActivityIndex = submission.data[lessonIndex].activities.findIndex((obj) => obj._id === activitiesId);
        if (submission.data[lessonIndex].activities[submissionDataActivityIndex].completed === false) {
            submission.data[lessonIndex].activities[submissionDataActivityIndex].completed = true;
            submission.data[lessonIndex].activities[submissionDataActivityIndex].completedDate = new Date();
            if (authentication.loggedIn()) {
                return wixData.save("LearnerSubmissionData", submission);
            } else {
                session.setItem(`lessondata-${lesson._id}`, JSON.stringify(submission))
            }
        }
        setUpQuizResults();
    } else {
        if (authentication.loggedIn()) {
            return wixData.save("LearnerSubmissionData", submission);
        } else {
            session.setItem(`lessondata-${lesson._id}`, JSON.stringify(submission))
        }
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
    let activitySubmissionDataIndex = submission.data[lessonIndex].activities.findIndex(obj => obj._id === activities.items[activityIndexNum]._id);
    const activityResponsesArray = submission.data[lessonIndex].activities[activitySubmissionDataIndex].questions.filter(obj => obj._id === quizquestionId);
    const activityResponseData = activityResponsesArray[0];
    if (!submission.data[lessonIndex].activities[activitySubmissionDataIndex].completed === true || isQuizRetake === true) {
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
    //$item('#activityTitleTxt').html = `<h4 style="font-size:18px; padding: ${padding(itemData.title)}px 0;">${itemData.title}</h4>`;
    const submissionArrayFiltered = submission.data[lessonIndex].activities.filter(obj => obj._id === itemData._id);
    if (submissionArrayFiltered.length > 0) {
        if (submissionArrayFiltered[0].completed === true && index !== activityIndexNum) {
            $item('#iconBox').style.backgroundColor = '#13C402';
            $item('#activityTitleTxt').html = `<h4 style="color: #13C402; font-size:18px; padding: ${padding(itemData.title)}px 0;">${itemData.title}</h4>`;
            console.log('yes');
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
            $item('#iconBox').style.backgroundColor = '#00A2FF';
            $item('#activityTitleTxt').html = `<h4 style="color: #00A2FF; font-size:18px; padding: ${padding(itemData.title)}px 0;">${itemData.title}</h4>`;
        } else {
            const activitySubmissionDataIndex = submission.data[lessonIndex].activities.findIndex(obj => obj._id === itemData._id);
            if (activitySubmissionDataIndex !== -1) {
                if (submission.data[lessonIndex].activities[activitySubmissionDataIndex].completed === true && index !== activityIndexNum) {
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

async function setUpQuizResults() {
    $w('#nextActivity').expand();
    $w("#prevButton").collapse();
    $w('#progressBar').value = $w('#progressBar').targetValue;
    $w('#progressBarScore').targetValue = activities.items[activityIndexNum].data.length;
    $w('#outofScoreNumber').text = activities.items[activityIndexNum].data.length.toString();
    $w('#nextButton').collapse();
    $w("#quizResultRepeater").data = [];
    $w("#quizResultRepeater").data = activities.items[activityIndexNum].data;
    $w('#nextActivity').expand();
    checkLessonCompletion();
}

export function schooleditButton_click(event) {
    quizIndexNum = Number(event.context.itemId.slice(0, 1)) - 1;
    setUpQuiz();
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
    const completedActivitiesLength = submission.data[lessonIndex].activities.filter(obj => obj.completed === true).length;
    const activityCount = activities.totalCount;
    $w('#completedBar').value = completedActivitiesLength;
    $w('#assignmentCompletedAmounTxt').text = `${completedActivitiesLength}/${activityCount} Completed`;
    if (completedActivitiesLength === activityCount) {
        $w('#submitSecondButton').enable();
        if (submission.data[lessonIndex].completed === false) {
            submission.data[lessonIndex].completed = true;
            submission.data[lessonIndex].completedDate = new Date();
            if (authentication.loggedIn()) {
                return wixData.save("LearnerSubmissionData", submission);
            } else {
                session.setItem(`lessondata-${lesson._id}`, JSON.stringify(submission))
            }
        }
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
    $w('#submitSecondButton, #nextActivity').disable()
    const course = await wixData.get("Courses", courseId);
    wixLocation.to(`${course['link-courses-title']}?section=Modules&module=${lesson.module}`);
}

export function quizResultRepeater_itemReady($item, itemData, index) {
    $item('#quizresultinstructions').html = itemData.instructions;
    const activitySubmissionDataIndex = submission.data[lessonIndex].activities.findIndex(obj => obj._id === activities.items[activityIndexNum]._id);
    const hasResponse = submission.data[lessonIndex].activities[activitySubmissionDataIndex].questions.some(obj => obj._id === itemData._id);
    //if (submission.data[lessonIndex].activities[activitySubmissionDataIndex].questions.some(obj => obj._id === itemData._id)) {
    const activityResponseData = submission.data[lessonIndex].activities[activitySubmissionDataIndex].questions.filter(obj => obj._id === itemData._id)[0];
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
    } else if (itemData.type === 'multiselect') {
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
            /*
            if (JSON.stringify(activityResponseData.response) === JSON.stringify(itemData.answer)) {
                $item('#correctLabel').text = "Correct Answers (Selected)";
                quizscore++;
            } else {
                $item('#quizResponseTxt').html = `<p style="line-height:normal; font-size:18px; color: #FF0000;"><span style="letter-spacing:normal;"><span>"${$item('#quizResponseTxt').text}"</span></span></p>`;
            }
            */
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
        $w('#recievedscoreNumber').text = (Math.round(quizscore * 100) / 100).toString();
        $w('#progressBarScore').value = quizscore;
        submission.data[lessonIndex].activities[activitySubmissionDataIndex].accuracy = quizscore / activities.items[activityIndexNum].data.length;
        if (authentication.loggedIn()) {
            wixData.save("LearnerSubmissionData", submission);
        } else {
            session.setItem(`lessondata-${lesson._id}`, JSON.stringify(submission))
        }
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

export async function saveandExit_click(event) {
    $w('#submitSecondButton, #nextActivity').disable();
    if (authentication.loggedIn()) {
        const modules = await wixData.query("Modules").hasSome("lessons", lesson._id).hasSome("courses", courseId).find();
        const course = await wixData.get("Courses", courseId);
        wixLocation.to(`${course['link-courses-title']}?section=Modules&module=${modules.items[0]._id}`);
    } else {
        authentication.promptLogin();
    }
}

export function assignActivity_click(event) {
    openLightbox("Assign Lesson", { "mode": 'Activity', 'activityId': activities.items[activityIndexNum]._id, 'title': activities.items[activityIndexNum].title });
}

export function assignLesson_click(event) {
    openLightbox("Assign Lesson", { "mode": 'Lesson', 'lessonId': lesson._id, 'title': lesson.title });
}

export function mobileActivitesButton_click(event) {
    if ($w('#activitySelectColumn').collapsed) {
        $w('#activitySelectColumn').expand();
        $w('#mobileActivitesButton').label = "Hide All Activities";
    } else {
        $w('#activitySelectColumn').collapse();
        $w('#mobileActivitesButton').label = "Show All Activities";
    }
}

export function matchingTable_cellSelect(event) {
    let $item = $w.at(event.context.itemId);
    if (event.cellColumnId === 'Feedback') {
        const activityQuestion = $item('#quizResultRepeater').data.find(obj => obj._id === event.context.itemId);
        const question = activityQuestion.questions.find((obj) => obj.label === event.target.rows[event.cellRowIndex].prompt);
        if (question?.offerFeedback) {
            const activitySubmissionDataIndex = submission.data[lessonIndex].activities.findIndex(obj => obj._id === activities.items[activityIndexNum]._id);
            const activityResponseData = submission.data[lessonIndex].activities[activitySubmissionDataIndex].questions.filter(obj => obj._id === event.context.itemId)[0];
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