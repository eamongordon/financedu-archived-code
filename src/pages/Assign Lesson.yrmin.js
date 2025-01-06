import wixData from 'wix-data';
import { getMemberData, getRoles } from 'public/memberFunctions.js'
import wixWindow from 'wix-window';
import { generateError } from 'public/statusbox.js';
import {insertAssignmentActivity} from 'backend/assignments.jsw';
import wixLocation from 'wix-location';

let mode;
let lessonId;
let title;
let activityId;
let assignmentId;

$w.onReady(async () => {
    const recieved = wixWindow.lightbox.getContext();
    lessonId = recieved.lessonId;
    mode = recieved.mode || 'Lesson';
    title = recieved.title;
    if (mode === 'Activity') {
        activityId = recieved.activityId;
        $w('#title').text = 'Assign Activity';
    }
    const memberId = await getMemberData('_id');
    const classQuery = await wixData.queryReferenced("People", memberId, "Classes");
    $w('#classDropdown').options = classQuery.items.map((obj) => {
        return {
            "label": obj.title,
            "value": obj._id
        }
    });
    $w('#classDropdown').value = $w('#classDropdown').options[0].value;
    $w('#statebox').changeState('Create');
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
    let activitiesList;
    if (mode === 'Activity') {
        activitiesList = [activityId];
    } else {
        const activitiesQuery = await wixData.queryReferenced("Lessons", lessonId, "Activities");
        activitiesList = activitiesQuery.items.map((obj) => obj._id);
    }
    return wixData.insert("Assignments", {
        "title": title,
        "class": $w('#classDropdown').value,
        "assignData": assignData,
        "activityOrder": activitiesList,
        "selectedStudents": []
    }).then((assignment) => {
        assignmentId = assignment._id;
        insertAssignmentActivity(assignment, activitiesList).then(() => {
            $w('#statebox').changeState('Done');
        });
            /*
        return wixData.insertReference("Assignments", "Activities", assignment._id, activitiesList).then(() => {
            $w('#statebox').changeState('Done');
        });
        */
    }).catch((err) => {
        console.log(err);
        $w('#statebox').changeState('Error');
    });
}

export function assignmentDetails_click(event) {
    wixLocation.to(`/assignment/${assignmentId}/instructor`);
}

export function browseLessons_click(event) {
    wixWindow.lightbox.close();
}