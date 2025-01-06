import wixUsers from 'wix-users';
import { session } from 'wix-storage';
import wixLocation from 'wix-location-frontend';
import {query} from 'wix-location-frontend';
import { checktwofaStatus } from '@prospectorminerals/memberfunctions-backend';
import { currentMember } from 'wix-members';
//import { applyToken } from '@velo/google-sso-integration';
import { applyToken } from '@prospectorminerals/google-oauth-sso';
import { local } from 'wix-storage';
import { registerNewUserGoogle } from '@prospectorminerals/google-oauth-sso-backend';
import { registerNewUserFacebook } from '@prospectorminerals/facebookoauth-backend';

$w.onReady(async function () {
    console.log('query')
    console.log(wixLocation);
    const searchParams = new URLSearchParams(wixLocation.url);
    console.log(searchParams);

    if (wixLocation.query.sessionToken) {
        console.log('sessiontoken' + wixLocation.query.sessionToken)
        applyToken().then((picture) => {
            console.log('applied');
            //$w('#image1').src = picture;
            /*
            importFile(picture)
            .then((fileData) => {
            let member = {
                profile: {
                    profilePhoto: {
				        url: fileData.fileUrl
			        }
                }
            }
            updateData(member).then((message) => {
                console.log(message);
            });
            }).catch( (err) => {
                console.log(err);
            });
            */
            let landingPage = session.getItem("landingPage");
            wixLocation.to(landingPage);
        }).catch((err) => {
            console.log('err');
            console.error(err);
        }).finally(() => {
            console.log('complete');
        })
    }
    if (wixLocation.query.FBsessionToken) {
        wixUsers.applySessionToken(wixLocation.query.FBsessionToken)
            .then(() => {
                let landingPage = session.getItem("landingPage");
                wixLocation.to(landingPage);
            }).catch((err) => {
                console.log(err);
            });
    }
    if (wixLocation.query.emailToken) {
        wixUsers.applySessionToken(wixLocation.query.emailToken)
            .then(() => {
                let landingPage = session.getItem("landingPage");
                wixLocation.to(landingPage);
            }).catch((err) => {
                console.log(err);
            });
    }
    if (wixLocation.query.signupMode) {
        $w('#statebox').changeState('Signup');
    }
    if (wixLocation.query.socialLoginDisabled) {
        if (wixLocation.query.socialLoginDisabled === 'google') {
            $w('#passwordEmailDisplay').value = wixLocation.query.email;
            $w('#socialLoginText').text = "Since this is your first time using Google to log in, please enter your password. You will be able to use Google in all subsequent login attempts.";
            $w('#statebox').changeState('EnableSocialLogin');
        } else if (wixLocation.query.socialLoginDisabled === 'facebook') {
            $w('#passwordEmailDisplay').value = wixLocation.query.email;
            $w('#socialLoginText').text = "Since this is your first time using Facebook to log in, please enter your password. You will be able to use Facebook in all subsequent login attempts.";
            $w('#statebox').changeState('EnableSocialLogin');
        }
    }
    if (wixLocation.query.promptLogin === 'true') {
        wixUsers.promptLogin();
    }
});

export async function createAccountBtn_click(event) {
    $w('#statebox').changeState('Login');
    const email = wixLocation.query.email;
    const firstName = wixLocation.query.firstName;
    const lastName = wixLocation.query.lastName;
    const profilePhoto = decodeURIComponent(wixLocation.query.profilePhoto);
    const registrationData = {
        email: email,
        firstName: firstName,
        lastName: lastName,
        picture: profilePhoto,
        signupData: {}
    }
    if (wixLocation.query.signupMode === 'google') {
        registrationData.signupData.mode = 'google';
        registrationData.signupData.googleUserId = wixLocation.query.googleUserId;
    }
    if (wixLocation.query.signupMode === 'facebook') {
        registrationData.signupData.mode = 'facebook';
        registrationData.signupData.facebookUserId = wixLocation.query.facebookUserId;
    }
    local.setItem('registrationData', JSON.stringify(registrationData));
    wixLocation.queryParams.remove(['email', 'firstName', 'lastName', 'profilePhoto']);
    wixLocation.to('/sign-up?section=PersonalInfo');
}

export function cancelSignupBtn_click(event) {
    wixLocation.to('/');
}

import { loginUser, sendCode } from '@prospectorminerals/emailbased2fa-backend';
import { login, sendCodeMessage } from '@prospectorminerals/sms-based-2fa-backend';
import wixData from 'wix-data';
import { authentication } from 'wix-members';
import { loginClassic, sendSetPasswordEmailFunction } from '@prospectorminerals/memberfunctions-backend'
import { sendEmailLoginLink } from '@prospectorminerals/nodemailer-link-login-backend';
import { generateSuccess, generateError } from 'public/statusbox.js';

let twofadata = {};

export function forgotPassword_click(event) {
    sendSetPasswordEmailFunction($w('#passwordEmailDisplay').value).then(() => {
        $w('#loginStatebox').changeState('PasswordResetSent');
    }).catch((error) => {
        generateError('There was an error sending a password reset email. Please try again later.');
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
            $w('#loginStatebox').changeState('Verification');
        } else {
            generateError('Incorrect Username or Password.');
            $w('#loginStatebox').changeState('Password');
        }
    } else {
        const emailResults = await sendCode({ email: email, password: password });
        if (emailResults.results === true) {
            $w('#verificationIndicText').text = "We've sent an email to the address you've provided us.";
            $w('#loginStatebox').changeState('Verification');
        } else {
            generateError('Incorrect Username or Password.');
            $w('#loginStatebox').changeState('Password');
        }
    }
}

function directLogin(email, password) {
    loginClassic(email, password).then((token) => {
        authentication.applySessionToken(token).then(async () => {
            const member = await currentMember.getMember();
            const loginData = await wixData.get("LoginSettings", member._id);
            if (wixLocation.query?.socialLoginDisabled === 'google') {
                loginData.googleLoginEnabled = true;
                loginData.googleUserId = wixLocation.query.googleUserId;
            } else if (wixLocation.query?.socialLoginDisabled === 'facebook') {
                loginData.facebookLoginEnabled = true;
                loginData.facebookUserId = wixLocation.query.facebookUserId;
            }
            wixData.update("LoginSettings", loginData).finally(() => {
                wixLocation.to('/');
            })
        })
    }).catch((err) => {
        $w('#passwordLoginBtn').enable();
        $w('#loginStatebox').changeState('Password');
        if (err === 'incorrectpassword') {
            generateError('Incorrect Email or Password.');
        } else {
            generateError('There was an error logging in.');
        }
    });
}

async function completeLogin(loginInfo) {
    $w('#twofaLoginBtn').disable();
    if (twofadata.channel === 'sms') {
        const smsLoginResults = await login(loginInfo);
        if (smsLoginResults.message) {
            generateError(smsLoginResults.message + '. Please Try Again.');
            $w('#twofaLoginBtn').enable();
        } else {
            authentication.applySessionToken(smsLoginResults.results.sessionToken).then(async () => {
                const member = await currentMember.getMember();
                const loginData = await wixData.get("LoginSettings", member._id);
                wixData.update("LoginSettings", loginData).finally(() => {
                    wixLocation.to('/');
                })
            })
        }
    } else {
        const emailLoginResults = await loginUser(loginInfo)
        if (emailLoginResults.message) {
            generateError(emailLoginResults.message + '. Please Try Again.');
            $w('#twofaLoginBtn').enable();
        } else {
            authentication.applySessionToken(emailLoginResults.results.sessionToken).then(async () => {
                const member = await currentMember.getMember();
                const loginData = await wixData.get("LoginSettings", member._id);
                wixData.update("LoginSettings", loginData).finally(() => {
                    wixLocation.to('/');
                });
            })
        }
    }
}

function updateValidity() {
    generateError('Please fill out all fields.');
    $w("TextInput").updateValidityIndication();
}

export function passwordLoginBtn_click(event) {
    if ($w('#passwordInput').valid) {
        checktwofaStatus($w('#passwordEmailDisplay').value).then((res) => {
            if (res.result === true) {
                $w('#loginStatebox').changeState('Loading');
                sendVerification($w('#passwordEmailDisplay').value, $w('#passwordInput').value, twofadata.channel);
            } else {
                $w('#loginStatebox').changeState('Loading');
                directLogin($w('#passwordEmailDisplay').value, $w('#passwordInput').value);
            }
        });
    } else {
        updateValidity();
    }
}

export async function loginLinkBtn_click(event) {
    $w('#loginLinkBtn').disable();
    $w('#loginStatebox').changeState('Loading');
    const emailResults = await sendEmailLoginLink($w('#passwordEmailDisplay').value);
    if (emailResults.results === true) {
        session.setItem("landingPage", wixLocation.url);
        $w('#loginStatebox').changeState('LoginLink');
    } else {
        generateError('There was an error sending a login email. Please try again later.');
        $w('#loginStatebox').changeState('Password');
    }
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
        generateSuccess('Email Link Succesfully Resent');
        $w('#resendLoginLinkBtn').enable();
    }
}

export function resendPasswordResetLinkBtn_click(event) {
    $w('#resendPasswordResetLinkBtn').disable();
    sendSetPasswordEmailFunction($w('#passwordEmailDisplay').value).then(() => {
        generateSuccess('Password reset email sent.');
    }).catch((error) => {
        generateError('There was an error sending a password reset email. Please try again later.');
    }).finally(() => {
        $w('#resendPasswordResetLinkBtn').enable();
    })
}

export function twofaLoginBtn_click(event) {
    completeLogin({ email: $w('#passwordEmailDisplay').value, password: $w('#passwordInput').value, confirmationCode: $w('#confirmationCode').value });
}

export function passwordInput_keyPress(event) {
    if (event.key === "Enter") {
        passwordLoginBtn_click();
    }
}