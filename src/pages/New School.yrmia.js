import wixData from 'wix-data';
import wixUsers from 'wix-users';
import wixWindow from 'wix-window';
import { sendClassInviteEmail } from 'backend/emailFunctions.jsw';

let user;

$w.onReady(async function () {
    user = wixUsers.currentUser;
    let received = wixWindow.lightbox.getContext();
    let numb = received.selectedclass;
    populateclassdropdown(numb)
});

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

export function addclassbutton_click(event) {
    if ($w('#emailInput').valid && $w('#dropdowncourse').valid) {
        const email = $w('#emailInput').value
        sendClassInviteEmail(email, `https://learn.financedu.org/classinvite?email=${email}&classcode=${$w('#dropdowncourse').value}`, $w("#dropdowncourse").options[$w("#dropdowncourse").selectedIndex]);
    } else {
        $w('#emailInput, #dropdowncourse').updateValidityIndication();
    }
}