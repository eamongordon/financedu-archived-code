import { getRouterData, openLightbox, formFactor } from 'wix-window';
import wixData from 'wix-data';
import { generateRandom } from 'public/util.js';
const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
dayjs.extend(relativeTime);

let currentSubmissionItem;
let currentModule;
let activities = [];
let originalActivities;
let lessons = [];
let eventsData = [];
let dateRange;
let contentType;

$w.onReady(function () {
    const routerData = getRouterData();
    $w("#childNameTxt").text = `${routerData.childInfo.firstName} ${routerData.childInfo.lastName}`;
    routerData.childSubmissionData.items.sort((a, b) => new Date(b._updatedDate) - new Date(a._updatedDate));
    $w("#tabsBox").onChange((event) => {
        if (event.target.currentTab.label === "Completion") {
            if (routerData.childSubmissionData.totalCount > 0) {
                let repeaterCoursesData = routerData.childSubmissionData.items.filter((obj) => typeof obj.course === 'object');
                $w('#repeaterCourses').data = repeaterCoursesData; // "Second Tab"
            } else {
                $w('#stateboxCourses').changeState('NoCourses');
            }
        }
    });
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    dateRange = { startDate: oneWeekAgo, endDate: new Date() };
    fetchActivities();
});

function fetchActivities() {
    const routerChildSubmissionDataItems = getRouterData().childSubmissionData.items;
    iterateRecentActivities(routerChildSubmissionDataItems).then(async () => {
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

function iterateRecentActivities(submissionItems) {
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
                activities = activities.filter((obj) => new Date(obj.date['$date']).getTime() > dateRange.startDate.getTime() && new Date(obj.date['$date']).getTime() < dateRange.endDate.getTime());
            }
        }
    });
    return Promise.resolve();
}

export async function repeaterCourses_itemReady($item, itemData, index) {
    const modulesQuery = await wixData.query("Modules").eq("course", itemData.course._id).ascending("order").find();
    const modulesIdList = modulesQuery.items.map((obj) => obj._id);
    itemData.modules = modulesQuery.items;
    const allLessons = (await wixData.query("Lessons").hasSome("module", modulesIdList).find()).items;
    const completedLessons = itemData.data.filter((obj) => obj.completed === true)
    const completedCount = completedLessons.length;
    const totalLessonCount = allLessons.length;
    const percentComplete = Math.round((completedCount / totalLessonCount !== Infinity ? completedCount / totalLessonCount : 0) * 100);
    $item('#courseName').text = itemData.course.title;
    $item('#courseImage').src = itemData.course.image;
    $item('#courseProgressBar').value = (completedCount / totalLessonCount !== Infinity ? completedCount / totalLessonCount : 0);
    $item('#courseProgressText').html = `<h5 style="font-size:24px; line-height:normal;"><span style="font-size:24px;"><span class="color_23"><span style="letter-spacing:normal;">${percentComplete}% &nbsp;</span></span><span class="color_13"><span style="letter-spacing:normal;">Complete</span></span></span></h5>`;
    $item('#courseLastAccessedText').text = dayjs().to(dayjs(new Date(itemData._updatedDate['$date'])));
    $item('#courseStarted').text = new Date(itemData._createdDate['$date']).toLocaleDateString('en-us', { year: "numeric", month: "short", day: "numeric" });
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
                            $item('#courseAccuracy').html = `<h5 style="font-size:24px; line-height:normal;"><span style="color:${textColor};"><span style="font-size:24px;"><span style="letter-spacing:normal;">${accuracyPercentage.toFixed(2)}%</span></span></span></h5>`;
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
    //const completedLessons = itemData.data.filter((lessonSubmission) => lessonSubmission.completed === true);
    //const moduleItem = (await wixData.queryReferenced("Lessons", nextLesson._id, "Modules")).items[0];
    if (index + 1 === $w('#repeaterCourses').data.length) {
        $w('#stateboxCourses').changeState('Courses');
    }
}

export function courseDetailsBtn_click(event) {
    if (event.context.itemId === currentSubmissionItem?._id) {
        $w('#stateboxCourses').changeState('Modules');
    } else {
        currentSubmissionItem = $w('#repeaterCourses').data.filter((obj) => obj._id === event.context.itemId)[0];
        $w('#moduleRepeater').data = currentSubmissionItem.modules;
    }
}

export async function moduleRepeater_itemReady($item, itemData, index) {
    $item('#moduleName').text = itemData.title;
    $item('#moduleColorRibbon').style.backgroundColor = itemData.color;
    if (currentSubmissionItem) {
        const allLessons = (await wixData.query("Lessons").eq("module", itemData._id).ascending("order").find()).items;
        itemData.allLessons = allLessons;
        const completedLessons = currentSubmissionItem.data.filter((lessonSubmissionItem) => lessonSubmissionItem.completed === true && allLessons.some((lessonobj) => lessonobj._id === lessonSubmissionItem._id));
        const completedCount = completedLessons.length;
        const totalLessonCount = allLessons.length;
        const percentComplete = Math.round((completedCount / totalLessonCount !== Infinity ? completedCount / totalLessonCount : 0) * 100);
        if (completedCount === totalLessonCount) {
            $item('#moduleColorRibbon').style.backgroundColor = '#13C402';
        }
        $item('#moduleProgressBar').value = (completedCount / totalLessonCount !== Infinity ? completedCount / totalLessonCount : 0);
        currentSubmissionItem.data.sort((a, b) => new Date(b.startedDate) - new Date(a.startedDate));
        $item('#moduleStarted').text = new Date(currentSubmissionItem.data[0].startedDate['$date']).toLocaleDateString('en-us', { year: "numeric", month: "short", day: "numeric" });
        if (completedLessons.length > 0) {
            $item('#moduleProgressText').html = `<h5 style="font-size:24px; line-height:normal;"><span style="font-size:24px;"><span class="color_23"><span style="letter-spacing:normal;">${percentComplete}% &nbsp;</span></span><span class="color_13"><span style="letter-spacing:normal;">Complete</span></span></span></h5>`;
            completedLessons.sort((a, b) => new Date(b.completedDate) - new Date(a.completedDate));
            if (completedCount === totalLessonCount) {
                $item('#moduleCompleted').text = dayjs().to(dayjs(new Date(completedLessons[0].completedDate['$date'])));
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
                                const accuracyPercentage = Math.round((totalAccuracyNumber / completedActivitiesWithAccuracy.length) * 100);
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
                                    $item('#moduleAccuracy').html = `<h5 style="font-size:24px; line-height:normal;"><span style="color:${textColor};"><span style="font-size:24px;"><span style="letter-spacing:normal;">${accuracyPercentage}%</span></span></span></h5>`;
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
        //const completedLessons = itemData.data.filter((lessonSubmission) => lessonSubmission.completed === true);
        //const moduleItem = (await wixData.queryReferenced("Lessons", nextLesson._id, "Modules")).items[0];
    }
    if (index + 1 === $w('#moduleRepeater').data.length) {
        $w('#stateboxCourses').changeState('Modules');
    }
}

export function moduleDetailsBtn_click(event) {
    if (event.context.itemId === currentModule?._id) {
        $w('#stateboxCourses').changeState('Lessons');
    } else {
        currentModule = $w('#moduleRepeater').data.filter((obj) => obj._id === event.context.itemId)[0];
        $w('#lessonsRepeater').data = currentModule.allLessons;
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
            $item('#lessonStarted').text = new Date(currentSubmissionItem.data[lessonIndex].startedDate['$date']).toLocaleDateString('en-us', { year: "numeric", month: "short", day: "numeric" });
            if (completedActivities.length > 0) {
                if (completedCount === totalActivityCount) {
                    $item('#lessonCompleted').html = `<h5 style="font-size:21px; line-height:normal;"><span class="color_33"><span style="font-size:21px;"><span style="letter-spacing:normal;">${dayjs().to(dayjs(new Date(currentSubmissionItem.data[lessonIndex].completedDate['$date'])))}</span></span></span></h5>`
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
                                    const accuracyPercentage = Math.round((totalAccuracyNumber / completedActivitiesWithAccuracy.length) * 100);
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
                                        $item('#lessonAccuracy').html = `<h5 style="font-size:24px; line-height:normal;"><span style="color:${textColor};"><span style="font-size:24px;"><span style="letter-spacing:normal;">${accuracyPercentage}%</span></span></span></h5>`;
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
        $w('#stateboxCourses').changeState('Lessons');
    }
}

export function backModules_click(event) {
    $w('#stateboxCourses').changeState('Courses');
}

export function backLessons_click(event) {
    $w('#stateboxCourses').changeState('Modules');
}

export function recentActivityRepeater_itemReady($item, itemData, index) {
    $item('#eventTitle').text = itemData.title;
    $item('#eventLessonTitle').text = itemData.lessonTitle;
    if (itemData.eventType === 'started') {
        if (formFactor === 'Mobile') {
            $item('#eventStarted').text = 'Started: ' + new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(itemData.date['$date']));
        } else {
            $item('#eventStarted').text = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(itemData.date['$date']));
        }
        $item('#eventCompleted').collapse();
    } else {
        $item('#iconBox').style.backgroundColor = '#13C402';
        if (formFactor === 'Mobile') {
            $item('#eventStarted').text = 'Started: ' + new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(itemData.startedDate['$date']));
            $item('#eventCompleted').text = 'Completed: ' + new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(itemData.date['$date']));
        } else {
            $item('#eventStarted').text = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(itemData.startedDate['$date']));
            $item('#eventCompleted').text = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(itemData.date['$date']));
        }
        if (itemData.accuracy) {
            const accuracyPercentage = Math.round(itemData.accuracy * 100)
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
            if (formFactor === 'Mobile') {
                $item('#recentActivityAccuracy').html = `<h4 style="font-size:16px; line-height:normal;"><span style="color:${textColor};"><span style="font-size:16px;"><span style="letter-spacing:normal;">${Math.round(accuracyPercentage)}% Accuracy</span></span></span></h4>`;
            } else {
                $item('#recentActivityAccuracy').html = `<h4 style="font-size:16px; line-height:normal;"><span style="color:${textColor};"><span style="font-size:16px;"><span style="letter-spacing:normal;">${Math.round(accuracyPercentage)}%</span></span></span></h4>`;
            }
        } else {
            $item('#recentActivityAccuracy').collapse();
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