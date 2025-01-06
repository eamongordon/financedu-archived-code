import { getAuthUrlSignup } from '@prospectorminerals/google-oauth-sso';
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import { session } from 'wix-storage';
import { authentication } from 'wix-members';
import { getFBAuthUrlSignup } from '@prospectorminerals/facebookoauth';
import { checkMember, registerNewUser } from '@prospectorminerals/memberfunctions-backend'
import { generateError } from 'public/statusbox.js';

let debounceTimer;

const elementData = {
    "statusboxElement": $w('#statusboxDonorRegistration'),
    "statusboxTextElement": $w('#statustextDonorRegistration'),
    "statusboxSuccessIconElement": $w('#statusSuccessIconDonorRegistration'), 
    "statusboxErrorIconElement": $w('#statusErrorIconDonorRegistration'),
    "statusboxInfoIconElement": $w('#statusInfoIconDonorRegistration'),
    "closeStatusboxElement": $w('#closeStatusBoxDonorRegistration')
}

$w.onReady(function () {
    const receivedData = wixWindow.lightbox.getContext();
    if (receivedData.email) {
        $w('#emailInput').value = receivedData.email;
    }
});

export function googleLogin_click(event) {
    $w('#googleLogin').disable();
    getAuthUrlSignup()
        .then((url) => {
            session.setItem("landingPage", "/recurring-donations-confirm");
            wixLocation.to(url);
        })
        .catch((error) => {
            console.log(error);
        });
}

export function facebookLogin_click(event) {
    $w('#facebookLogin').disable();
    getFBAuthUrlSignup()
        .then((url) => {
            session.setItem("landingPage", "/recurring-donations-confirm");
            wixLocation.to(url);
        })
}

function updateValidity() {
    generateError('Please fill out all fields.', null, elementData);
    $w("TextInput").updateValidityIndication();
}

export async function emailContinueBtn_click(event) {
    $w('#emailContinueBtn').disable();
    const email = $w('#emailInput').value;
    if ($w('#emailInput').valid) {
        $w('#statebox').changeState('Loading');
        const res = await checkMember(email);
        if (res.results === true) {
            wixWindow.openLightbox("Login Form", { "email": email, "successUrl": '/recurring-donations-confirm' });
        } else {
            $w('#passwordEmailDisplay').value = email;
            let received = wixWindow.lightbox.getContext();
            $w('#firstNameInput').value = received?.firstName;
            $w('#lastNameInput').value = received?.lastName;
            $w('#statebox').changeState('Password');
        }
    } else {
        updateValidity();
        $w('#emailContinueBtn').enable();
    }
}

export function passwordLoginBtn_click(event) {
    $w('#passwordLoginBtn').disable();
    if ($w('#passwordInput, #firstNameInput, #lastNameInput').valid) {
        $w('#statebox').changeState('Loading');
        const options = {
            contactInfo: {
                firstName: $w('#firstNameInput').value,
                lastName: $w('#lastNameInput').value
            }
        }
        registerNewUser($w('#passwordEmailDisplay').value, $w('#passwordInput').value, options).then((sessionToken) => {
            authentication.applySessionToken(sessionToken).then(() => {
                wixLocation.to("/recurring-donations-confirm");
            })
        }).catch((error) => {
            generateError('An error occurred. Try again later', null, elementData);
        })
    } else {
        $w('#passwordLoginBtn').enable();
        updateValidity();
    }
}

export function editEmailBtn_click(event) {
    $w('#statebox').changeState('Email');
    $w('#emailContinueBtn').enable();
}

export function showPasswordBtn_click(event) {
    if ($w("#passwordInput").inputType === 'password') {
        $w("#passwordInput").inputType = 'text';
        $w("#showPasswordBtn").label = "Hide";
    } else {
        $w("#passwordInput").inputType = 'password';
        $w("#showPasswordBtn").label = "Show";
    }
}

export function emailInput_keyPress(event) {
    if (event.key === "Enter") {
        emailContinueBtn_click();
    }
}

export function passwordInput_keyPress(event) {
    if (event.key === "Enter") {
        passwordLoginBtn_click();
    }
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        $w('#passwordCharCheckbox').show();
        if (event.target.value.length > 3) {
            $w('#passwordCharCheckbox').selectedIndices = [0];
        } else if (event.target.value.length === 0) {
            $w('#passwordCharCheckbox').value = null;
            $w('#passwordCharCheckbox').hide();
        } else {
            $w('#passwordCharCheckbox').value = null;
        }
    }, 500);
}

export function socialMediaSignupTxt_click(event) {
    $w('#statebox').changeState('Email');
    $w('#emailContinueBtn').enable();
}

export function emailAlreadyExists_click(event) {
    wixWindow.openLightbox("Login Form", { "successUrl": '/recurring-donations-confirm' });
}