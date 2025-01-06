import { copyToClipboard } from 'wix-window';
import { generateError, generateSuccess } from 'public/statusbox.js';
import wixWindow from 'wix-window';

let classitem;
let selectedcolor;

const themecolors = [{ _id: 'FEC178' }, { _id: '13C402' }, { _id: '00B5EA' }, { _id: '00799C' }, { _id: 'ac59d9' }, { _id: '1ee8af' }, { _id: 'e8471e' }];

$w.onReady(async function () {
    $w("#htmlStripGradient").onMessage(event => {
        $w("#htmlStripGradient").postMessage([classitem.color, hexToRGB(classitem.color, 0.75)]);
    });
    $w("#stripHtml").onMessage(event => {
        $w("#stripHtml").postMessage(classitem.color);
        $w('#topStrip, #bottomStrip').show();
        $w('#statebox').changeState('Settings');
        //$w('#loadingGif').hide();
    });
    classitem = $w('#dynamicDataset').getCurrentItem();
    const rgbColor = hexToRGB(classitem.color, null, true);
    $w('#settingsClassroomButton').style.backgroundColor = `rgb(${Math.round(Number(rgbColor[0])*0.8)}, ${Math.round(Number(rgbColor[1])*0.8)}, ${Math.round(Number(rgbColor[2])*0.8)})`;
    //$w('#gradebookButton, #announcementButton, #assignmentsButton, #peopleButton').style.color = classitem.color;
    //$w('#boxName').style.backgroundColor = classitem.color;
    $w('#currentColor').style.backgroundColor = classitem.color;
    selectedcolor = $w('#currentColor').style.backgroundColor;
    $w('#CEPickerBackground').on('change', ({ detail }) => {
        selectedcolor = detail;
        $w('#currentColor').style.backgroundColor = detail;
        $w('#txtCustomColorIndicator').text = detail.toUpperCase();
        updateRepeater(null);
        $w('#customColorBox').style.borderColor = '#757575';
        $w('#customColorBox').style.borderWidth = '3px';
    });
    $w('#colorRepeater').data = themecolors;
});

function hexToRGB(hex, alpha, array) {
    var r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);

    if (alpha) {
        return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
    } else {
        if (array === true) {
            console.log(r);
            return [r, g, b];
        } else {
            return "rgb(" + r + ", " + g + ", " + b + ")";
        }
    }
}

export function savechangesButton_click(event) {
    $w("#dynamicDataset").setFieldValues({
        "_id": classitem._id,
        "title": $w('#iclassName').value,
        "enableDueDates": $w('#ienableDueDates').checked,
        "enableGrading": $w('#ienableGrading').checked,
        "color": selectedcolor
    });
    $w('#dynamicDataset').save().then(() => {
        generateSuccess('Settings successfully updated');
    }).catch((error) => {
        generateError('Something went wrong. Try again.');
        console.log(error);
    });
}

export function discardchangesButton_click(event) {
    $w('#dynamicDataset').refresh();
}

export function copyInviteLinkTxt_click(event) {
    copyToClipboard(`https://www.learn.financedu.org/classinvite?code=${$w('#codetxt').text}`).then(() => {
        generateSuccess('Invite Link Copied!');
    }).catch(() => {
        generateError('Unable to Copy Link. Try again.');
    })
}

export function colorRepeater_itemReady($item, itemData, index) {
    $item('#colorBox').style.backgroundColor = '#' + itemData._id;
}

export function colorBox_click(event) {
    let $item = $w.at(event.context);
    $w('#currentColor').style.backgroundColor = $item('#colorBox').style.backgroundColor;
    $item('#colorBox').style.borderWidth = '3px';
    selectedcolor = $item('#colorBox').style.backgroundColor;
    $w("#htmlStripGradient").postMessage([selectedcolor, hexToRGB(selectedcolor, 0.75)]);
    const newrgbColor = hexToRGB(selectedcolor, null, true);
    $w("#stripHtml").postMessage(selectedcolor);
    $w('#settingsClassroomButton').style.backgroundColor = `rgb(${Math.round(Number(newrgbColor[0])*0.8)}, ${Math.round(Number(newrgbColor[1])*0.8)}, ${Math.round(Number(newrgbColor[2])*0.8)})`;
    $w('#customColorBox').style.borderColor = '#F3F3F3';
    $w('#customColorBox').style.borderWidth = '2px';
    updateRepeater($w('#currentColor').style.backgroundColor.substring(1));
}

function updateRepeater(noItem) {
    $w("#colorRepeater").forEachItem(($item, itemData, index) => {
        if (itemData._id !== noItem) {
            $item('#colorBox').style.borderWidth = '1px';
        }
    });
}

export function importStudents_click(event) {
    wixWindow.openLightbox("Import Students", { className: classitem.title, classCode: classitem.code });
}

export function addStudentButton_click(event) {
    wixWindow.openLightbox("Add Student", { className: classitem.title, classCode: classitem.code });
}