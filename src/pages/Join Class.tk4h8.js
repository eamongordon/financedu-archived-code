import { generateError } from 'public/statusbox.js';
import { getRoles } from 'public/memberFunctions.js';
import { assignRoles } from 'backend/memberFunctions/extraFunctions.jsw';
import { addStudenttoClass, queryClassesbyCode } from 'backend/classes.jsw';
import wixUsers from 'wix-users';
import { authentication } from 'wix-members-frontend';
import wixLocation from 'wix-location';

let debounceTimer;
let classId;

$w.onReady(function () {
    if (wixLocation.query.code) {
        if (authentication.loggedIn()) {
            $w('#classCodeInput').value = wixLocation.query.code;
            queryClasses();
        } else {
            wixLocation.to(`/sign-up?code=${wixLocation.query.code}`);
        }
    } else {
        if (authentication.loggedIn()) {
            $w('#statebox').changeState('Join');
        } else {
            wixLocation.to('/sign-up');
        }
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
    queryClassesbyCode($w('#classCodeInput').value).then((results) => {
        if (results.status === true) {
            classId = results.classitem;
            $w('#classConfirmText').text = results.classitem.title;
            $w('#statebox').changeState('ClassConfirmation');
        } else {
            generateError("Class Not Found. Try a Different Code.");
            $w('#classnotFoundText').show('fade', { duration: 200 });
            $w('#nextButton').enable();
            $w('#statebox').changeState('Join');
        }
    }).catch((error) => {
        generateError(null, error);
    })
}

export async function confirmJoinClass_click(event) {
    const roles = await getRoles();
    if (!roles.includes("Student")) {
        assignRoles(["Student"]);
    }
    addStudenttoClass(classId, wixUsers.currentUser.id).then((result) => {
        if (result.status === true) {
            wixLocation.to('/account/classes');
        } else {
            wixLocation.to('/account/classes');
        }
    }).catch((error) => {
        $w('#errorJoiningClass').show();
    })
}