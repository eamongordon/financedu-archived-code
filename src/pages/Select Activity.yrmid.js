import wixData from 'wix-data';
import wixUsers from 'wix-users';
import wixWindow from 'wix-window';

let selectedActivityArray = [];
let debounceTimer;
let coursesDataArr = [];
let lessonsDataArr = [];
let prevLessonsQueryId;
let modulesDataArr = [];
let prevModulesQueryId;
let activityDataArr = [];
let prevActivityQueryId;
let oldActivityArray;

$w.onReady(async function () {
    queryCourses();
    const received = wixWindow.lightbox.getContext();
    oldActivityArray = received.oldActivities;
});

async function queryCourses() {
    $w('#statebox').changeState('Loading');
    let dropdownOptions = $w('#courseSeriesDropdown').options;
    if (dropdownOptions.length < 2) { dropdownOptions.unshift({ 'label': 'All', 'value': null }) };
    $w('#courseSeriesDropdown').options = dropdownOptions;
    if (!coursesDataArr.length) {
        coursesDataArr = [];
        const res = (await wixData.query("Courses").find());
        while (res.items.length) {
            coursesDataArr.push(res.items.splice(0, 2));
        }
    }
    $w('#coursePagination').onChange((event) => {
        if ($w('#courseSearch').value.length > 0 || $w('#courseSeriesDropdown').value) {
            $w('#courseRepeater').data = segmentedFilteredCoursesData[event.target.currentPage - 1];
        } else {
            $w('#courseRepeater').data = coursesDataArr[event.target.currentPage - 1];
        }
        //$w('#courseRepeater').data = coursesDataArr[event.target.currentPage - 1];
    });
    let segmentedFilteredCoursesData = [];
    $w('#courseSearch').onInput((event) => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = undefined;
        }
        debounceTimer = setTimeout(() => {
            filterCourseData();
        }, 500);
    });
    $w('#courseSeriesDropdown').onChange((event) => {
        filterCourseData();
    });
    function filterCourseData() {
        const filteredCourseData = coursesDataArr.flat().filter((obj) => obj.title.toLowerCase().includes($w('#courseSearch').value.toLowerCase()) && obj.series.includes($w('#courseSeriesDropdown').value));
        segmentedFilteredCoursesData = [];
        while (filteredCourseData.length) {
            segmentedFilteredCoursesData.push(filteredCourseData.splice(0, 2));
        }
        $w('#coursePagination').currentPage = 1;
        $w('#coursePagination').totalPages = (segmentedFilteredCoursesData.length === 0) ? 1 : segmentedFilteredCoursesData.length;
        $w('#courseRepeater').data = segmentedFilteredCoursesData[0] || [];
    }
    $w('#coursePagination').currentPage = 1;
    $w('#coursePagination').totalPages = (coursesDataArr.length === 0) ? 1 : coursesDataArr.length;
    $w('#courseRepeater').data = coursesDataArr[0] || [];
    $w('#statebox').changeState('Courses');
}

export function courseRepeater_itemReady($item, itemData, index) {
    $item('#courseName').text = itemData.title;
    $item('#courseSeries').text = itemData.series;
    $item('#courseImage').src = itemData.image;
    $item('#courseContainer').onClick(() => {
        queryModules(itemData._id);
    });
    $item('#courseContainer').onMouseIn(() => {
        $item('#courseContainer').background.src = 'https://static.wixstatic.com/media/2dcc6c_3ef08e60987b4f0aa963f1c0471e39f8~mv2.png';
    });
    $item('#courseContainer').onMouseOut(() => {
        $item('#courseContainer').background.src = null;
    });
}

async function queryModules(courseId) {
    $w('#statebox').changeState('Loading');
    if (courseId && courseId !== prevModulesQueryId) {
        modulesDataArr = [];
        const res = await wixData.query("Modules").eq("course", courseId).find();
        while (res.items.length) {
            modulesDataArr.push(res.items.splice(0, 3));
        }
        prevModulesQueryId = courseId;
    }
    $w('#modulePagination').onChange((event) => {
        if ($w('#modulesSearch').value.length > 0) {
            $w('#moduleRepeater').data = segmentedFilteredModuleData[event.target.currentPage - 1];
        } else {
            $w('#moduleRepeater').data = modulesDataArr[event.target.currentPage - 1];
        }
    });
    let segmentedFilteredModuleData = [];
    $w('#modulesSearch').onInput((event) => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = undefined;
        }
        debounceTimer = setTimeout(() => {
            const filteredLessonData = modulesDataArr.flat().filter((obj) => obj.title.toLowerCase().includes(event.target.value.toLowerCase()));
            segmentedFilteredModuleData = [];
            while (filteredLessonData.length) {
                segmentedFilteredModuleData.push(filteredLessonData.splice(0, 3));
            }
            $w('#modulePagination').currentPage = 1;
            $w('#modulePagination').totalPages = segmentedFilteredModuleData.length;
            $w('#moduleRepeater').data = segmentedFilteredModuleData[0];
        }, 500);
    });
    /*
    $w('#modulesBack').onClick(() => {
        queryCourses();
    });
    */
    console.log('moduleQuerySecond');
    $w('#moduleRepeater').data = modulesDataArr[0] || [];
    $w('#modulePagination').currentPage = 1;
    $w('#modulePagination').totalPages = (modulesDataArr.length === 0) ? 1 : modulesDataArr.length;
    $w('#statebox').changeState('Modules');
}

async function queryLessons(moduleId) {
    $w('#statebox').changeState('Loading');
    if (moduleId && moduleId !== prevLessonsQueryId) {
        lessonsDataArr = [];
        const res = await wixData.query("Lessons").eq("module", moduleId).find();
        while (res.items.length) {
            lessonsDataArr.push(res.items.splice(0, 3));
        }
        prevLessonsQueryId = moduleId;
    }
    $w('#lessonPagination').onChange((event) => {
        if ($w('#lessonsSearch').value.length > 0) {
            $w('#lessonRepeater').data = segmentedFilteredLessonData[event.target.currentPage - 1];
        } else {
            $w('#lessonRepeater').data = lessonsDataArr[event.target.currentPage - 1];
        }
    });
    let segmentedFilteredLessonData = [];
    $w('#lessonsSearch').onInput((event) => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = undefined;
        }
        debounceTimer = setTimeout(() => {
            const filteredLessonData = lessonsDataArr.flat().filter((obj) => obj.title.toLowerCase().includes(event.target.value.toLowerCase()));
            segmentedFilteredLessonData = [];
            while (filteredLessonData.length) {
                segmentedFilteredLessonData.push(filteredLessonData.splice(0, 3));
            }
            $w('#lessonPagination').currentPage = 1;
            $w('#lessonPagination').totalPages = (segmentedFilteredLessonData.length === 0) ? 1 : segmentedFilteredLessonData.length;
            $w('#lessonRepeater').data = segmentedFilteredLessonData[0] || [];
        }, 500);
    });
    /*
    $w('#lessonsBack').onClick(() => {
        //console.log('back to Modules');
        queryModules();
    });
    */
    $w('#lessonPagination').currentPage = 1;
    $w('#lessonRepeater').data = lessonsDataArr[0] || [];
    $w('#lessonPagination').totalPages = (lessonsDataArr.length === 0) ? 1 : lessonsDataArr.length;
    $w('#statebox').changeState('Lessons');

}

async function queryActivities(lessonId) {
    $w('#statebox').changeState('Loading');
    let dropdownOptions = $w('#activityTypeDropdown').options;
    if (dropdownOptions.length < 4) { dropdownOptions.unshift({ 'label': 'All', 'value': null }) };
    $w('#activityTypeDropdown').options = dropdownOptions;
    if (lessonId && lessonId !== prevActivityQueryId) {
        activityDataArr = [];
        const res = (await wixData.queryReferenced("Lessons", lessonId, "Activities"));
        while (res.items.length) {
            activityDataArr.push(res.items.splice(0, 2));
        }
        prevActivityQueryId = lessonId;
    }
    $w('#activityPagination').onChange((event) => {
        if ($w('#activitySearch').value.length > 0 || $w('#activityTypeDropdown').value) {
            $w('#activityRepeater').data = segmentedFilteredActivityData[event.target.currentPage - 1];
        } else {
            $w('#activityRepeater').data = activityDataArr[event.target.currentPage - 1];
        }
    });
    let segmentedFilteredActivityData = [];
    $w('#activitySearch').onInput((event) => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = undefined;
        }
        debounceTimer = setTimeout(() => {
            filterActivityData();
        }, 500);
    });
    $w('#activityTypeDropdown').onChange((event) => {
        filterActivityData();
    });

    function filterActivityData() {
        const filteredActivityData = activityDataArr.flat().filter((obj) => obj.title.toLowerCase().includes($w('#activitySearch').value.toLowerCase()) && obj.type.includes($w('#activityTypeDropdown').value));
        segmentedFilteredActivityData = [];
        while (filteredActivityData.length) {
            segmentedFilteredActivityData.push(filteredActivityData.splice(0, 2));
        }
        $w('#activityPagination').currentPage = 1;
        $w('#activityPagination').totalPages = (segmentedFilteredActivityData.length === 0) ? 1 : segmentedFilteredActivityData.length;
        $w('#activityRepeater').data = segmentedFilteredActivityData[0] || [];
    }
    $w('#activityPagination').currentPage = 1;
    $w('#activityPagination').totalPages = (activityDataArr.length === 0) ? 1 : activityDataArr.length;;
    $w('#activityRepeater').data = activityDataArr[0] || [];
    $w('#statebox').changeState('Activities');
    /*
    $w('#activitiesBack').onClick(() => {
        queryLessons();
    });
    */
}

/**
*	Sets the function that runs when a new repeated item is created.
	[Read more](https://www.wix.com/corvid/reference/$w.Repeater.html#onItemReady)
*	 @param {$w.$w} $item
*/
export function moduleRepeater_itemReady($item, itemData, index) {
    $item('#moduleTitle').text = itemData.title;
    $item('#moduleColorBox').style.backgroundColor = itemData.color;
    $item('#moduleContainer').onClick(() => {
        console.log('moduleContainerClicked');
        queryLessons(itemData._id);
    });
    $item('#moduleContainer').onMouseIn(() => {
        $item('#moduleContainer').background.src = 'https://static.wixstatic.com/media/2dcc6c_3ef08e60987b4f0aa963f1c0471e39f8~mv2.png';
    });
    $item('#moduleContainer').onMouseOut(() => {
        $item('#moduleContainer').background.src = null;
    });
}

/**
*	Sets the function that runs when a new repeated item is created.
	[Read more](https://www.wix.com/corvid/reference/$w.Repeater.html#onItemReady)
*	 @param {$w.$w} $item
*/
export function lessonRepeater_itemReady($item, itemData, index) {
    $item('#lessonTitle').text = itemData.title;
    $item('#lessonContainer').onClick(() => {
        queryActivities(itemData._id);
    });
    $item('#lessonContainer').onMouseIn(() => {
        $item('#lessonContainer').background.src = 'https://static.wixstatic.com/media/2dcc6c_3ef08e60987b4f0aa963f1c0471e39f8~mv2.png';
    });
    $item('#lessonContainer').onMouseOut(() => {
        $item('#lessonContainer').background.src = null;
    });
}

export async function activitySubmit_click(event) {
    /*
    const oldActivityArray = (await wixData.queryReferenced("Assignments", received.assignmentId, "Activities")).items;
    const uniqueactivities = [...new Set([...selectedActivityArray, ...oldActivityArray])];
    wixData.replaceReferences("Assignments", "Activities", received.assignmentId, uniqueactivities)
        .then((res) => {
            wixWindow.lightbox.close({ "status": true });
        })
        .catch((error) => {
            wixWindow.lightbox.close({ "status": false });
        });
        */
    const uniqueactivities = selectedActivityArray.filter((item) => !oldActivityArray.includes(item._id));
    wixWindow.lightbox.close({ "data": uniqueactivities });
}

export function activityRepeater_itemReady($item, itemData, index) {
    $item('#activityTitle').text = itemData.title;
    $item('#activityType').text = itemData.type;
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
    if (selectedActivityArray.includes(itemData._id)) {
        $item('#activityCheckbox').checked = true;
    }
    /*
    $item('#activityContainer').onClick(() => {
        setTimeout(() => {
            if ($item('#activityCheckbox').checked === true) {
                $item('#activityCheckbox').checked = false;
                $item('#activityContainer').background.src = null;
            } else {
                $item('#activityCheckbox').checked = true;
                $item('#activityContainer').background.src = 'https://static.wixstatic.com/media/2dcc6c_3ef08e60987b4f0aa963f1c0471e39f8~mv2.png';
            }
        }, 100);
    });
    */
    $item('#activityCheckbox').onChange((event) => {
        if (event.target.checked === true) {
            const activityItem = $w('#activityRepeater').data.find((obj) => obj._id === event.context.itemId);
            selectedActivityArray.push(activityItem);
            /*
            selectedActivityArray.push({
                'title': activityItem.title,
                'type': activityItem.type,
                '_id': event.context.itemId
            });
            */
            updateAddButton();
            //$item('#activityContainer').background.src = 'https://static.wixstatic.com/media/2dcc6c_3ef08e60987b4f0aa963f1c0471e39f8~mv2.png';
            //$item('#iconBox').style.backgroundColor = "#00B5EA";
            //$item('#activityContainer').style.borderWidth = '3px';
        } else {
            const activityIndex = selectedActivityArray.indexOf(element => element === event.context.itemId);
            selectedActivityArray.splice(activityIndex, 1);
            updateAddButton();
            //$item('#activityContainer').background.src = null;
            //$item('#iconBox').style.backgroundColor = "#FEC178";
            //$item('#activityContainer').style.borderWidth = '1px';
        }
    });
    $item('#activityContainer').onMouseIn(() => {
        $item('#activityContainer').background.src = 'https://static.wixstatic.com/media/2dcc6c_3ef08e60987b4f0aa963f1c0471e39f8~mv2.png';
    });
    $item('#activityContainer').onMouseOut(() => {
        $item('#activityContainer').background.src = null;
    });
}

function updateAddButton() {
    const length = selectedActivityArray.length;
    if (length > 0) {
        $w('#activitySubmit').enable();
    } else {
        $w('#activitySubmit').disable();
    }
    $w('#activitySubmit').label = (length === 1) ? `+ Add 1 Activity` : (length === 0) ? `+ Add Activities` : `+ Add ${length} Activities`;
}

export function lessonsBack_click(event) {
    queryModules();
}

export function modulesBack_click(event) {
    queryCourses();
}

export function activitiesBack_click(event) {
    queryLessons();
}