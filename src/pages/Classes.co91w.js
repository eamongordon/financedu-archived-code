import { hexToRGB, moveArray } from 'public/util.js';
import { generateSuccess, generateError } from 'public/statusbox.js'
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import { currentMember } from 'wix-members';
import wixData from 'wix-data';
import { getRoles } from 'public/memberFunctions.js';
import { leaveClassStudent } from 'backend/classes.jsw';

let personData;
let roles;
let classes;

$w.onReady(async function () {
    loadMemberCard();
    const memberId = (await currentMember.getMember())._id;
    roles = await getRoles();
    let allClasses = [];
    if (roles.includes("Teacher")) {
        $w('#addClassButton, #noClassBtn').label = "+ Add Class";
        $w('#noClassTxt').text = "You haven't created any classes yet."
        let classQueryItems = (await wixData.queryReferenced("People", memberId, 'Classes')).items;
        classQueryItems = classQueryItems.map((item) => {
            return { ...item, role: 'Teacher' }
        });
        allClasses = allClasses.concat(classQueryItems);
    }
    if (roles.includes("Student")) {
        //$w('#gradebookButton, #analyticsButton').hide();
        let classQueryItems = (await wixData.queryReferenced("People", memberId, 'Classes-1')).items;
        classQueryItems = classQueryItems.map((item) => {
            return { ...item, role: 'Student' }
        });
        allClasses = allClasses.concat(classQueryItems);
    }
    classes = allClasses;
    if (classes.length === 0) {
        $w('#statebox').changeState('NoClasses');
    }
    $w('#classRepeater').data = classes;
    personData = await wixData.get("People", memberId);
    updateSort();
    /*
    //console.log(personData);
    let classesData = (await ($w('#classesDataset').getItems(0, 12))).items;
    //personData.classesOrderData = classesData.filter((obj) => { return personData.classesOrderData.includes(obj._id) === true }).map((obj) => {return obj._id});
    //const testfilter = classesData.filter((obj) => { return personData.classesOrderData.includes(obj._id) === true }).map((obj) => {return obj._id});
    //personData.classesOrderData = testfilter;
    //console.log(testfilter);
    //console.log(personData.classesOrderData);
    const classesDataSorted = (array, sortArray) => {
        return [...array].sort(
            (a, b) => sortArray.indexOf(a._id) - sortArray.indexOf(b._id)
        )
    }
    //console.log(classesDataSorted(classesData, personData.classesOrderData));
    classesData = classesDataSorted(classesData, personData.classesOrderData);
    //$w('#peopleDataset').save();
    $w('#classRepeater').data = classesData;
    */
});

async function loadMemberCard() {
    const member = await currentMember.getMember();
    personData = await wixData.get("People", member._id);
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

export function classRepeater_itemReady($item, itemData, index) {
    $item('#backgroundBox').style.backgroundColor = itemData.color;
    $item('#classTitle').text = itemData.title;
    if (index + 1 === $w('#classRepeater').data.length) {
        $item('#moveDown').disable();
    } else {
        if (index === 0) {
            $item('#moveUp').disable();
        }
    }
    $item('#colorBox, #threeDotsMenu').style.backgroundColor = hexToRGB(itemData.color, 0.70);
    if (itemData.role === 'Student') {
        $item('#gradebookButton, #analyticsButton').hide();
        $item('#removeButton').label = "Leave";
    }
    //$item('#announcementButton').link = itemData[''];
    if (itemData.role === 'Student') {
        $item('#assignmentButton').link = `/class/${itemData._id}/student?section=Assignments`;
        $item('#peopleButton').link = `/class/${itemData._id}/student?section=People`;
        $item('#classButton').link = `/class/${itemData._id}/student`;
        $item('#classTitle').onClick(() => { wixLocation.to(`/class/${itemData._id}/student`) });
    } else {
        $item('#assignmentButton').link = `/class/${itemData._id}/instructor?section=Assignments`;
        $item('#peopleButton').link = `/class/${itemData._id}/instructor?section=People`;
        $item('#gradebookButton').link = `/class/${itemData._id}/instructor?section=Gradebook`;
        $item('#analyticsButton').link = `/class/${itemData._id}/instructor?section=Analytics`;
        $item('#settingsButton').link = `/class/${itemData._id}/instructor?section=Settings`;
        $item('#classTitle').onClick(() => { wixLocation.to(`/class/${itemData._id}/instructor`) });
    }
    $item('#coverImage').src = itemData.coverImage;
    $w('#classesCountText, #addClassButton').expand();
    $w('#statebox').changeState('Classes');
}

export function threeDotsMenu_click(event) {
    let $item = $w.at(event.context);
    if ($item('#contextMenu').isVisible) {
        $item('#contextMenu').hide('fade', { duration: 100 });
    } else {
        $item('#contextMenu').show('fade', { duration: 100 });
    }
}

export function contextMenu_mouseOut(event) {
    let $item = $w.at(event.context);
    $item('#contextMenu').hide('fade', { duration: 100 });
}

export function reorderBox_mouseOut(event) {
    let $item = $w.at(event.context);
    $item('#reorderBox').hide('fade', { duration: 100 });
}

export function reorderButton_click(event) {
    let $item = $w.at(event.context);
    $item('#reorderBox').show('fade', { duration: 100 });
}

export async function moveUp_click(event) {
    const currentItemIndex = $w('#classRepeater').data.findIndex(obj => { return obj._id === event.context.itemId });
    const classItemArray = $w('#classRepeater').data.map((obj) => { return obj._id });
    personData.classesOrderData = moveArray(classItemArray, currentItemIndex, currentItemIndex - 1);
    updateSort();
    wixData.update("People", personData);
}

async function updateSort() {
    let classesData = classes;
    const classesDataSorted = (array, sortArray) => {
        return [...array].sort(
            (a, b) => sortArray.indexOf(a._id) - sortArray.indexOf(b._id)
        )
    }
    classesData = classesDataSorted(classesData, personData.classesOrderData);
    $w('#classRepeater').data = classesData;
    if ($w('#classRepeater').data.length === 1) {
        $w('#classesCountText').text = `1 Class`;
    } else {
        $w('#classesCountText').text = `${$w('#classRepeater').data.length} Classes`;
    }
    $w("#classRepeater").forEachItem(($item, itemData, index) => {
        if (index + 1 === $w('#classRepeater').data.length) {
            $item('#moveDown, #moveBottom').disable();
            $item('#moveUp, #moveTop').enable();
        } else {
            $w('#moveDown, #moveBottom').enable();
            if (index === 0) {
                $item('#moveUp, #moveTop').disable();
            } else {
                $item('#moveUp, #moveTop').enable();
            }
        }
    });
}

export function moveDown_click(event) {
    const currentItemIndex = $w('#classRepeater').data.findIndex(obj => { return obj._id === event.context.itemId });
    const classItemArray = $w('#classRepeater').data.map((obj) => { return obj._id });
    personData.classesOrderData = moveArray(classItemArray, currentItemIndex, currentItemIndex + 1);
    updateSort();
    wixData.update("People", personData);
}

export function moveBottom_click(event) {
    const currentItemIndex = $w('#classRepeater').data.findIndex(obj => { return obj._id === event.context.itemId });
    const classItemArray = $w('#classRepeater').data.map((obj) => { return obj._id });
    personData.classesOrderData = moveArray(classItemArray, currentItemIndex, $w('#classesDataset').getTotalCount() - 1);
    updateSort();
    wixData.update("People", personData);
}

export function moveTop_click(event) {
    const currentItemIndex = $w('#classRepeater').data.findIndex(obj => { return obj._id === event.context.itemId });
    const classItemArray = $w('#classRepeater').data.map((obj) => { return obj._id });
    personData.classesOrderData = moveArray(classItemArray, currentItemIndex, 0);
    updateSort();
    wixData.update("People", personData);
}

export function addClassButton_click(event) {
    if (roles.includes("Teacher")) {
        wixWindow.openLightbox("Add Class")
            .then((data) => {
                if (data.status === true) {
                    generateSuccess(data.message);
                    let classRepeaterData = $w('#classRepeater').data;
                    classRepeaterData.push(data.addedClass);
                    $w('#classRepeater').data = classRepeaterData;
                } else {
                    generateError(data.message);
                }
            });
    } else {
        wixLocation.to('/join-class');
    }
}

export function removeButton_click(event) {
    const classObj = $w('#classRepeater').data.find((obj) => obj._id === event.context.itemId);
    if (roles.includes("Teacher")) {
        wixWindow.openLightbox("Delete Confirmation", { confirmText: `Are you sure you want to delete "${classObj.title}?"`, infoMessage: "All associated assignments and submissions will be deleted." }).then((data) => {
            if (data.confirmed) {
                return wixData.remove("Classes", event.context.itemId).then(() => {
                    const itemToDeleteIndex = $w('#classRepeater').data.findIndex((obj) => obj._id === event.context.itemId);
                    let repeaterData = $w('#classRepeater').data;
                    repeaterData.splice(itemToDeleteIndex, 1);
                    $w('#classRepeater').data = repeaterData;
                    generateSuccess("Class Successfully Deleted");
                });
            }
        });
    } else {
        wixWindow.openLightbox("Delete Confirmation", { confirmText: `Are you sure you want to leave "${classObj.title}?"`, infoMessage: "All associated assignment submissions will be deleted.", confirmButtonLabel: "Leave" }).then((data) => {
            if (data.confirmed) {
                leaveClassStudent(event.context.itemId).then(() => {
                    const itemToDeleteIndex = $w('#classRepeater').data.findIndex((obj) => obj._id === event.context.itemId);
                    let repeaterData = $w('#classRepeater').data;
                    repeaterData.splice(itemToDeleteIndex, 1);
                    $w('#classRepeater').data = repeaterData;
                    generateSuccess("Class left successfully.");
                });
            }
        });
    }
}

export function noClassBtn_click(event) {
    addClassButton_click();
}