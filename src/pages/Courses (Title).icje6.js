import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { authentication } from 'wix-members';
import { openLightbox } from 'wix-window';
import { getRoles } from 'public/memberFunctions.js'

let moduleparam = wixLocation.query.module;
let submission;
let totalLessonCount = 0;
let currentModule;
let currentLesson;
let courseItem;
let lessons = [];
let modules = [];

$w.onReady(async function () {
    $w("#tabsBox").onChange((event) => {
        wixLocation.queryParams.add({ section: event.target.currentTab.label });
    });
    if (wixLocation.query.section) {
        /*
        const tabToSelect = $w('#tabsBox').tabs.find((obj) => obj.label = wixLocation.query.section);
        console.log($w('#tabsBox').tabs);
        console.log(tabToSelect.id);
        */
        switch (wixLocation.query.section) {
        case 'Modules':
            $w('#tabsBox').changeTab("singleTab3");
            break;
        case 'My Progress':
            $w('#tabsBox').changeTab("singleTab8");
            break;
        }
        $w('#tabsBox').scrollTo();
        //$w('#tabsBox').changeTab(tabToSelect.id);
    }
    await $w('#dynamicDataset').onReadyAsync();
    courseItem = $w('#dynamicDataset').getCurrentItem();
    if (authentication.loggedIn()) {
        $w('#progressStatebox').changeState('Progress');
        submission = (await wixData.query("LearnerSubmissionData").eq("course", courseItem._id).find()).items[0];
    }
    const modulesQuery = await wixData.query("Modules").eq("course", courseItem._id).ascending("order").find();
    const moduleIdList = modulesQuery.items.map((obj) => obj._id);
    const allLessonsQuery = await wixData.query("Lessons").hasSome("module", moduleIdList).ascending("order").find();
    modulesQuery.items.forEach((module) => {
        module.allLessons = allLessonsQuery.items.filter((obj) => obj.module === module._id);
        modules.push(module);
    });
    $w('#moduleRepeater').data = modules;
    const roles = await getRoles();
    if (roles.includes("Teacher")) {
        $w('#assignLessonBtn').show();
    }
    //loadProgress();
});

function navigateModule(moduleparam) {
    /*
    $w("#moduleRepeater").forItems([moduleparam], ($item, itemData, index) => {
        console.log('scrollto' + moduleparam)
        $item('#modulecontainer').scrollTo();
    });
    */
}

async function loadProgress() {
    if (submission) {
        const completedCount = submission.data.filter((obj) => obj.completed === true).length;
        const percentComplete = Math.round(completedCount / totalLessonCount * 100);
        $w('#progressBar').value = completedCount / totalLessonCount;
        $w('#completionProgressTxt').text = `${percentComplete}% Complete`;
        $w('#lessonCompletetxt').text = `${completedCount} / ${totalLessonCount} Lessons Complete`;
        if (completedCount >= totalLessonCount) {
            $w('#nextLessonIndic, #nextLessonBox').collapse();
        } else {
            $w('#nextLessonIndic, #nextLessonBox').expand();
            modules.sort((a, b) => a.order - b.order);
            let allLessons = [];
            modules.forEach((module) => {
                allLessons = allLessons.concat(module.allLessons);
            });
            console.log(allLessons);
            const completedLessons = submission.data.filter((lessonSubmission) => lessonSubmission.completed === true);
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
                nextLesson = allLessons[0];
            }
            $w('#nextLessonTitle').text = nextLesson.title;
            const moduleItem = $w('#moduleRepeater').data.find((obj) => obj._id === nextLesson.module);
            $w('#nextLessonModuleTitle').text = moduleItem.title;
            $w('#nextLessonButton').link = `/lesson/${nextLesson._id}`;
        }
    } else {
        $w('#nextLessonIndic, #nextLessonBox').expand();
        $w('#progressBar').value = 0;
        $w('#completionProgressTxt').text = "0% Complete";
        $w('#lessonCompletetxt').text = `0/${totalLessonCount} Lessons Complete`;
    }
}

export async function moduleRepeater_itemReady($item, itemData, index) {
    $item('#moduleName').text = itemData.title;
    $item('#moduleAboutTxt').text = itemData.about;
    $item('#moduleObjectiveTxt').html = itemData.skills;
    $item('#moduleOrderTxt').text = itemData.order.toString();
    $item('#moduleTitleTxt').text = itemData.title;
    $item('#moduleColorRibbon').style.backgroundColor = itemData.color;
    const allLessons = itemData.allLessons; //(await wixData.query("Lessons").eq("module", itemData._id).ascending("order").find()).items;
    //itemData.allLessons = allLessons;
    if (wixLocation.query?.moduleId === itemData._id) {
        currentModule = itemData;
        $w('#lessonsRepeater').data = allLessons;
        $w('#statebox').scrollTo();
        $w('#statebox').changeState('Lessons');
    }
    lessons = lessons.concat(allLessons);
    modules.push(itemData);
    const moduleLessonCount = allLessons.length;
    if (submission) {
        const completedLessons = submission.data.filter((lessonSubmissionItem) => lessonSubmissionItem.completed === true && allLessons.some((lessonobj) => lessonobj._id === lessonSubmissionItem._id));
        const completedCount = completedLessons.length;
        const percentComplete = Math.round(completedCount / moduleLessonCount * 100) || 0;
        if (completedCount === moduleLessonCount) {
            $item('#moduleColorRibbon').style.backgroundColor = '#13C402';
        }
        $item('#moduleProgressBar').value = completedCount / moduleLessonCount || 0;
        submission.data.sort((a, b) => new Date(b.startedDate) - new Date(a.startedDate));
        if (completedLessons.length > 0) {
            $item('#moduleProgressText').text = `${percentComplete}% Complete`;
            $item('#moduleProgressText').show();
            $item('#moduleDetailsBtn').label = `${completedCount} / ${moduleLessonCount} Lessons Complete`;
        } else {
            $item('#moduleDetailsBtn').label = `${moduleLessonCount} Lessons`;
        }
    } else {
        $item('#moduleDetailsBtn').label = `${moduleLessonCount} Lessons`;
    }
    updateTotalLessonCount(totalLessonCount + allLessons.length);

    function updateTotalLessonCount(value) {
        totalLessonCount = value;
        if (totalLessonCount > 0) {
            loadProgress();
        }
    }
    $w('#statebox').changeState('Modules');
    /*
    if (index + 1 === $w('#moduleRepeater').data.length) {
        $w('#statebox').changeState('Modules');
        if (totalLessonCount > 0) {
            loadProgress();
        } else {
            waitProgressLoad().then(() => {
                loadProgress();
            })
        }
    }
    function waitProgressLoad() {
        return new Promise(function (resolve, reject) {
            (function checkTotalLessonCount() {
                if (totalLessonCount > 0) return resolve();
                setTimeout(checkTotalLessonCount, 30);
            })();
        });
    }
    */
    /*
    $item('#lessonsTable').rows = queryResults.items.map(obj => {
        totalLessonCount++;
        let completedText = '→';
        if (submission) {
            const lessonIndex = submission.data.findIndex(x => x._id === obj._id);
            if (lessonIndex !== -1 && submission.data[lessonIndex].completed === true) {
                console.log('lessonInd' + lessonIndex);
                obj.title = `<h5 style="color: #13C402; font-size:21px;"><span style="font-size:20px;">${obj.title}</span></h5>`;
                completedText = `<h5 style="color: #13C402; font-size:21px;"><span style="font-size:20px;">✓</span></h5>`;
            }
        }
        return { "lessontitle": obj.title, "completestatus": completedText, "lessonLink": `/lesson/${obj._id}?course=${$w('#dynamicDataset').getCurrentItem()._id}` }
    });
    */
}

/*
export function lessonsTable_rowSelect(event) {
    if (authentication.loggedIn()) {
        wixLocation.to(event.rowData.lessonLink);
    } else {
        authentication.promptLogin();
    }
}
*/

export async function moduleDetailsBtn_click(event) {
    if (event.context.itemId === currentModule?._id) {
        $w('#statebox').changeState('Lessons');
    } else {
        currentModule = $w('#moduleRepeater').data.filter((obj) => obj._id === event.context.itemId)[0];
        $w('#lessonsRepeater').data = currentModule.allLessons;
    }
    $w('#statebox').scrollTo();
}

export function getStartedNowButton_click(event) {
    //const tabToSelect = $w('#tabsBox').tabs.find((obj) => obj.label = wixLocation.query.section);
    $w('#tabsBox').changeTab("singleTab3");
    $w('#tabsBox').scrollTo();
}

export function lessonsRepeater_itemReady($item, itemData, index) {
    $item('#lessonName').text = itemData.title;
    $item('#aboutLessonTxt').text = itemData.description;
    $item('#objectivesLessonTxt').html = itemData.objectives;
    if (submission) {
        const lastIndex = submission.data.findLastIndex((obj) => obj.completed === true);
        if (lastIndex + 1 === index) {
            $item('#lessonColorRibbon').style.backgroundColor = '#00B5EA';
        } else {
            if (submission.data.find((obj) => obj._id === itemData._id)?.completed) {
                $item('#lessonColorRibbon').style.backgroundColor = '#13C402';
            }
        }
    } else {
        if (index === 0) {
            $item('#lessonColorRibbon').style.backgroundColor = '#00B5EA';
        }
    }
    //$item('#getStartedLesson').link = `/lesson/${itemData._id}?course=${courseItem._id}`
    if (index + 1 === $w('#lessonsRepeater').data.length) {
        $w('#statebox').changeState('Lessons');
    }
}

export async function lessonStandardsBtn_click(event) {
    $w('#statebox').scrollTo();
    if (event.context.itemId === currentLesson?._id) {
        $w('#statebox').changeState('Standards');
    } else {
        currentLesson = $w('#lessonsRepeater').data.filter((obj) => obj._id === event.context.itemId)[0];
        const lessonsQuery = await wixData.queryReferenced("Lessons", event.context.itemId, "standards");
        if (lessonsQuery.items.length > 0) {
            $w('#standardsStatebox').changeState('standards');
        } else {
            $w('#standardsStatebox').changeState('noStandards');
        }
        $w('#standardsRepeater').data = lessonsQuery.items;
    }
}

export function backLessons_click(event) {
    $w('#statebox').changeState('Modules');
}

export function backStandards_click(event) {
    $w('#statebox').changeState('Lessons');
}

export function standardsRepeater_itemReady($item, itemData, index) {
    $item('#numberTxt').text = (index + 1).toString();
    $item('#standardsTitle').text = itemData.title;
    $item('#standardsCategory').text = itemData.category;
    $item('#standardsDescription').text = itemData.description;
    $item('#standardsApplications').html = itemData.applications;
    if (index + 1 === $w('#standardsRepeater').data.length) {
        $w('#statebox').changeState('Standards');
    }
}

export function assignLessonBtn_click(event) {
    const lessonObj = $w('#lessonsRepeater').data.filter((obj) => obj._id === event.context.itemId)[0];
    openLightbox("Assign Lesson", { "mode": "Lesson", "lessonId": event.context.itemId, "title": lessonObj.title });
}

export function getStartedLesson_click(event) {
    wixLocation.to(`/lesson/${event.context.itemId}`);
}