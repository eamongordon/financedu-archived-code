import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import { authentication, currentMember } from 'wix-members-frontend';

$w.onReady(function () {
    if (authentication.loggedIn()) {
        logoClick();
    } else {
        $w('#financeduVectorTabletMenu').link = '/';
    }
});

async function logoClick() {
    let link;
    const member = await currentMember.getMember();
    const homepage = member.contactDetails.customFields['custom.default-homepage']?.value;
    if (homepage) {
        if (homepage === 'home') {
            link = '/';
        } else {
            link = `/account/${homepage}`
        }
    } else {
        link = `/`
    }
    $w('#financeduVectorTabletMenu').link = link;
}

export function searchIconTabletMenu_click(event) {
    wixWindow.openLightbox("Search (Header)", { "page": wixLocation.path[0] })
}