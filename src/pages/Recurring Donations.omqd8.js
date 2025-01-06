import { currentMember } from 'wix-members';

$w.onReady(function () {
	loadMemberCard();
});

async function loadMemberCard() {
    const member = await currentMember.getMember();
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