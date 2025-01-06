import wixData from 'wix-data';
import wixUsers from 'wix-users';
import wixWindow from 'wix-window';
import { generateInstructorInvite } from 'backend/memberFunctions/classInvites.jsw';

let user;
let received;
let debounceTimer;

$w.onReady(async function () {
    user = wixUsers.currentUser;
    received = wixWindow.lightbox.getContext();
    //populateclassdropdown(numb)
});

/*
function populateclassdropdown(numb) {
    wixData.query('Classes')
        .eq('_owner', user.id)
        .find()
        .then(res => {
            let options = [];
            options.push(...res.items.map(region => {
                return { 'value': region.code, 'label': region.title };
            }));
            $w('#dropdowncourse').options = options;
            $w('#dropdowncourse').selectedIndex = Number(numb);
        })
}
*/

export function inviteStudentButton_click(event) {
    $w('#statebox').changeState('Loading');
    if ($w('#emailInput').valid) {
        const email = $w('#emailInput').value;
        generateInstructorInvite(email, received.classId).then(() => {
            $w('#statebox').changeState('Done');
        }).catch((error) => {
            console.log(error);
            if (error === "No User") {
                $w('#statebox').changeState('AddOne');
                $w('#errorTextEmail').expand();
            } else {
                $w('#statebox').changeState('Error')
            }
        })
    } else {
        $w('#emailInput, #dropdowncourse').updateValidityIndication();
    }
}

export function inviteMultipleTxt_click(event) {
    $w('#statebox').changeState('AddMultiple')
}

export function inviteMultipleStudentsButton_click(event) {
    $w('#statebox').changeState('Loading');
    const emailArray = $w('#textBoxMultipleStudents').value.replace(/(^,)|(,$)/g, '').replace(/[\r\n]/gm, '').split(",");
    let promises = [];
    emailArray.forEach((email) => {
        promises.push(generateInstructorInvite(email, received.classId));
    })
    return Promise.all(promises).then(() => {
        $w('#statebox').changeState('Done');
    }).catch(() => {
        $w('#statebox').changeState('Error');
    })
}

export function textBoxMultipleStudents_input(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        $w("#textBoxMultipleStudents").onCustomValidation((value, reject) => {
            const emailArray = value.replace(/(^,)|(,$)/g, '').replace(/[\r\n]/gm, '').split(",");
            console.log(emailArray);
            const regexExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if (emailArray.length > 0) {
                if (emailArray.every((string) => regexExp.test(string) === true)) {
                    $w('#inviteMultipleStudentsButton').enable();
                } else {
                    $w('#inviteMultipleStudentsButton').disable();
                    reject('All Items Must be Valid Emails');
                    $w('#textBoxMultipleStudents').updateValidityIndication();
                }
            } else {
                $w('#inviteMultipleStudentsButton').disable();
            }
        });
    }, 500);
}

export function importStudentsList_click(event) {
    wixWindow.openLightbox("Import Students", { className: received.className, classCode: received.classCode });
}

export function emailInput_keyPress(event) {
    if (event.key === "Enter") {
        inviteMultipleStudentsButton_click();
        $w('#errorTextEmail').collapse();
    }
}

export function backtoClass_click(event) {
	wixWindow.lightbox.close();
}