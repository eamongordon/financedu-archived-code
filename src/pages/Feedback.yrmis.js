import wixWindow from 'wix-window';
import { authentication, currentMember } from 'wix-members';
import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { handleFeedbackModalSession, initFeedbackTimer } from 'public/testing.js'

let feedbackObj = {};

$w.onReady(async function () {
    let received = wixWindow.lightbox.getContext();
    handleFeedbackModalSession();
    //$w('#leave').link = received.leaveLink;
    if (received) {
        feedbackObj = received;
        if (received?.category) {
            $w('#categoryDropdown').value = received.category;
            if (received.category === 'Bug Report' && received.errorMessage) {
                $w('#errorMessageInput').required = true;
                $w('#errorMessageInput').expand();
                $w('#errorMessageInput').disable();
                $w('#errorMessageInput').value = JSON.stringify(feedbackObj.errorMessage);
                $w('#errorMessageInput').placeholder = "When did this error occur?";
            }
        }
    }
    if (authentication.loggedIn()) {
        const member = await currentMember.getMember();
        feedbackObj.memberId = member._id;
        feedbackObj.firstName = member.contactDetails.firstName;
        feedbackObj.lastName = member.contactDetails.lastName;
        feedbackObj.email = member.contactDetails.emails[0];
        $w('#firstNameInput').value = member.contactDetails.firstName;
        $w('#lastNameInput').value = member.contactDetails.lastName;
        $w('#emailInput').value = member.contactDetails.emails[0];
        $w('#firstNameInput, #lastNameInput, #emailInput').collapse();
    }
    $w('#stayorleaveBox').onClick((event) => {
        initFeedbackTimer(event);
    });
    $w('#commentsInput').onKeyPress((event) => {
        initFeedbackTimer(event);
    });
});

export function stay_click(event) {
    wixWindow.lightbox.close();
}

export function categoryDropdown_change(event) {
    if (event.target.value === 'Bug Report') {
        $w('#errorMessageInput').required = true;
        $w('#errorMessageInput').expand();
        $w('#errorMessageInput').value = feedbackObj.errorMessage;
        $w('#errorMessageInput').placeholder = "When did this error occur?";
    } else {
        $w('#errorMessageInput').placeholder = "Enter a Comment...";
        $w('#errorMessageInput').collapse();
    }
}

export async function submitButton_click(event) {
    $w('#submitButton').disable();
    if ($w('#categoryDropdown, #firstNameInput, #lastNameInput, #emailInput, #errorMessageInput, #commentsInput').valid) {
        if ($w('#firstNameInput').value) { feedbackObj.firstName = $w('#firstNameInput').value };
        if ($w('#lastNameInput').value) { feedbackObj.lastName = $w('#lastNameInput').value };
        if ($w('#emailInput').value) { feedbackObj.email = $w('#emailInput').value };
        /*
        if ($w('#errorMessageInput').value) {
            feedbackObj.errorMessage = $w('#errorMessageInput').value;
        }
        */
        feedbackObj.comments = $w('#commentsInput').value;
        feedbackObj.page = wixLocation.url;
        feedbackObj.category = $w('#categoryDropdown').value;
        if ($w('#uploadButton').value.length > 0) {
            const uploadResults = await $w('#uploadButton').uploadFiles();
            const mediaGalleryArray = uploadResults.map((file) => {
                return {
                    src: file.fileUrl,
                    type: "image"
                }
            });
            feedbackObj.mediagallery = mediaGalleryArray;
        }
        wixData.insert("Feedback", feedbackObj).then((error) => {
            wixWindow.lightbox.close({ "status": true });
        }).catch((err) => {
            wixWindow.lightbox.close({ "status": false });
        })
    } else {
        $w('TextInput, TextBox, Dropdown').updateValidityIndication();
        $w('#submitButton').enable();
    }
}