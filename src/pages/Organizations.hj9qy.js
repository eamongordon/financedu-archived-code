import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { getRoles, getMemberData } from 'public/memberFunctions.js';
import wixAnimations from 'wix-animations';
import { formFactor, openLightbox } from 'wix-window';
import { generateSuccess, generateError } from 'public/statusbox.js';

let roles;
let member;

$w.onReady(async function () {
    roles = await getRoles();
    member = await getMemberData();
    const memberId = member._id;
    loadMemberCard();
    let allorganizationItems = [];
    if (roles.includes("Administrator")) {
        $w('#addOrganizationButton').label = "+ Add";
        let organizations = await wixData.queryReferenced("People", memberId, 'Organizations');
        let organizationsItems = organizations.items;
        while (organizations.hasNext()) {
            organizations = await organizations.next();
            organizationsItems = organizationsItems.concat(organizations.items);
        }
        organizationsItems = organizationsItems.map((item) => {
            return { ...item, role: 'Administrator' }
        });
        allorganizationItems = allorganizationItems.concat(organizationsItems);
    }
    if (roles.includes("Teacher")) {
        //$w('#addOrganizationButton').label = "+ Join";
        $w('#noOrganizationHeading').text = "Ready to join an organization?";
        $w('#noOrganizationSubtext').text = "Join an organization by clicking the button below.";
        let organizations = await wixData.queryReferenced("People", memberId, 'Organizations-1');
        let organizationsItems = organizations.items;
        while (organizations.hasNext()) {
            organizations = await organizations.next();
            organizationsItems = organizationsItems.concat(organizations.items);
        }
        organizationsItems = organizationsItems.map((item) => {
            return { ...item, role: 'Teacher' }
        });
        allorganizationItems = allorganizationItems.concat(organizationsItems);
    }
    $w('#organizationRepeater').data = allorganizationItems;
    if (allorganizationItems.length > 0) {
        $w('#statebox').changeState('Organization');
    } else {
        $w('#statebox').changeState('NoOrganization')
    }
});

async function loadMemberCard() {
    if (member.profile.nickname) {
        $w('#firstNameTxt').text = member.profile.nickname;
    } else {
        $w('#firstNameTxt').text = member.profile.slug;
    }
    if (member.profile.profilePhoto) {
        $w('#profileImg, #hoverProfileImg').src = member.profile.profilePhoto.url;
    }
    $w('#profilePicStateBox').onMouseIn((event) => {
        $w('#profilePicStateBox').changeState('Hover');
    });
    $w('#profilePicStateBox').onMouseOut((event) => {
        $w('#profilePicStateBox').changeState('Regular');
    });
}

/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/

let contextIndex;

export function threeDotsMenu_click(event) {
    const repeaterIndex = $w('#organizationRepeater').data.findIndex(obj => obj._id === event.context.itemId);
    contextIndex = repeaterIndex;
    const timeline = wixAnimations.timeline();
    let yOffset;
    if (formFactor === 'Mobile') {
        yOffset = 193 * repeaterIndex;
    } else {
        yOffset = 115 * repeaterIndex;
    }
    const currentOrganizationItem = $w('#organizationRepeater').data[repeaterIndex];
    if (currentOrganizationItem.role === 'Staff') {
        $w('#deleteOrganization').label = "Leave";
        $w('#schoolSettingsButton').collapse();
    }
    timeline.add($w('#contextMenu'), [{ "y": yOffset, "duration": 10 }]).play().onComplete(async () => {
        await $w('#contextMenu').show();
    });
}

/*
export function schoolSettingsButton_click(event) {
	leaveClassInstructor
}
*/

/**
*	Sets the function that runs when a new repeated item is created.
	[Read more](https://www.wix.com/corvid/reference/$w.Repeater.html#onItemReady)
*	 @param {$w.$w} $item
*/
export function organizationRepeater_itemReady($item, itemData, index) {
    if (itemData.coverImage) {
        $item('#organizationProfileImage').src = itemData.coverImage;
    }
    $item('#organizationName').text = itemData.title;
    $item('#organizationRole').text = itemData.role;
    $item('#schoolSettingsButton').link = `/organization/${itemData._id}/admin`;
    if (itemData.role === 'Administrator') {
        $w('#organizationName, #organizationRole, #organizationProfileImage').onClick(() => {
            wixLocation.to(`/organization/${itemData._id}/admin`);
        });
    }
}

export function removeButton_click(event) {
    const classObj = $w('#organizationRepeater').data.find((obj) => obj._id === $w('#organizationRepeater').data[contextIndex]._id);
    if (roles.includes("Administrator")) {
        openLightbox("Delete Confirmation", { confirmText: `Are you sure you want to delete "${classObj.title}?"`, infoMessage: "You can rejoin later." }).then((data) => {
            if (data.confirmed) {
                return wixData.remove("Organizations", $w('#organizationRepeater').data[contextIndex]._id).then(() => {
                    const itemToDeleteIndex = $w('#organizationRepeater').data.findIndex((obj) => obj._id === $w('#organizationRepeater').data[contextIndex]._id);
                    let repeaterData = $w('#organizationRepeater').data;
                    repeaterData.splice(itemToDeleteIndex, 1);
                    $w('#contextMenu').hide();
                    $w('#organizationRepeater').data = repeaterData;
                    generateSuccess("Organization Successfully Deleted");
                    if (repeaterData.length === 0) {
                        $w('#statebox').changeState('NoOrganizations');
                    }
                });
            }
        });
    } else {
        openLightbox("Delete Confirmation", { confirmText: `Are you sure you want to leave "${classObj.title}?"`, infoMessage: "You can rejoin later.", confirmButtonLabel: "Leave" }).then(async (data) => {
            if (data.confirmed) {
                const memberId = await getMemberData('_id');
                return wixData.removeReference("Organizations", "administrators", $w('#organizationRepeater').data[contextIndex]._id, memberId).then(() => {
                    const itemToDeleteIndex = $w('#organizationRepeater').data.findIndex((obj) => obj._id === event.context.itemId);
                    let repeaterData = $w('#organizationRepeater').data;
                    repeaterData.splice(itemToDeleteIndex, 1);
                    $w('#organizationRepeater').data = repeaterData;
                    if (repeaterData.length === 0) {
                        $w('#statebox').changeState('NoOrganizations');
                    }
                    generateSuccess("Organization left successfully.");
                });
            }
        });
    }
}

export function addOrganizationButton_click(event) {
    if (roles.includes("Administrator")) {
        openLightbox("Add Organization").then((res) => {
            let organizationRepeaterData = $w('#organizationRepeater').data;
            organizationRepeaterData.push(res.addedOrganization);
            $w('#organizationRepeater').data = organizationRepeaterData;
        });
    } else {
        wixLocation.to('/join-organization');
    }
}

export function noOrganizationsAdd_click(event) {
    if (roles.includes("Administrator")) {
        addOrganizationButton_click();
    } else {
        //joim
    }
}
