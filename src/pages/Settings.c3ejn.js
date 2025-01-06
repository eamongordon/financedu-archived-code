import { currentMember } from 'wix-members';
import wixLocation from 'wix-location';
import wixUsers from 'wix-users';
import { updateData, sendSetPasswordEmailFunction, changeMemberLoginEmail } from '@prospectorminerals/memberfunctions-backend';
import wixData from 'wix-data';
import { getAuthUrlEnable } from '@prospectorminerals/google-oauth-sso';
import { getFBAuthUrlEnable } from '@prospectorminerals/facebookoauth';
import { generateSuccess, generateError } from 'public/statusbox.js';
import { formFactor } from 'wix-window';
import { getRoles } from 'public/memberFunctions.js';
import { assignRoles, removeRoles, updateDataTest } from 'backend/memberFunctions/extraFunctions.jsw';
//import { listCountries } from 'public/countrycodes.js';

let id = wixUsers.currentUser.id;
let email;
let loginData;
let roles;
let newRolesList = [];
let rolesToRemoveList = [];
//let savedMemberData;

$w.onReady(async function () {
    retrieveProfileInfo();
    //retrieve2faStatus();
    //populatePhoneDropdown();
    $w('#updateProfileBtn, #discardProfileBtn').enable();
    if ($w('Button').some((obj) => obj.id === 'logoutButton')) {
        $w("#logoutButton").onClick(logoutAndRedirect);
    }
});

async function retrieveProfileInfo() {
    currentMember.getMember({ fieldsets: ['FULL'] })
        .then((member) => {
            if (formFactor !== 'Mobile') {
                if (member.profile.nickname) {
                    $w('#firstNameTxt').text = member.profile.nickname;
                } else {
                    $w('#firstNameTxt').text = member.profile.slug;
                }
                if (member.profile.profilePhoto) {
                    $w('#profileImg, #hoverProfileImg').src = member.profile.profilePhoto.url;
                }
                //$w('#memberCardStatebox').changeState('card');
                $w('#profilePicStateBox').onMouseIn((event) => {
                    $w('#profilePicStateBox').changeState('Hover');
                });
                $w('#profilePicStateBox').onMouseOut((event) => {
                    $w('#profilePicStateBox').changeState('Regular');
                });
            }
            //savedMemberData = member;
            email = member.loginEmail;
            $w('#iDisplayName').value = member.profile.nickname;
            if (member.profile.profilePhoto) {
                $w('#profileImage').src = member.profile.profilePhoto.url;
            }
            $w('#iFirstName').value = member.contactDetails.firstName;
            $w('#iLastName').value = member.contactDetails.lastName;
            $w('#iEmail').value = member.loginEmail;
            $w('#iPhone').value = member.contactDetails.phones[0];
            $w('#loadingGif').hide();
            $w('#tabs').show();
            loadSocialLoginSettings(member._id);
            loadRoleSettings(member._id);
        })
        .catch((err) => {
            console.log(err);
        });
}

async function loadSocialLoginSettings(memberId) {
    loginData = await wixData.get("LoginSettings", memberId);
    if (wixLocation.query.googleLoginStatus) {
        const tabtoSelect = $w('#tabs').tabs.find((obj) => obj.label === 'Login');
        $w('#tabs').changeTab(tabtoSelect);
        $w('#socialLoginLine').scrollTo();
        if (wixLocation.query.googleLoginStatus === 'success') {
            generateSuccess("Google login enabled.");
            wixLocation.queryParams.remove(['googleLoginStatus']);
        } else {
            generateError("Unable to enable Google login. This Google account may already be connected to another account.");
            wixLocation.queryParams.remove(['googleLoginStatus']);
        }
    } else if (wixLocation.query.facebookLoginStatus) {
        const tabtoSelect = $w('#tabs').tabs.find((obj) => obj.label === 'Login');
        $w('#tabs').changeTab(tabtoSelect);
        $w('#socialLoginLine').scrollTo();
        if (wixLocation.query.facebookLoginStatus === 'success') {
            generateSuccess("Facebook login enabled.");
            wixLocation.queryParams.remove(['facebookLoginStatus']);
        } else {
            generateError("Unable to enable Facebook login. This Facebook account may already be connected to another account.");
            wixLocation.queryParams.remove(['facebookLoginStatus']);
        }
    }
    loadSocialLoginRepeater();
    if (loginData.twoFactorAuthEnabled) {
        $w('#tfaswitch').checked = true;
        $w('#methodDropdown').value = loginData.twoFactorAuthMethods[0];
        $w('#methodDropdown').expand();
    }

    function loadSocialLoginRepeater() {
        $w('#socialLoginRepeater').forEachItem(($item, itemData, index) => {
            if ($item('#loginText').text === 'Google') {
                if (loginData.googleLoginEnabled) {
                    $item('#connectedStatusTxt').text = "Connected";
                    $item('#connectedStatusTxt').html = $item('#connectedStatusTxt').html.replace(/>/g, ' style="color: ' + "#22db54" + '">');
                    $item('#connectMode').hide();
                    $item('#disconnectMode').show();
                } else {
                    $item('#disconnectMode').hide();
                    $item('#connectMode').show();
                }
            } else if ($item('#loginText').text === 'Facebook') {
                if (loginData.facebookLoginEnabled) {
                    $item('#connectedStatusTxt').text = "Connected";
                    $item('#connectedStatusTxt').html = $item('#connectedStatusTxt').html.replace(/>/g, ' style="color: ' + "#22db54" + '">');
                    $item('#connectMode').hide();
                    $item('#disconnectMode').show();
                } else {
                    $item('#disconnectMode').hide();
                    $item('#connectMode').show();
                }
            }
        });
    }
}

async function loadRoleSettings(memberId) {
    roles = await getRoles();
    loadRoleRepeater();
    const member = await currentMember.getMember();
    if (member.contactDetails.customFields['custom.default-homepage']) {
        $w('#memberHomepageDropdown').value = member.contactDetails.customFields['custom.default-homepage'].value;
    } else {
        $w('#memberHomepageDropdown').value = "homepage";
    }
    loadHomepageDropdown();

    function loadRoleRepeater() {
        $w('#roleRepeater').forEachItem(($item, itemData, index) => {
            if ($item('#roleTitle').text === 'Learner') {
                $item('#roleCheckbox').checked = true;
                $item('#roleCheckbox').disable();
                $item('#roleCheckbox').label = "Enabled";
            } else {
                if (roles.includes($item('#roleTitle').text)) {
                    $item('#roleCheckbox').checked = true;
                    $item('#roleCheckbox').label = "Enabled";
                }
            }
        });
    }
}

async function retrieve2faStatus() {
    wixData.query("TwoFactorAuthMembers")
        .eq("_id", id)
        .find()
        .then((results) => {
            if (results.items.length > 0) {
                $w('#tfaswitch').checked = true;
                $w('#methodDropdown').value = results.items[0].type;
                $w('#methodDropdown').expand();
            }
        });
}

export function resetPassword_click(event) {
    $w('#resetPassword').disable();
    sendSetPasswordEmailFunction(email).then(() => {
        generateSuccess('Password reset email sent.');
    }).catch((error) => {
        generateError('There was an error sending a password reset email. Please try again later.');
    }).finally(() => {
        $w('#resetPassword').enable();
    })
}

export function updateProfile() {
    let items = $w("TextInput").map(el => $w("#" + el.id));
    let invalidCount = items.filter(el => !el.valid).length;
    let deletePhones;
    if (invalidCount === 0) {
        let member = {
            contactDetails: {
                firstName: $w('#iFirstName').value,
                lastName: $w('#iLastName').value,
                emails: [$w('#iEmail').value],
                phones: [$w('#iPhone').value],
            },
            profile: {
                nickname: $w('#iDisplayName').value,
                profilePhoto: {
                    url: $w('#profileImage').src
                }
            }
        }
        if (!$w('#iPhone').value) {
            deletePhones = true;
            delete member.contactDetails.phones;
        } else {
            deletePhones = false;
        }
        let prefs = {
            deletePhones: deletePhones
        }
        console.log(member);
        return updateData(member, prefs)
            .then(() => {
                return Promise.resolve();
            }).catch((error) => {
                Promise.reject(error);
            })
    } else {
        $w("TextInput").updateValidityIndication();
    }
}

export function updateProfileBtn_click(event) {
    $w('#updateProfileBtn').disable();
    updateProfile()
        .then(() => {
            generateSuccess('Profile Successfully Updated');
        }).catch((err) => {
            generateError('There was an error updating your account. Please check all required (*) fields.');
        }).finally(() => {
            $w('#updateProfileBtn').enable();
        })
}

export function discardProfileBtn_click(event) {
    retrieveProfileInfo();
}

function savetwofactorAuthSettings() {
    if ($w('#tfaswitch').checked === true) {
        //validateNumber(phone)
        //.then( (results) => {
        //if (results.isValid === true) {
        if ($w('#methodDropdown').value) {
            if ($w('#methodDropdown').value === 'email') {
                loginData.twoFactorAuthMethods = ['email'];
                loginData.twoFactorAuthEnabled = true;
                return wixData.save("LoginSettings", loginData).then(() => {
                    Promise.resolve({ status: true });
                });
            } else {
                if ($w('#iPhone').value && $w('#iPhone').valid === true) {
                    loginData.twoFactorAuthMethods = ['email'];
                    loginData.twoFactorAuthEnabled = true;
                    return wixData.save("LoginSettings", loginData).then(() => {
                        Promise.resolve({ status: true });
                    });
                } else {
                    $w('#tfaswitch').checked = false;
                    $w('#text41').text = "Please Enter a Valid Phone Number with the Country Code Included.";
                    Promise.reject();
                }
            }
        } else {
            $w('#tfaswitch').checked = false;
            $w('#text41').text = "Please Select a Valid Method from the Dropdown.";
            Promise.reject();
        }
        //})
    } else {
        loginData.twoFactorAuthMethods = [];
        loginData.twoFactorAuthEnabled = false;
        return wixData.save("LoginSettings", loginData).then(() => {
            Promise.resolve({ status: true });
        });
    }
}

function logoutAndRedirect(event) {
    Promise.all([wixLocation.to('/'), wixUsers.logout()]);
}

export function uploadButton_change(event) {
    $w("#uploadButton").uploadFiles()
        .then((uploadedFiles) => {
            $w('#profileImage').src = `https://static.wixstatic.com/media/${uploadedFiles[0].fileName}`
        })
}

/*
async function populatePhoneDropdown() {
    const countryList = listCountries();
    const formattedCountries = countryList.map((obj) => {
        return { label: `${obj.name} (${obj.dial_code})`, value: obj.dial_code }
    });
    $w('#countryDropdown').options = formattedCountries;
}
*/

export function updateLoginBtn_click(event) {
    $w('#updateLoginBtn').disable();
    if ($w('#iEmail').value !== email) {
        Promise.all([changeMemberLoginEmail($w('#iEmail').value), savetwofactorAuthSettings()]).then(() => {
            email = $w('#iEmail').value;
            generateSuccess('Settings Successfully Updated');
        }).catch((error) => {
            console.log(error);
            generateError("An error occured. Try again later", error);
        }).finally(() => {
            $w('#updateLoginBtn').enable();
        })
    } else {
        savetwofactorAuthSettings().then((res) => {
            generateSuccess('Settings Successfully Updated');
        }).catch((err) => {
            console.log(err);
            generateError("An error occured. Try again Later.", err);
        }).finally(() => {
            $w('#updateLoginBtn').enable();
        });
    }
}

export function discardLoginBtn_click(event) {
    retrieveProfileInfo();
    retrieve2faStatus();
}

export function tfaswitch_change(event) {
    if (event.target.checked === true) {
        $w('#methodDropdown').expand();
    } else {
        $w('#methodDropdown').collapse();
    }
}

export function connectMode_click(event) {
    let $item = $w.at(event.context);
    $item('#connectMode').disable();
    if ($item('#loginText').text === "Google") {
        getAuthUrlEnable()
            .then((url) => {
                wixLocation.to(url);
            })
            .catch((error) => {
                $item('#connectMode').enable();
                console.log(error);
            });
    } else if ($item('#loginText').text === "Facebook") {
        getFBAuthUrlEnable()
            .then((url) => {
                wixLocation.to(url);
            })
            .catch((error) => {
                $item('#connectMode').enable();
                console.log(error);
            });
    }
}

export async function disconnectMode_click(event) {
    let $item = $w.at(event.context);
    $item('#disconnectMode').disable();
    if ($item('#loginText').text === "Google") {
        loginData.googleLoginEnabled = false;
        loginData.googleUserId = null;
        wixData.update("LoginSettings", loginData)
            .then(() => {
                $item('#connectedStatusTxt').html = `<p style="font-size:16px;"><span class="color_13"><span style="font-size:16px;">Disconnected</span></span></p>`;
                //$item('#connectedStatusTxt').html = $item('#connectedStatusTxt').html.replace(/>/g, ' style="color: ' + "#999797" + '">');
                //$item('#connectedStatusTxt').text = "Disconnected";
                generateSuccess("Google login disconnected");
                $item('#disconnectMode').hide();
                $item('#connectMode').show();
            })
            .catch((error) => {
                $item('#disconnectMode').enable();
                generateError(null, error);
                console.log(error);
            });
    } else if ($item('#loginText').text === "Facebook") {
        loginData.facebookLoginEnabled = false;
        loginData.facebookUserId = null;
        wixData.update("LoginSettings", loginData)
            .then(() => {
                $item('#connectedStatusTxt').html = `<p style="font-size:16px;"><span class="color_13"><span style="font-size:16px;">Disconnected</span></span></p>`;
                generateSuccess("Facebook login disconnected");
                $item('#disconnectMode').hide();
                $item('#connectMode').show();
            })
            .catch((error) => {
                $item('#disconnectMode').enable();
                generateError(null, error);
                console.log(error);
            });
    }
}

function loadHomepageDropdown() {
    let dropdownOptions = [{ "label": "Financedu Homepage", "value": "home" }, { "label": "Learner Dashboard", "value": "learner-dashboard" }];
    if (roles.includes('Parent')) {
        dropdownOptions.push({
            "label": `Parent Dashboard`,
            "value": "parent-dashboard"
        })
    }
    if (roles.includes('Teacher') || roles.includes("Student")) {
        dropdownOptions.push({
            "label": `Classes`,
            "value": "classes"
        })
    }
    if (roles.includes('Administrator') || roles.includes('Teacher')) {
        dropdownOptions.push({
            "label": `Organizations`,
            "value": "organizations"
        });
    }
    if (!dropdownOptions.some((obj) => obj.value === $w('#memberHomepageDropdown').value)) {
        $w('#memberHomepageDropdown').value = "learner-dashboard";
    } else {
        console.log(dropdownOptions);
    }
    $w('#memberHomepageDropdown').options = dropdownOptions;
}

export async function updateRoleBtn_click(event) {
    $w('#updateRoleBtn').disable();
    Promise.all([assignRoles(newRolesList), removeRoles(rolesToRemoveList), updateHomepage()])
        .then(async () => {
            let menuItems = [];
            if (roles.includes('Learner')) {
                menuItems.push({
                    "link": "/account/learner-dashboard",
                    "target": "_self",
                    "label": "Learner Dashboard",
                    "menuItems": []
                });
            }
            if (roles.includes('Parent')) {
                menuItems.push({
                    "link": "/account/parent-dashboard",
                    "target": "_self",
                    "label": "Parent Dashboard",
                    "menuItems": []
                });
            }
            if (roles.includes('Teacher') || roles.includes('Student')) {
                menuItems.push({
                    "link": "/account/classes",
                    "target": "_self",
                    "label": "Classes",
                    "menuItems": []
                });
            }
            if (roles.includes('Administrator')) {
                menuItems.push({
                    "link": "/account/organizations",
                    "target": "_self",
                    "label": "Organizations",
                    "menuItems": []
                });
            }
            if (roles.includes('Donor')) {
                menuItems.push({
                    "link": "/account/recurring-donations",
                    "target": "_self",
                    "label": "Recurring Donations",
                    "menuItems": [{
                        "link": "/account/payment-info",
                        "target": "_self",
                        "label": "Payment Info",
                        "menuItems": []
                    }]
                });
            }
            if (roles.includes('Tester')) {
                menuItems.push({
                    "link": "/account/testing",
                    "target": "_self",
                    "label": "Testing",
                    "menuItems": []
                })
            }
            menuItems.push({
                "link": "/account/settings",
                "target": "_self",
                "label": "Settings",
                "menuItems": []
            }, {
                "selected": false,
                "target": "_self",
                "label": "Log Out",
                "menuItems": []
            });
            $w('#verticalMenu2, #headerMemberMenu').menuItems = menuItems;
            generateSuccess('Roles Successfully Updated');
        }).catch((err) => {
            console.log(err);
            generateError('There was an error updating your account. Please check all required (*) fields.');
        }).finally(() => {
            $w('#updateRoleBtn').enable();
        })

}

async function updateHomepage() {
    let member = await currentMember.getMember();
    if ($w('#memberHomepageDropdown').value === member.contactDetails.customFields['custom.default-homepage']?.value) {
        return Promise.resolve();
    } else {
        member.contactDetails.customFields['custom.default-homepage'] = {
            value: $w('#memberHomepageDropdown').value
        }
        const prefs = {
            deletePhones: false
        }
        return updateData(member, prefs).then(() => {
            return Promise.resolve();
        });
    }
}

export function roleCheckbox_change(event) {
    let $item = $w.at(event.context);
    if (event.target.checked === true) {
        if (!roles.includes($item('#roleTitle').text)) {
            newRolesList.push($item('#roleTitle').text);
            roles.push($item('#roleTitle').text);
        }
        $item('#roleCheckbox').label = "Enabled";
    } else {
        if (roles.includes($item('#roleTitle').text)) {
            rolesToRemoveList.push($item('#roleTitle').text);
            const indexToSplice = roles.findIndex((item) => item === $item('#roleTitle').text);
            roles.splice(indexToSplice, 1);
        }
        $item('#roleCheckbox').label = "Enable";
    }
    loadHomepageDropdown();
}

export function updateProfileBtn_mouseIn(event) {
    console.log($w('#iFirstName').value);
}