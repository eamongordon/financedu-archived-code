import { loginUser, sendCode } from '@prospectorminerals/emailbased2fa-backend';
import { login, sendCodeMessage } from '@prospectorminerals/sms-based-2fa-backend';
import { getAuthUrlLogin } from '@prospectorminerals/google-oauth-sso';
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import { session } from 'wix-storage';
import { getFBAuthUrlLogin } from '@prospectorminerals/facebookoauth';
import { checkMember, loginClassic, sendSetPasswordEmailFunction, checktwofaStatus } from '@prospectorminerals/memberfunctions-backend';
import { sendEmailLoginLink } from '@prospectorminerals/nodemailer-link-login-backend';
import { generateSuccess, generateError } from 'public/statusbox.js';
import { authentication } from 'wix-members-frontend';

let twofadata = {};
const recieved = wixWindow.lightbox.getContext();
const successUrl = recieved?.successUrl ?? wixLocation.url;

const elementData = {
    "statusboxElement": $w('#statusboxLoginForm'),
    "statusboxTextElement": $w('#statustextLoginForm'),
    "statusboxSuccessIconElement": $w('#statusBoxSuccessIconLoginForm'), 
    "statusboxErrorIconElement": $w('#statusBoxErrorIconLoginForm'),
    "statusboxInfoIconElement": $w('#statusBoxSuccessIconLoginForm'),
    "closeStatusboxElement": $w('#closeStatusMessageButtonLoginForm')
}

export function googleLogin_click(event) {
    $w('#googleLogin').disable();
    getAuthUrlLogin()
        .then((url) => {
            session.setItem("landingPage", successUrl);
            wixLocation.to(url);
        })
        .catch((error) => {
            console.log(error);
        });
}

export function facebookLogin_click(event) {
    $w('#facebookLogin').disable();
    getFBAuthUrlLogin()
        .then((url) => {
            session.setItem("landingPage", successUrl);
            wixLocation.to(url);
        })
}

export function forgotPassword_click(event) {
    sendSetPasswordEmailFunction($w('#passwordEmailDisplay').value).then(() => {
        $w('#statebox').changeState('PasswordResetSent');
    }).catch((error) => {
        generateError('There was an error sending a password reset email. Please try again later.', error, elementData);
    });
}

export function confirmationCode_keyPress(event) {
    if (event.key === "Enter") {
        completeLogin({ email: $w('#passwordEmailDisplay').value, password: $w('#passwordInput').value, confirmationCode: $w('#confirmationCode').value });
    }
}

export function resendVerificationBtn_click(event) {
    sendVerification();
}

async function sendVerification(email, password, channel) {
    if (channel === 'sms') {
        const smsResults = await sendCodeMessage({ email: email, password: password });
        if (smsResults.results === true) {
            $w('#statebox').changeState('Verification');
        } else {
            generateError('Incorrect Username or Password.', null, elementData);
            $w('#statebox').changeState('Password');
        }
    } else {
        const emailResults = await sendCode({ email: email, password: password });
        if (emailResults.results === true) {
            $w('#verificationIndicText').text = "We've sent an email to the address you've provided us.";
            $w('#statebox').changeState('Verification');
        } else {
            generateError('Incorrect Username or Password.', null, elementData);
            $w('#statebox').changeState('Password');
        }
    }
}

function directLogin(email, password) {
    loginClassic(email, password).then((token) => {
        authentication.applySessionToken(token).then(() => {
            if (recieved?.successUrl) {
                wixLocation.to(recieved.successUrl);
            }
            wixWindow.lightbox.close();
        })
    }).catch((err) => {
        console.log(err)
        $w('#passwordLoginBtn').enable();
        $w('#statebox').changeState('Password');
        if (err?.details?.applicationError?.code === '-19976') {
            generateError('Incorrect Email or Password.', null, elementData);
        } else {
            //console.log(err.details.errorCode);
            generateError('There was an error logging in.', err, elementData);
        }
    });
}

async function completeLogin(loginInfo) {
    $w('#twofaLoginBtn').disable();
    if (twofadata.channel === 'sms') {
        const smsLoginResults = await login(loginInfo);
        if (smsLoginResults.message) {
            generateError(smsLoginResults.message + '. Please Try Again.', smsLoginResults.message, elementData);
            $w('#twofaLoginBtn').enable();
        } else {
            authentication.applySessionToken(smsLoginResults.results.sessionToken).then(() => { wixWindow.lightbox.close() })
        }
    } else {
        const emailLoginResults = await loginUser(loginInfo)
        console.log(emailLoginResults);
        if (emailLoginResults.message) {
            generateError(emailLoginResults.message + '. Please Try Again.', emailLoginResults.message, elementData);
            $w('#twofaLoginBtn').enable();
        } else {
            authentication.applySessionToken(emailLoginResults.results.sessionToken).then(() => { wixWindow.lightbox.close() })
        }
    }
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
            const twofaresult = await checktwofaStatus(email);
            twofadata.channel = twofaresult.channel
            twofadata.result = twofaresult.result;
            if (twofaresult.status === true) {
                $w('#passwordLoginBtn').label = "Next";
                if (twofaresult.channel === 'sms') {
                    $w('#loginLinkBtn').collapse();
                }
            }
            $w('#passwordEmailDisplay').value = email;
            $w('#statebox').changeState('Password');
        } else {
            wixLocation.to('/sign-up');
        }
    } else {
        updateValidity();
        $w('#emailContinueBtn').enable();
    }
}

export function passwordLoginBtn_click(event) {
    if ($w('#passwordInput').valid) {
        if (twofadata.status === true) {
            $w('#statebox').changeState('Loading');
            sendVerification($w('#passwordEmailDisplay').value, $w('#passwordInput').value, twofadata.channel);
        } else {
            $w('#statebox').changeState('Loading');
            directLogin($w('#passwordEmailDisplay').value, $w('#passwordInput').value);
        }
    } else {
        updateValidity();
    }
}

export async function loginLinkBtn_click(event) {
    $w('#loginLinkBtn').disable();
    $w('#statebox').changeState('Loading');
    const emailResults = await sendEmailLoginLink($w('#passwordEmailDisplay').value);
    if (emailResults.results === true) {
        session.setItem("landingPage", successUrl);
        $w('#statebox').changeState('LoginLink');
    } else {
        generateError('There was an error sending a login email. Please try again later.', null, elementData);
        $w('#statebox').changeState('Password');
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

export async function resendLoginLinkBtn_click(event) {
    $w('#resendLoginLinkBtn').disable();
    const emailResults = await sendEmailLoginLink($w('#passwordEmailDisplay').value);
    if (emailResults.results === true) {
        generateSuccess('Email Link Succesfully Resent', elementData);
        $w('#resendLoginLinkBtn').enable();
    }
}

export function resendPasswordResetLinkBtn_click(event) {
    $w('#resendPasswordResetLinkBtn').disable();
    sendSetPasswordEmailFunction($w('#passwordEmailDisplay').value).then(() => {
        generateSuccess('Password reset email sent.', elementData);
    }).catch((error) => {
        generateError('There was an error sending a password reset email. Please try again later.', null, elementData);
    }).finally(() => {
        $w('#resendPasswordResetLinkBtn').enable();
    })
}

export function twofaLoginBtn_click(event) {
    completeLogin({ email: $w('#passwordEmailDisplay').value, password: $w('#passwordInput').value, confirmationCode: $w('#confirmationCode').value });
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
}
