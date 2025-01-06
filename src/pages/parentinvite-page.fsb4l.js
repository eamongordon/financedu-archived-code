import { getRouterData, openLightbox } from 'wix-window';
import wixLocation from 'wix-location';
import { authentication } from 'wix-members';
import { retrieveInviteInfo, connectChildParentAccountbyInvitation } from 'backend/memberFunctions/parentInvites.jsw';
import { generateError } from 'public/statusbox.js';

let data;

$w.onReady(function () {
    if (authentication.loggedIn()) {
        data = getRouterData();
        $w('#statebox').changeState('ClassConfirmation');
        $w('#parentNameTxt').text = data.parentName;
        $w('#parentEmailTxt').text = data.parentEmail;
        $w('#requestDateTxt').text = data.requestDateFormatted;
    } else {
        $w('#statebox').changeState('Login');
        openLightbox("Login Form", { /*successUrl: `https://www.financedu.org/parentinvite?inviteId=${query.inviteId}`*/ });
    }
    authentication.onLogin(async () => {
        data = await retrieveInviteInfo(wixLocation.query.inviteId);
        if (data) {
            $w('#statebox').changeState('ClassConfirmation');
            $w('#parentNameTxt').text = data.parentName;
            $w('#parentEmailTxt').text = data.parentEmail;
            $w('#requestDateTxt').text = data.requestDateFormatted;
        } else {
            `https://www.financedu.org/parentinvite?inviteId=${wixLocation.query.inviteId}`
        }
    });
});

export function acceptInviteBtn_click(event) {
    $w('#acceptInviteBtn').disable();
    $w('#statebox').changeState('Loading');
    if (authentication.loggedIn()) {
        connectChildParentAccountbyInvitation(data.inviteId).then(() => {
            $w('#statebox').changeState('Success');
        }).catch((error) => {
            $w('#acceptInviteBtn').enable();
            generateError("There was an error granting access. Try again later.", error);
        })
    } else {
        authentication.promptLogin();
    }
}

export function declineInviteBtn_click(event) {
    wixLocation.to('/account/learner-dashboard');
}

export function backtoDashboard_click(event) {
    wixLocation.to('/landing');
}