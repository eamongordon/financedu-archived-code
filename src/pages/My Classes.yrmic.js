import wixData from 'wix-data';
import wixUsers from 'wix-users';
import wixWindow from 'wix-window';
import { sendEmail } from 'backend/emailFunctions.jsw';

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
    if ($w('#emailInput').valid) {
        const email = $w('#emailInput').value
        sendEmail(email, `https://learn.financedu.org/classinvite?email=${email}&classcode=${received.classCode}`, received.className);
    } else {
        $w('#emailInput, #dropdowncourse').updateValidityIndication();
    }
}

export function inviteMultipleTxt_click(event) {
    $w('#statebox').changeState('AddMultiple')
}

export function inviteMultipleStudentsButton_click(event) {
    const emailArray = $w('#textBoxMultipleStudents').value.replace(/(^,)|(,$)/g, '').replace(/[\r\n]/gm, '').split(",");
    emailArray.forEach((email) => {
        sendEmail(email, `https://learn.financedu.org/classinvite?email=${email}&classcode=${received.classCode}`, received.className);
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
	wixWindow.openLightbox("Import Students", {className: received.className, classCode: received.classCode});
}

export function classRepeater_itemReady($item, itemData) {
	$item('#backgroundBox').style.backgroundColor = itemData.color;
}