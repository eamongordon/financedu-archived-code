import wixWindow from 'wix-window';
import { connectInstructorAccountbyInvitation } from 'backend/memberFunctions/classInvites.jsw';
import wixLocation from 'wix-location';
import {generateError} from 'public/statusbox.js';

$w.onReady(function () {
    const routerData = wixWindow.getRouterData();
    const classObj = routerData.classInfo;
    $w('#classConfirmText').text = classObj.title;
    $w('#statebox').changeState('ClassConfirmation');
});

export function confirmJoinClass_click(event) {
    $w('#confirmJoinClass').disable();
    connectInstructorAccountbyInvitation(wixLocation.query.inviteId).then((result) => {
        wixLocation.to(`/class/${result.classInfo._id}/instructor`);
    }).catch((error) => {
        $w('#confirmJoinClass').enable();
		generateError(null, error);
    })
}