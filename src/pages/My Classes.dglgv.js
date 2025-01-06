import { hexToRGB, moveArray } from 'public/util.js';
import { generateSuccess, generateError } from 'public/statusbox.js'
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';

let personData;

$w.onReady(async function () {
    personData = await $w('#peopleDataset').getCurrentItem();
    $w('#classesDataset').onReady(async function () {
        const classCount = $w('#classesDataset').getTotalCount();
        if (classCount === 1){
            $w('#classesCountText').text = `1 Class`;
        } else {
            $w('#classesCountText').text = `${$w('#classesDataset').getTotalCount()} Classes`;
        }
        $w('#peopleDataset').onReady(async function () {
            personData = await $w('#peopleDataset').getCurrentItem();
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
    });
});

export function classRepeater_itemReady($item, itemData, index) {
    $item('#backgroundBox').style.backgroundColor = itemData.color;
    $item('#classTitle').text = itemData.title;
    if (index + 1 === $w('#classesDataset').getTotalCount()) {
        $item('#moveDown').disable();
    } else {
        if (index === 0) {
            $item('#moveUp').disable();
        }
    }
    $item('#colorBox, #threeDotsMenu').style.backgroundColor = hexToRGB(itemData.color, 0.70);
    //$item('#announcementButton').link = itemData[''];
    $item('#assignmentButton').link = itemData['link-classes-1-title-2'];
    $item('#classButton').link = itemData['link-classes-1-title-2'];
    $item('#peopleButton').link = itemData['link-copy-of-classes-settings-_id'];
    $item('#gradebookButton').link = itemData['link-classes-1-title']; 
    $item('#settingsButton').link = itemData['link-classes-1-title-3'];
    $item('#coverImage').src = itemData.coverImage;
    $item('#classTitle').onClick(() => {wixLocation.to(itemData['link-classes-1-title-2'])});
    if ($w('#loadingGif').isVisible) {
        $w('#loadingGif').hide();
        $w('#classRepeater, #classesCountText, #addClassButton').show();
    }
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
    $w('#peopleDataset').setFieldValue("classesOrderData", personData.classesOrderData);
    $w('#peopleDataset').save();
}

async function updateSort() {
    let classesData = (await ($w('#classesDataset').getItems(0, 12))).items;
    const classesDataSorted = (array, sortArray) => {
        return [...array].sort(
            (a, b) => sortArray.indexOf(a._id) - sortArray.indexOf(b._id)
        )
    }
    classesData = classesDataSorted(classesData, personData.classesOrderData);
    $w('#classRepeater').data = classesData;
    $w("#classRepeater").forEachItem(($item, itemData, index) => {
        if (index + 1 === $w('#classesDataset').getTotalCount()) {
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
    $w('#peopleDataset').setFieldValue("classesOrderData", personData.classesOrderData);
    $w('#peopleDataset').save();
}

export function moveBottom_click(event) {
    const currentItemIndex = $w('#classRepeater').data.findIndex(obj => { return obj._id === event.context.itemId });
    const classItemArray = $w('#classRepeater').data.map((obj) => { return obj._id });
    personData.classesOrderData = moveArray(classItemArray, currentItemIndex, $w('#classesDataset').getTotalCount() - 1);
    updateSort();
    $w('#peopleDataset').setFieldValue("classesOrderData", personData.classesOrderData);
    $w('#peopleDataset').save();
}

export function moveTop_click(event) {
    const currentItemIndex = $w('#classRepeater').data.findIndex(obj => { return obj._id === event.context.itemId });
    const classItemArray = $w('#classRepeater').data.map((obj) => { return obj._id });
    personData.classesOrderData = moveArray(classItemArray, currentItemIndex, 0);
    updateSort();
    $w('#peopleDataset').setFieldValue("classesOrderData", personData.classesOrderData);
    $w('#peopleDataset').save();
}

export function addClassButton_click(event) {
  wixWindow.openLightbox("Add Class")
  .then( (data) => {
    if (data.status === true){
        generateSuccess(data.message);
    } else {
        generateError(data.message);
    }
  } );
}