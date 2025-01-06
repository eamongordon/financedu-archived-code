import { generateError } from 'public/statusbox.js';
import { addStafftoOrganization, queryOrganizationsbyCode } from 'backend/organizations.jsw';
import wixUsers from 'wix-users';
import wixLocation from 'wix-location';

let debounceTimer;
let classId;

$w.onReady(function () {
    if (wixLocation.query.code) {
        $w('#classCodeInput').value = wixLocation.query.code;
        queryClasses();
    } else {
        $w('#statebox').changeState('Join');
    }
});

/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/
export function nextButton_click(event) {
    queryClasses();
}

export function classCodeInput_keyPress(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        if (event.key === "Enter") {
            queryClasses();
        }
    }, 500);
}

function queryClasses() {
    $w('#nextButton').disable();
    queryOrganizationsbyCode($w('#classCodeInput').value).then((results) => {
        if (results.status === true) {
            classId = results.classitem;
            $w('#classConfirmText').text = results.classitem.title;
            $w('#statebox').changeState('ClassConfirmation');
        } else {
            generateError("Organization Not Found. Try a Different Code.");
            $w('#classnotFoundText').show('fade', {duration: 200});
            $w('#nextButton').enable();
            $w('#statebox').changeState('Join');
        }
    }).catch((error) => {
        generateError();
    })
}

export function confirmJoinClass_click(event) {
    addStafftoOrganization(classId, wixUsers.currentUser.id).then((result) => {
        if (result.status === true) {
            wixLocation.to('/account/organizations');
        } else {
            wixLocation.to('/account/organizations');
        }
    }).catch((error) => {
        $w('#errorJoiningClass').show();
    })
}