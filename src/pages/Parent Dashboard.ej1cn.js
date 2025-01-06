import { getMemberData } from 'public/memberFunctions.js';
import { fetchChildList } from 'backend/memberFunctions/extraFunctions.jsw';
import { openLightbox } from 'wix-window';
import { disconnectChildParentAccount } from 'backend/memberFunctions/parentInvites.jsw';
import { generateError, generateSuccess } from 'public/statusbox.js';

$w.onReady(function () {
    loadMemberCard();
    fetchChildList().then((res) => {
        console.log(res);
        if (res.totalCount > 0) {
            $w('#childrenRepeater').data = res.items;
        } else {
            $w('#statebox').changeState("NoChildren");
        }
    }).catch((err) => {
        generateError(null, err);
    })
});

async function loadMemberCard() {
    const member = await getMemberData();
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

export function childrenRepeater_itemReady($item, itemData, index) {
    $item('#childName').text = `${itemData.firstName} ${itemData.lastName}`;
    $item('#childEmail').text = itemData.email;
    $item('#childProgressBtn').link = `/childprogress/${itemData._id}`;
    if (itemData.profileImage) { $item('#childProfileImage').src = itemData.profileImage };
    if (index + 1 === $w('#childrenRepeater').data.length) {
        $w('#statebox').changeState("Children");
    }
}

export function removeChild_click(event) {
    openLightbox("Delete Confirmation", {
        "confirmText": "Are you sure you want to unlink your child's account?",
        "infoMessage": "Your child's account will not be deleted, and you can re-add them to your dashboard later."
    }).then((res) => {
        if (res.confirmed === true) {
            disconnectChildParentAccount(event.context.itemId).then(() => {
                generateSuccess("Your child's account has been successfully disconnected.");
                let newChildrenRepeaterData = $w('#childrenRepeater').data;
                const childIndex = newChildrenRepeaterData.findIndex((obj) => obj._id === event.context.itemId);
                newChildrenRepeaterData.splice(childIndex, 1);
                if (newChildrenRepeaterData.length === 0) {
                    $w('#statebox').changeState('NoChildren');
                }
                $w('#childrenRepeater').data = newChildrenRepeaterData;
            }).catch((error) => {
                console.log(error);
                generateError("There was an error unlinking your child's account.", error);
            })
        }
    })
}