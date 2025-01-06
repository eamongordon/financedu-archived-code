import wixWindow from 'wix-window';
import { connectAdminAccountbyInvitation } from 'backend/memberFunctions/classInvites.jsw';
import wixLocation from 'wix-location';
import { authentication } from 'wix-members'
import { generateError } from 'public/statusbox.js';

$w.onReady(function () {
    const routerData = wixWindow.getRouterData();
    const classObj = routerData.organization;
    $w('#classConfirmText').text = classObj.title;
    $w('#statebox').changeState('ClassConfirmation');
});

export function confirmJoinClass_click(event) {
    $w('#confirmJoinClass').disable();
    if (authentication.loggedIn()) {
        connectAdminAccountbyInvitation(wixLocation.query.inviteId).then((result) => {
            wixLocation.to(`/organization/${result.organizationInfo._id}/admin`);
        }).catch((error) => {
            $w('#confirmJoinClass').enable();
            generateError();
        })
    } else {
		authentication.promptLogin();
	}
}