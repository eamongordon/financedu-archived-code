 import wixData from 'wix-data';
import { hexToRGB } from 'public/util.js'
import { generateInfo, generateError, generateSuccess } from 'public/statusbox.js';
import wixLocation from 'wix-location';
import { getRouterData, openLightbox } from 'wix-window';

let classitem;
let prevSelectedValue;
let selectedcolor;

const themecolors = [{ _id: 'FEC178' }, { _id: '13C402' }, { _id: '00B5EA' }, { _id: '00799C' }, { _id: 'ac59d9' }, { _id: '1ee8af' }, { _id: 'e8471e' }];

$w.onReady(async function () {
    classitem = getRouterData().classInfo
    $w("#htmlStripGradient").onMessage(event => {
        $w("#htmlStripGradient").postMessage([classitem.color, hexToRGB(classitem.color, 0.75)]);
    });
    $w("#stripHtml").onMessage(event => {
        $w("#stripHtml").postMessage(classitem.color);
        $w('#topStrip, #bottomStrip').show();
        //$w('#loadingGif').hide();
    });
    const rgbColor = hexToRGB(classitem.color, null, true);
    $w('#peopleButton').style.backgroundColor = `rgb(${Math.round(Number(rgbColor[0])*0.8)}, ${Math.round(Number(rgbColor[1])*0.8)}, ${Math.round(Number(rgbColor[2])*0.8)})`;
    loadpeople();
    //$w('#gradebookButton, #announcementButton, #assignmentsButton, #peopleButton').style.color = classitem.color;
    //$w('#boxName').style.backgroundColor = classitem.color;
});


export function importStudents_click(event) {
    openLightbox("Import Students", { className: classitem.title, classCode: classitem.code });
}

export function addStudentButton_click(event) {
    openLightbox("Add Student", { className: classitem.title, classCode: classitem.code });
}

async function loadpeople() {
    const students = getRouterData().students;
    const instructors = getRouterData().instructors;
    if (students.totalCount === 1) {
        $w('#studentsCountTxt').text = students.items.length + '  Student';
    } else {
        $w('#studentsCountTxt').text = students.items.length + '  Students';
    }
    if (instructors.totalCount === 1) {
        $w('#studentsCountTxt').text = instructors.items.length + '  Instructor';
    } else {
        $w('#studentsCountTxt').text = instructors.items.length + '  Instructors';
    }
    $w('#repeaterInstructors').data = instructors.items;
    $w('#repeaterStudents').data = students.items;
}

export function instructorsRepeaterClassInfo_itemReady($item, itemData) {
    $item('#instructorNameClassInfo').text = `${itemData.firstName} ${itemData.lastName}`;
    if (itemData.profilePhoto) {
        $item('#instructorProfileImageClassInfo').src = itemData.profilePhoto;
    }
}

export function repeaterStudents_itemReady($item, itemData) {
    $item('#studentName').text = `${itemData.firstName} ${itemData.lastName}`;
    $item('#studentEmail').text = itemData.email;
    if (itemData.profilePhoto) {
        $item('#studentProfilePhoto').src = itemData.profilePhoto;
    }
}

export function repeaterInstructors_itemReady($item, itemData) {
    $item('#instructorName').text = `${itemData.firstName} ${itemData.lastName}`;
    $item('#instructorEmail').text = itemData.email;
    if (itemData.profilePhoto) {
        $item('#instructorProfilePhoto').src = itemData.profilePhoto;
    }
}

export function addInstructorButton_click(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here: 
}