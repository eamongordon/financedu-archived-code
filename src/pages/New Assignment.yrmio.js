import wixData from 'wix-data';
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { fetchAllUserAssignments } from 'backend/assignments.jsw';

let classId;
let assignmentNew;
let assignmentArray = [];

$w.onReady(async () => {
    const recieved = wixWindow.lightbox.getContext();
    classId = recieved.classId;
});

export async function assignLessonBtn_click(event) {
    $w('#statebox').changeState('Loading');
    const assignData = [{
        attempts: {
            limitAttempts: false
        },
        students: [],
        availability: {
            limitAvailability: false
        },
        dueDates: {
            enabled: false
        },
        timer: {
            enabled: false
        },
        grading: {
            manualGrading: false
        }
    }];
    return wixData.insert("Assignments", {
        "title": $w('#assignmentTitleInput').value,
        "class": classId,
        "assignData": assignData,
        "activityOrder": [],
        "selectedStudents": []
    }).then((assignment) => {
        assignmentNew = assignment;
        $w('#statebox').changeState('Done');
    }).catch(() => {
        $w('#statebox').changeState('Error');
    });
}

export function assignmentDetails_click(event) {
    wixLocation.to(`/assignment/${assignmentNew._id}/instructor`);
}

export function browseLessons_click(event) {
    wixWindow.lightbox.close({"newAssignment": assignmentNew});
}

export function assignmentTitleInput_keyPress(event) {
    if (event.key === 'Enter') {
        assignLessonBtn_click();
    }
}

export function createNewBtn_click(event) {
    $w('#statebox').changeState('New');
}

async function loadPastAssignmentLibrary() {
    try {
        $w('#statebox').changeState('Loading');
        let assignments = await fetchAllUserAssignments();
        while (assignments.length) {
            assignmentArray.push(assignments.splice(0, 2));
        }
        $w('#assignmentPagination').currentPage = 1;
        $w('#assignmentPagination').totalPages = (assignmentArray.length === 0) ? 1 : assignmentArray.length;
        $w('#assignmentsRepeater').data = assignmentArray[0] || [];
        $w('#statebox').changeState('Library');
    } catch (error) {
        $w('#statebox').changeState('Error');
    }
}

export function assignmentContainer_click(event) {
    $w('#statebox').changeState('Loading');
    const assignmentRepeaterItem = $w('#assignmentsRepeater').data.find((obj) => obj._id === event.context.itemId);
    let newAssignment = {
        assignData: [assignmentRepeaterItem.assignData[0]],
        title: "Copy of " + assignmentRepeaterItem.title,
        class: classId,
        activityOrder: assignmentRepeaterItem.activityOrder,
        selectedStudents: []
    };
    return wixData.insert("Assignments", newAssignment).then((assignment) => {
        assignmentNew = assignment;
        $w('#statebox').changeState('Done');
        //$w('#statebox').changeState('Done');
    }).catch(() => {
        $w('#statebox').changeState('Error');
    });

}

export function assignmentsRepeater_itemReady($item, itemData, index) {
    $item('#assignmentTitle').text = itemData.title;
    $item('#assignmentSubtext').text = 'Created ' + new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(itemData._createdDate));
}

export function duplicateOldBtn_click(event) {
    loadPastAssignmentLibrary();
}

$w('#assignmentPagination').onChange(async (event) => {
    /*
    if ($w('#courseSearch').value.length > 0 || $w('#courseSeriesDropdown').value) {
        $w('#courseRepeater').data = segmentedFilteredCoursesData[event.target.currentPage - 1];
    } else {
        $w('#courseRepeater').data = coursesDataArr[event.target.currentPage - 1];
    }
    */
    $w('#assignmentsRepeater').data = assignmentArray[event.target.currentPage - 1];
});

export function backNew_click(event) {
    $w('#statebox').changeState('Create');
}

export function backLibrary_click(event) {
    $w('#statebox').changeState('Create');
}