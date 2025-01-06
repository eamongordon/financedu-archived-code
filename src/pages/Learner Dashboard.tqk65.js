import wixData from 'wix-data';
import { getMemberData } from 'public/memberFunctions.js';
import { openLightbox, formFactor } from 'wix-window';
import { generateRandom } from 'public/util.js';
import { getRoles } from 'public/memberFunctions';
const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
dayjs.extend(relativeTime);

let member;
let currentSubmissionItem;
let currentModule;
let allLessons = [];
let allModules = [];
let activities = [];
let originalActivities;
let lessons = [];
let eventsData = [];
let dateRange;
let submissionDataItems;
let contentType;

$w.onReady(async function () {
    member = await getMemberData();
    const submissionData = await wixData.query("LearnerSubmissionData").eq("_owner", member._id).include("course").isNotEmpty("course").find();
    submissionDataItems = submissionData.items.filter((obj) => typeof obj.course === 'object');
    loadMemberCard();
    loadCourseData();
    submissionDataItems.sort((a, b) => new Date(b._updatedDate) - new Date(a._updatedDate));
    $w("#tabsBox").onChange((event) => {
        if (event.target.currentTab.label === "Completion") {
            if (submissionData.totalCount > 0) {
                $w('#repeaterCoursesCompletion').data = submissionDataItems;
            } else {
                $w('#stateboxCompletion').changeState('NoCourses');
            }
        } else if (event.target.currentTab.label === "Recent Activity") {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            dateRange = { startDate: oneWeekAgo, endDate: new Date() };
            fetchActivities();
        }
    });
    if (submissionData.totalCount === 0) {
        $w('#stateboxCourses').changeState('FindCourses');
    }
});

async function loadMemberCard() {
    if (member.profile.nickname) {
        $w('#firstNameTxt').text = member.profile.nickname;
    } else {
        $w('#firstNameTxt').text = member.profile.slug;
    }
    if (member.profile.profilePhoto) {
        $w('#profileImg, #hoverProfileImg').src = member.profile.profilePhoto.url;
    }
    $w('#profilePicStateBox').onMouseIn((event) => {
        $w('#profilePicStateBox').changeState('Hover');
    });
    $w('#profilePicStateBox').onMouseOut((event) => {
        $w('#profilePicStateBox').changeState('Regular');
    });
}

async function loadCourseData() {
    const incompleteSubmissionsArray = submissionDataItems.filter((obj) => {
        return obj.course.lessonCount !== obj.data.filter((lessonSubmission) => lessonSubmission.completed === true).length;
    }).sort((a, b) => new Date(b._updatedDate) - new Date(a._updatedDate));
    const completeSubmissionsArray = submissionDataItems.filter((obj) => {
        return obj.course.lessonCount === obj.data.filter((lessonSubmission) => lessonSubmission.completed === true).length;
    }).sort((a, b) => new Date(b._updatedDate) - new Date(a._updatedDate));
    if (incompleteSubmissionsArray.length > 0) {
        $w('#repeaterCourses').data = incompleteSubmissionsArray;
    } else {
        $w('#repeaterCourses').data = completeSubmissionsArray;
    }
    $w('#seeAllCoursesBtn').onClick(() => {
        if ($w('#seeAllCoursesBtn').label === '+ Show All') {
            $w('#repeaterCourses').data = completeSubmissionsArray.concat(incompleteSubmissionsArray);
            $w('#seeAllCoursesBtn').label = "- Hide Complete";
        } else {
            $w('#repeaterCourses').data = incompleteSubmissionsArray;
            $w('#seeAllCoursesBtn').label = "+ Show All";
        }
    });
}

export async function repeaterCourses_itemReady($item, itemData, index) {
    const modulesQuery = await wixData.query("Modules").eq("course", itemData.course._id).ascending("order").find();
    const modulesIdList = modulesQuery.items.map((obj) => obj._id);
    itemData.modules = modulesQuery.items;
    $item('#sName').text = itemData.course.title;
    const allCategoryLessons = (await wixData.query("Lessons").hasSome("module", modulesIdList).ascending("order").find()).items;
    itemData.modules.forEach((module) => {
        const filteredModules = allCategoryLessons.filter((obj) => obj.module === module._id);
        allLessons = allLessons.concat(filteredModules);
    });
    const completedCount = itemData.data.filter((obj) => obj.completed === true).length;
    const totalLessonCount = allCategoryLessons.length;
    const percentComplete = Math.round((completedCount / totalLessonCount !== Infinity ? completedCount / totalLessonCount : 0) * 100);
    $item('#progressBar').value = (completedCount / totalLessonCount !== Infinity ? completedCount / totalLessonCount : 0);
    $item('#progressText').html = `<h5 style="font-size:24px; line-height:normal;"><span style="font-size:24px;"><span class="color_23"><span style="letter-spacing:normal;">${percentComplete}% &nbsp;</span></span><span class="color_13"><span style="letter-spacing:normal;">Complete</span></span></span></h5>`;
    if (completedCount >= totalLessonCount) {
        $item('#nextLessonIndic, #nextLessonBox').collapse();
    } else {
        $item('#nextLessonIndic, #nextLessonBox').expand();
        const completedLessons = itemData.data.filter((lessonSubmission) => lessonSubmission.completed === true);
        let nextLesson;
        if (completedLessons.length > 0) {
            allLessons.every((lesson) => {
                const hasMatchingSubmission = completedLessons.some((obj) => obj._id === lesson._id && obj.completed === true);
                if (hasMatchingSubmission) {
                    return true;
                } else {
                    nextLesson = lesson;
                    return false;
                }
            });
        } else {
            nextLesson = allCategoryLessons[0];
        }
        $item('#nextLessonTitle').text = nextLesson.title;
        const moduleItem = itemData.modules.find((obj) => obj._id === nextLesson.module);
        $item('#nextLessonModuleTitle').text = moduleItem?.title;
        $item('#nextLessonButton').link = `/lesson/${nextLesson._id}?course=${itemData.course._id}`;
    }
    if (index + 1 === $w('#repeaterCourses').data.length) {
        $w('#stateboxCourses').changeState('MyCourses');
    }
}

function fetchActivities() {
    iterateRecentActivties(submissionDataItems).then(async () => {
        const lessonIdList = lessons.map((obj) => { return obj.id });
        const lessonList = (await wixData.query("Lessons").hasSome("_id", lessonIdList).find()).items;
        const activitiesIdList = activities.map((obj) => { return obj.id });
        wixData.query("Activities").hasSome("_id", activitiesIdList).find().then((res) => {
            eventsData = [];
            const pushArray = res.items.map((activity) => {
                const matchingActivity = activities.find((obj) => obj.id === activity._id);
                const lesson = lessonList.find((lessonitem) => lessonitem._id === matchingActivity.lessonId);
                return {
                    'title': activity.title,
                    'lessonTitle': lesson.title,
                    'id': activity._id,
                    'contentType': activity.type,
                }
            });
            eventsData = eventsData.concat(pushArray);
            activities = activities.map((event) => { return { ...event, ...eventsData.find(eventsDataObj => eventsDataObj.id === event.id) } });
            if (contentType && contentType !== 'AllContent') {
                activities = activities.filter((obj) => obj.contentType === contentType);
            }
            if (activities.length > 0) {
                $w('#recentStatebox').changeState('recentActivity');
                $w('#recentActivityRepeater').data = activities;
            } else {
                $w('#recentStatebox').changeState('noActivity');
            }
        });
    });
}

function iterateRecentActivties(submissionItems) {
    lessons = [];
    submissionItems.forEach((subItem, subItemIndex) => {
        subItem.data.forEach((subLesson, subLessonIndex) => {
            let activityAccuracyCount = 0;
            let activitiesWithAccuracyCount = 0;
            subLesson.activities.forEach((subActivity, subActivityIndex) => {
                if (subActivity.completed) {
                    if (subActivity.accuracy) {
                        activities.push({
                            'type': 'activity',
                            'eventType': 'completed',
                            'date': subActivity.completedDate,
                            'startedDate': subActivity.startedDate,
                            'accuracy': subActivity.accuracy,
                            '_id': generateRandom(8),
                            'id': subActivity._id,
                            'lessonId': subLesson._id
                        });
                        activitiesWithAccuracyCount++;
                        activityAccuracyCount = activityAccuracyCount + subActivity.accuracy;
                    } else {
                        activities.push({
                            'type': 'activity',
                            'eventType': 'completed',
                            'date': subActivity.completedDate,
                            'startedDate': subActivity.startedDate,
                            '_id': generateRandom(8),
                            'id': subActivity._id,
                            'lessonId': subLesson._id
                        });
                    }
                } else {
                    activities.push({
                        'type': 'activity',
                        'eventType': 'started',
                        'date': subActivity.startedDate,
                        '_id': generateRandom(8),
                        'id': subActivity._id,
                        'lessonId': subLesson._id
                    });
                }
                if (subActivityIndex + 1 === subLesson.activities.length) {
                    if (subLesson.completed === true) {
                        if (activityAccuracyCount > 0) {
                            lessons.push({
                                'type': 'lesson',
                                'eventType': 'completed',
                                'date': subLesson.completedDate,
                                'startedDate': subLesson.startedDate,
                                'accuracy': activityAccuracyCount / activitiesWithAccuracyCount,
                                'id': subLesson._id,
                                '_id': generateRandom(8)
                            })
                        } else {
                            lessons.push({
                                'type': 'lesson',
                                'eventType': 'completed',
                                'date': subLesson.completedDate,
                                'id': subLesson._id,
                                '_id': generateRandom(8)
                            });
                        }
                    } else {
                        lessons.push({
                            'type': 'lesson',
                            'eventType': 'started',
                            'date': subLesson.startedDate,
                            'id': subLesson._id,
                            '_id': generateRandom(8),
                        });
                    }
                }
            });
        });
        if (subItemIndex + 1 === submissionItems.length) {
            activities.sort((a, b) => new Date(b.date) - new Date(a.date));
            if (!originalActivities) {
                originalActivities = activities;
            } else {
                activities = originalActivities;
            }
            if (dateRange) {
                activities = activities.filter((obj) => new Date(obj.date).getTime() > dateRange.startDate.getTime() && new Date(obj.date).getTime() < dateRange.endDate.getTime());
            }
        }
    });
    return Promise.resolve();
}

export async function repeaterCoursesCompletion_itemReady($item, itemData, index) {
    const completedLessons = itemData.data.filter((obj) => obj.completed === true);
    const completedCount = completedLessons.length;
    const totalLessonCount = allLessons.length;
    const percentComplete = Math.round((completedCount / totalLessonCount !== Infinity ? completedCount / totalLessonCount : 0) * 100);
    $item('#courseProgressBar').value = (completedCount / totalLessonCount !== Infinity ? completedCount / totalLessonCount : 0);
    $item('#courseName').text = itemData.course.title;
    $item('#courseImage').src = itemData.course.image;
    $item('#courseProgressText').html = `<h5 style="font-size:24px; line-height:normal;"><span style="font-size:24px;"><span class="color_23"><span style="letter-spacing:normal;">${percentComplete}% &nbsp;</span></span><span class="color_13"><span style="letter-spacing:normal;">Complete</span></span></span></h5>`;
    $item('#courseLastAccessedText').text = dayjs().to(new Date(itemData._updatedDate));
    $item('#courseStarted').text = new Date(itemData._createdDate).toLocaleDateString('en-us', { year: "numeric", month: "short", day: "numeric" });
    let completedActivitiesWithAccuracy = [];
    if (completedLessons.length > 0) {
        completedLessons.forEach((lesson, lessonIndex) => {
            lesson.activities.forEach((activity) => {
                if (activity.accuracy) {
                    completedActivitiesWithAccuracy.push(activity);
                }
            });
            if (lessonIndex + 1 === completedLessons.length) {
                if (completedActivitiesWithAccuracy.length > 0) {
                    let totalAccuracyNumber = 0;
                    completedActivitiesWithAccuracy.forEach((activity, activityIndex) => {
                        totalAccuracyNumber = totalAccuracyNumber + activity.accuracy;
                        if (activityIndex + 1 === completedActivitiesWithAccuracy.length) {
                            const accuracyPercentage = (totalAccuracyNumber / completedActivitiesWithAccuracy.length) * 100;
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
                            $item('#courseAccuracy').html = `<h5 style="font-size:24px; line-height:normal;"><span style="color:${textColor};"><span style="font-size:24px;"><span style="letter-spacing:normal;">${accuracyPercentage}%</span></span></span></h5>`;
                        }
                    })
                } else {
                    $item('#courseAccuracy').text = '---';
                }
            }
        });
    } else {
        $item('#courseAccuracy').text = '---';
    }
    if (index + 1 === $w('#repeaterCoursesCompletion').data.length) {
        $w('#stateboxCompletion').changeState('Courses');
    }
}

export function courseDetailsBtn_click(event) {
    if (event.context.itemId === currentSubmissionItem?._id) {
        $w('#stateboxCompletion').changeState('Modules');
    } else {
        //const modulesData = allModules.filter((obj) => obj.course === event.context.itemId);
        //console.log(modulesData);
        currentSubmissionItem = $w('#repeaterCourses').data.filter((obj) => obj._id === event.context.itemId)[0];
        $w('#moduleRepeater').data = currentSubmissionItem.modules; //currentSubmissionItem.modules;
    }
}

export async function moduleRepeater_itemReady($item, itemData, index) {
    $item('#moduleName').text = itemData.title;
    $item('#moduleColorRibbon').style.backgroundColor = itemData.color;
    if (currentSubmissionItem) {
        const allCategoryLessons = (await wixData.query("Lessons").eq("module", itemData._id).ascending("order").find()).items;
        itemData.allCategoryLessons = allCategoryLessons;
        const completedLessons = currentSubmissionItem.data.filter((lessonSubmissionItem) => lessonSubmissionItem.completed === true && allCategoryLessons.some((lessonobj) => lessonobj._id === lessonSubmissionItem._id));
        const completedCount = completedLessons.length;
        const totalLessonCount = allCategoryLessons.length;
        const percentComplete = Math.round((completedCount / totalLessonCount !== Infinity ? completedCount / totalLessonCount : 0) * 100);
        if (completedCount === totalLessonCount) {
            $item('#moduleColorRibbon').style.backgroundColor = '#13C402';
        }
        $item('#moduleProgressBar').value = (completedCount / totalLessonCount !== Infinity ? completedCount / totalLessonCount : 0);
        currentSubmissionItem.data.sort((a, b) => new Date(b.startedDate) - new Date(a.startedDate));
        $item('#moduleStarted').text = new Date(currentSubmissionItem.data[0].startedDate).toLocaleDateString('en-us', { year: "numeric", month: "short", day: "numeric" });
        if (completedLessons.length > 0) {
            $item('#moduleProgressText').html = `<h5 style="font-size:24px; line-height:normal;"><span style="font-size:24px;"><span class="color_23"><span style="letter-spacing:normal;">${percentComplete}% &nbsp;</span></span><span class="color_13"><span style="letter-spacing:normal;">Complete</span></span></span></h5>`;
            completedLessons.sort((a, b) => new Date(b.completedDate) - new Date(a.completedDate));
            if (completedCount === totalLessonCount) {
                $item('#moduleCompleted').text = dayjs().to(new Date(completedLessons[0].completedDate));
            }
            $item('#progressDetailBox').expand();
            $item('#moduleDetailsBtn').expand();
            let completedActivitiesWithAccuracy = [];
            completedLessons.forEach((lesson, lessonIndex) => {
                lesson.activities.forEach((activity) => {
                    if (activity.accuracy) {
                        completedActivitiesWithAccuracy.push(activity);
                    }
                });
                if (lessonIndex + 1 === completedLessons.length) {
                    if (completedActivitiesWithAccuracy.length > 0) {
                        let totalAccuracyNumber = 0;
                        completedActivitiesWithAccuracy.forEach((activity, activityIndex) => {
                            totalAccuracyNumber = totalAccuracyNumber + activity.accuracy;
                            if (activityIndex + 1 === completedActivitiesWithAccuracy.length) {
                                const accuracyPercentage = (totalAccuracyNumber / completedActivitiesWithAccuracy.length) * 100;
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
                                if (completedCount === totalLessonCount) {
                                    $item('#moduleAccuracy').html = `<h5 style="font-size:24px; line-height:normal;"><span style="color:${textColor};"><span style="font-size:24px;"><span style="letter-spacing:normal;">${Math.round(accuracyPercentage)}%</span></span></span></h5>`;
                                }
                            }
                        })
                    } else {
                        $item('#moduleAccuracy').text = '---';
                    }
                }
            });
        } else {
            $item('#moduleAccuracy').text = '---';
        }
    }
    if (index + 1 === $w('#moduleRepeater').data.length) {
        $w('#stateboxCompletion').changeState('Modules');
    }
}

export function moduleDetailsBtn_click(event) {
    if (event.context.itemId === currentModule?._id) {
        $w('#stateboxCompletion').changeState('Lessons');
    } else {
        currentModule = $w('#moduleRepeater').data.filter((obj) => obj._id === event.context.itemId)[0];
        $w('#lessonsRepeater').data = currentModule.allCategoryLessons;
    }
}

export async function lessonsRepeater_itemReady($item, itemData, index) {
    $item('#lessonName').text = itemData.title;
    if (currentSubmissionItem) {
        if (currentSubmissionItem.data.some((obj) => obj._id === itemData._id)) {
            const lessonIndex = currentSubmissionItem.data.findIndex((obj) => obj._id === itemData._id);
            const completedActivities = currentSubmissionItem.data[lessonIndex].activities.filter((activity) => activity.completed === true);
            const completedCount = completedActivities.length;
            const totalActivityCount = (await wixData.queryReferenced("Lessons", itemData._id, "Activities")).totalCount;
            const percentComplete = Math.round((completedCount / totalActivityCount !== Infinity ? completedCount / totalActivityCount : 0) * 100);
            if (completedCount === totalActivityCount) {
                $item('#lessonColorRibbon').style.backgroundColor = '#13C402';
            } else {
                $item('#lessonColorRibbon').style.backgroundColor = '#00B5EA';
            }
            $item('#lessonProgressBar').value = (completedCount / totalActivityCount !== Infinity ? completedCount / totalActivityCount : 0);
            $item('#lessonProgressText').html = `<h5 style="font-size:24px; line-height:normal;"><span style="font-size:24px;"><span class="color_23"><span style="letter-spacing:normal;">${percentComplete}% &nbsp;</span></span><span class="color_13"><span style="letter-spacing:normal;">Complete</span></span></span></h5>`;
            $item('#lessonStarted').text = new Date(currentSubmissionItem.data[lessonIndex].startedDate).toLocaleDateString('en-us', { year: "numeric", month: "short", day: "numeric" });
            if (completedActivities.length > 0) {
                if (completedCount === totalActivityCount) {
                    $item('#lessonCompleted').html = `<h5 style="font-size:21px; line-height:normal;"><span class="color_33"><span style="font-size:21px;"><span style="letter-spacing:normal;">${dayjs().to(new Date(currentSubmissionItem.data[lessonIndex].completedDate))}</span></span></span></h5>`
                }
                $item('#lessonProgressDetailBox').expand();
                let completedActivitiesWithAccuracy = [];
                completedActivities.forEach((activity, completedActivityIndex) => {
                    if (activity.accuracy) {
                        completedActivitiesWithAccuracy.push(activity);
                    }
                    if (completedActivityIndex + 1 === completedActivities.length) {
                        if (completedActivitiesWithAccuracy.length > 0) {
                            let totalAccuracyNumber = 0;
                            completedActivitiesWithAccuracy.forEach((accuracyActivity, accuracyActivityIndex) => {
                                totalAccuracyNumber = totalAccuracyNumber + accuracyActivity.accuracy;
                                if (accuracyActivityIndex + 1 === completedActivitiesWithAccuracy.length) {
                                    const accuracyPercentage = (totalAccuracyNumber / completedActivitiesWithAccuracy.length) * 100;
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
                                    if (completedCount === totalActivityCount) {
                                        $item('#lessonAccuracy').html = `<h5 style="font-size:24px; line-height:normal;"><span style="color:${textColor};"><span style="font-size:24px;"><span style="letter-spacing:normal;">${Math.round(accuracyPercentage)}%</span></span></span></h5>`;
                                    }
                                }
                            })
                        } else {
                            $item('#lessonAccuracy').text = '---';
                        }
                    }
                });
            } else {
                $item('#lessonAccuracy').text = '---';
            }
        }
    }
    if (index + 1 === $w('#lessonsRepeater').data.length) {
        $w('#stateboxCompletion').changeState('Lessons');
    }
}

export function backModules_click(event) {
    $w('#stateboxCompletion').changeState('Courses');
}

export function backLessons_click(event) {
    $w('#stateboxCompletion').changeState('Modules');
}

export function recentActivityRepeater_itemReady($item, itemData, index) {
    $item('#eventTitle').text = itemData.title;
    $item('#eventLessonTitle').text = itemData.lessonTitle;
    if (itemData.eventType === 'started') {
        if (formFactor === 'Mobile') {
            $item('#eventStarted').text = 'Started: ' + new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(itemData.date));
        } else {
            $item('#eventStarted').text = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(itemData.date));
        }
        $item('#eventCompleted').collapse();
    } else {
        $item('#iconBox').style.backgroundColor = '#13C402';
        if (formFactor === 'Mobile') {
            $item('#eventStarted').text = 'Started: ' + new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(itemData.startedDate));
            $item('#eventCompleted').text = 'Completed: ' + new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(itemData.date));
        } else {
            $item('#eventStarted').text = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(itemData.startedDate));
            $item('#eventCompleted').text = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(itemData.date));
        }
    }
    switch (itemData.contentType) {
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
    if (index + 1 === $w('#recentActivityRepeater').data.length) {
        $w('#recentStatebox').changeState('recentActivity');
    }
}

function eventDateRange(value) {
    let startDate = new Date();
    const endDate = new Date();
    switch (value) {
    case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
    case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
    case 'month':
        startDate.setDate(startDate.getDate() - 30);
        break;
    }
    return { startDate: startDate, endDate: endDate }
}

export function eventTimeframeDropdown_change(event) {
    if ($w('#eventTimeframeDropdown').options[3].value === 'customDateRange') {
        let newOptions = $w('#eventTimeframeDropdown').options;
        newOptions.splice(3, 1);
        $w('#eventTimeframeDropdown').options = newOptions;
    }
    if (event.target.value === 'custom') {
        openLightbox("Date Range").then((res) => {
            const newOption = {
                label: `${new Intl.DateTimeFormat('en-US', { dateStyle: 'medium'}).format(res.startDate)} - ${new Intl.DateTimeFormat('en-US', { dateStyle: 'medium'}).format(res.endDate)}`,
                value: 'customDateRange'
            };
            let newOptions = $w('#eventTimeframeDropdown').options;
            newOptions.splice(3, 0, newOption);
            $w('#eventTimeframeDropdown').options = newOptions;
            $w('#eventTimeframeDropdown').value = 'customDateRange';
            dateRange = { startDate: res.startDate, endDate: res.endDate };
            fetchActivities();
        });
    } else {
        dateRange = eventDateRange(event.target.value);
        fetchActivities();
    }
}

export function eventContentDropdown_change(event) {
    contentType = event.target.value;
    fetchActivities();
}