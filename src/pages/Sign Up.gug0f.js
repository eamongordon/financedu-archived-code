import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import { getAuthUrlSignup } from '@prospectorminerals/google-oauth-sso';
import { session, local } from 'wix-storage';
import { checkMember, registerNewUser, updateData } from '@prospectorminerals/memberfunctions-backend';
import { assignRoles } from 'backend/memberFunctions/extraFunctions.jsw';
import { labelSchoolPlatformEmailList } from 'backend/memberFunctions/crm.jsw';
import { signUpNewMember } from 'backend/memberFunctions/extraFunctions.jsw';
import { authentication, currentMember } from 'wix-members';
import { currentUser } from 'wix-users';
import { getFBAuthUrlSignup } from '@prospectorminerals/facebookoauth';

let prevState;
let debounceTimer;
let roles = [];
let errorMessage;

$w.onReady(async function () {
    readParams();
    $w("#passwordPasswordInput").onCustomValidation((value, reject) => {
        if (value.toString().length < 4 || value.toString().length > 100) {
            reject("Invalid Password");
        }
    });
    $w("#passwordPasswordConfirm").onCustomValidation((value, reject) => {
        if (value.toString().length < 4 || value.toString().length > 100) {
            reject("Invalid Password");
        }
    });
    /*
    let member = await currentMember.getMember({ fieldsets: ['FULL'] });
    if (member) {
        firstName = member.contactDetails.firstName;
        lastName = member.contactDetails.lastName;
        email = member.loginEmail;
        roles = (await currentMember.getRoles()).map((role) => role.title);
    }
    */
});

async function readParams() {
    const section = wixLocation.query.section;
    if (section) {
        $w('#statebox').changeState(`${section}`).then(() => {
            // setUpStates(section);
        });
        //$w('#back, #continue').expand();
    } else {
        const localData = JSON.parse(local.getItem("registrationData"));
        if (localData?.section) {
            $w('#statebox').changeState(localData.section);
        } else {
            $w('#statebox').changeState('Start');
        }
    }
    //firstName = wixLocation.query.firstName;
    //lastName = wixLocation.query.lastName;
    //email = wixLocation.query.email;
    //$w('#continue').enable();
    //setUpStates(section);
}

function updateProgressBar(value) {
    $w('#progressBar').value = value;
}

export function statebox_change(event) {
    setUpStates(event.target.currentState.id);
    if (event.target.currentState.id !== "Loading" && event.target.currentState.id !== "Error") {
        wixLocation.queryParams.add({ "section": event.target.currentState.id });
    }
}

export function continue_click(event) {
    let localData = JSON.parse(local.getItem("registrationData"));
    switch ($w('#statebox').currentState.id) {
    case 'Email':
        checkMember($w('#emailEmailInput').value).then((res) => {
            if (res.results === true) {
                $w('#emailAlreadyExists').expand();
                $w('#continue').disable();
            } else {
                prevState = 'Email';
                localData.email = $w('#emailEmailInput').value;
                setLocalData();
                $w('#statebox').changeState('Password');
            }
        });
        break;
        /*
    case 'EmailVerification':
        checkCode(email, $w('#confirmationCode').value)
            .then((res) => {
                if (res.results === true) {
                    $w('#back').disable();
                    $w('#statebox').changeState('Password');
                } else {
                    $w('#emailverificationErr').text = res.message;
                    $w('#emailverificationErr').show();
                }
            });
        break;
        */
    case 'Password':
        $w('#statebox').changeState('Loading');
        if ($w('#passwordPasswordConfirm').valid && $w('#passwordPasswordInput').valid) {
            let contactDetails = { firstName: localData.firstName, lastName: localData.lastName };
            if (localData?.picture) {
                contactDetails.picture = localData.picture;
            }
            let password;
            if (localData.signupMode === 'password') {
                password = localData.password;
            } else {
                password = null;
            }
            $w('#statebox').changeState('Loading');
            signUpNewMember(localData.signupData, localData.email, contactDetails, $w('#passwordPasswordConfirm').value).then((sessiontoken) => {
                authentication.applySessionToken(sessiontoken);
                local.removeItem("registrationData");
                $w('#statebox').changeState('Role');
            }).catch((error) => {
                errorSetUp(error);
            })
            /*
            registerNewUser(email, $w('#passwordPasswordConfirm').value)
                .then((result) => {
                    authentication.applySessionToken(result).then(() => {
                        $w('#back').disable();
                        $w('#statebox').changeState('PersonalInfo');
                        $w('#continue').enable();
                    }).catch((error) => {
                        errorSetup();
                        console.log("failtoapplysessiontoken");
                        console.log(error);
                    })
                }).catch((error) => {
                    errorSetup();
                    console.log(error);
                })
                */
        } else {
            setTimeout(() => {
                if ($w('#passwordPasswordConfirm').value !== $w('#passwordPasswordInput').value) {
                    $w("#passwordNotMatch").show();
                }
            }, 1000);
            $w('#passwordPasswordInput, #password').updateValidityIndication();
        }
        break;
    case 'PersonalInfo':
        //updateMemberDetails().then((result) => {
        if ($w('#personalInfoFirstName').valid && $w('#personalInfoLastName').valid) {
            if (localData) {
                localData.firstName = $w('#personalInfoFirstName').value;
                localData.lastName = $w('#personalInfoLastName').value;
                setLocalData();
                if (localData?.signupData.mode === 'password') {
                    $w('#statebox').changeState('Password');
                } else {
                    let contactDetails = { firstName: localData.firstName, lastName: localData.lastName };
                    if (localData?.picture) {
                        contactDetails.picture = localData.picture;
                    }
                    $w('#statebox').changeState('Loading');
                    signUpNewMember(localData.signupData, localData.email, contactDetails).then((sessiontoken) => {
                        local.removeItem("registrationData");
                        authentication.applySessionToken(sessiontoken);
                        $w('#statebox').changeState('Role');
                    }).catch((error) => {
                        errorSetUp(error);
                    })
                }
            }
            $w('#back').enable();
            prevState = 'PersonalInfo';
            $w('#statebox').changeState('Role');
            local.removeItem("registrationData");
        } else {
            $w('#personalInfoFirstName, #personalinfoLastName').updateValidityIndication();
        }
        //});
        break;
    case 'School':

        break;
    }

    function setLocalData() {
        local.setItem("registrationData", JSON.stringify(localData))
    }
}

export function back_click(event) {
    $w('#statebox').changeState(prevState);
}

//Functions of Individual State Boxes
//----------------------
//----------------------

export function startgoogleLogin_click(event) {
    $w('#startgoogleLogin').disable();
    getAuthUrlSignup()
        .then((url) => {
            const baseUrl = 'https://financedu.org';
            session.setItem("landingPage", `${baseUrl}/sign-up?section=PersonalInfo`);
            wixLocation.to(url);
        })
        .catch((error) => {
            console.log(error);
        });
}

export function startfacebookLogin_click(event) {
    $w('#startfacebookLogin').disable();
    getFBAuthUrlSignup()
        .then((url) => {
            const baseUrl = 'https://financedu.org/';
            session.setItem("landingPage", `${baseUrl}/sign-up?section=PersonalInfo`);
            wixLocation.to(url);
        })
}

export function startEmail_click(event) {
    //if (email) { $w('#emailEmailInput').value = email };
    local.setItem("registrationData", JSON.stringify({ signupData: { mode: "password" } }));
    $w('#statebox').changeState('Email');
    prevState = 'Start';
    $w('#back, #continue').expand();
    updateProgressBar(1);
}

export function emailEmailInput_input(event) {
    $w('#emailAlreadyExists').collapse();
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        if ($w('#emailEmailInput').valid) {
            $w('#continue').enable();
        } else {
            $w('#continue').disable();
            $w('#emailEmailInput').updateValidityIndication();
        }
    }, 500);
}

export function passwordPasswordInput_input(event) {
    $w('#continue').disable();
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        updatePasswordValidity(false);
    }, 500);
}

export function passwordPasswordConfirm_input(event) {
    $w('#passwordNotMatch').hide();
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        updatePasswordValidity(true);
    }, 500);
}

function updatePasswordValidity(isConfirm) {
    $w('#continue').disable();
    if ($w('#passwordPasswordConfirm').valid && $w('#passwordPasswordInput').valid && $w('#passwordPasswordInput').value === $w('#passwordPasswordConfirm').value) {
        $w('#continue').enable();
        $w("#passwordNotMatch").hide();
    } else {
        if ($w('#passwordPasswordConfirm').value && $w('#passwordPasswordConfirm').value !== $w('#passwordPasswordInput').value) {
            $w("#passwordNotMatch").show();
            $w('#passwordPasswordInput, #password').updateValidityIndication();
        } else {
            if (isConfirm === true) { $w('#passwordPasswordInput, #password').updateValidityIndication() };
        }
    }
}

function updatePersonalInfoValidity() {
    if ($w('#personalInfoFirstName').valid && $w('#personalInfoLastName').valid) {
        $w('#continue').enable();
    } else {
        $w('#continue').disable();
    }
}
/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/
export function positionContainer_click(event) {
    let $item = $w.at(event.context);
    switch ($item("#positionNameTxt").text) {
    case 'Student':
        $w('#statebox').changeState('SchoolAsk');
        $w('#progressBar').targetValue = 7;
        break;
    case 'Parent':
        roles.push("Parent");
        assignRoleFunc().then(() => {
            $w('#statebox').changeState('Complete');
        });
        break;
    case 'Teacher':
        roles.push("Teacher");
        assignRoleFunc().then(() => {
            $w('#statebox').changeState('SchoolAsk');
        });
        break;
    case 'Administrator':
        $w('#statebox').changeState('OrganizationAsk');
        /*
        role = "Administrator";
        assignRoleFunc().then(() => {
            $w('#statebox').changeState('AdminAsk');
        })
        */
        break;
    }
}

function assignRoleFunc() {
    return assignRoles(roles).then((res) => {
        if (res.status === true) {
            return { status: true }
        } else {
            errorSetUp(error);
        }
    });
}

function editPositionRepeater(itemId) {
    $w('#roleRepeater').forEachItem(($item, itemData, index) => {
        if (itemData._id === itemId) {
            $item('#positionContainer').background.src = "https://static.wixstatic.com/media/2dcc6c_623d678059d64fe59f891bd2ffbf8757~mv2.jpeg";
        } else {
            $item('#positionContainer').background.src = null;
        }
    });
}

export function positionContainer_mouseIn(event) {
    editPositionRepeater(event.context.itemId);
}

export function positionContainer_mouseOut(event) {
    editPositionRepeater(null);
}

async function updateMemberDetails() {
    let member = {
        contactDetails: {
            firstName: $w('#personalInfoFirstName').value,
            lastName: $w('#personalInfoLastName').value,
            jobTitle: "Other",
            //emails: [$w('#iEmail').value],
            //phones: [$w('#iPhone').value],
        },
        /*
		profile: {
			nickname: $w('#iDisplayName').value,
			profilePhoto: {
				url: photoUrl
			}
		}
        */
    }
    let prefs = {
        deletePhones: false
    }
    return updateData(member, prefs)
        .then((member) => {
            if (member.status === true) {
                return { status: true };
            } else {
                console.log(member.error);
                console.log(member.status);
                return { status: false };
            }
        })
        .catch((error) => {
            console.error('Error Updating Data - ' + error);
        })
}

async function errorSetup() {
    errorSetUp(error);
    $w('#back, #continue').collapse();
}

export function backtoHometxt_click(event) {
    wixWindow.openLightbox("Leave Confirmation", { "leaveLink": '/' })
}

async function setUpStates(state) {
    let localData = JSON.parse(local.getItem("registrationData"));
    const currentStateIndex = $w('#statebox').states.indexOf($w('#statebox').currentState) - 2;
    updateProgressBar(currentStateIndex);
    if (localData) {
        if (state !== "Loading" && state !== "Error") {
            localData.section = state;
            local.setItem("registrationData", JSON.stringify(localData));
        }
    }
    switch (state) {
    case 'Role':
        editPositionRepeater(null);
        $w('#back, #continue').collapse();
        break;
    case 'Start':
        if (localData) {
            local.removeItem("registrationData");
        }
        $w('#back, #continue').collapse();
        break;
    case 'Email':
        const email = localData?.email;
        if (email) {
            $w('#emailEmailInput').value = email;
        }
        if ($w('#emailEmailInput').valid) {
            $w('#continue').enable();
        } else {
            $w('#continue').disable();
        }
        prevState = 'Start';
        if ($w('#schooleditButton').isVisible) {
            $w('#back, #continue').collapse();
        } else {
            $w('#back, #continue').expand();
        }
        break;
    case 'School':
        $w('#back, #continue').collapse();
        break;
    case 'PersonalInfo':
        $w('#continue').disable();
        prevState = 'Email';
        const firstName = localData?.firstName;
        const lastName = localData?.lastName;
        if (firstName) { $w('#personalInfoFirstName').value = firstName };
        if (lastName) { $w('#personalInfoLastName').value = lastName };
        if (firstName && lastName) { $w('#back, #continue').enable(); }
        $w('#back, #continue').expand();
        break;
    case 'Complete':
        $w('#continue, #back').collapse();
        /*
        if (roles.includes('Student')) {
            if (wixLocation.query.code) {
                wixLocation.to(`/join-class?code=${wixLocation.query.code}`);
            } else {
                wixLocation.to(`/join-class`);
            }
        } else if (roles.includes("Teacher")) {
            if (wixLocation.query.code) {
                wixLocation.to(`/join-organization?code=${wixLocation.query.code}`);
            } else {
                wixLocation.to(`/join-organization`);
            }
        }
        */
        break;
    case "Password":
        updatePasswordValidity(false);
        $w('#back, #continue').expand();
        prevState = 'Email';
        break;
    case "SchoolAsk":
        prevState = 'Role';
        $w('#back').expand();
        $w('#continue').collapse();
        break;
    case "Loading":
        $w('#continue, #back').collapse();
        break;
    case "AdminAsk":
        $w('#continue, #back').collapse();
        break;
    case "DistrictCreate":
        $w('#continue, #back').collapse();
        break;
    case "SchoolCreate":
        $w('#continue, #back').collapse();
        break;
    case 'ComingSoon':
        prevState = "Role";
        $w('#continue').collapse();
        $w('#back').expand();
        break;
    case 'ComingSoonFinished':
        $w('#continue, #back').collapse();
        break;
    }

}

import wixData from 'wix-data';

let prevSelectedValue = null;
let currIndex = -1;
let listSize;
const maxListSize = 5;
const HL_COLOR = 'rgb(90,90,90)';
const REG_COLOR = 'rgb(153,151,151)';
let page;

function filter(input) {
    if ($w('#schoolInput').value.length > 4) {
        $w('#schoolsDataset').setFilter(wixData.filter().contains('title', input).or(wixData.filter().contains('address.formatted', input)))
            .then(() => {
                /*
                $w("#schoolsDataset").getItems(0, 3).then((results) => {
                    $w('#schoolsRepeater').data = results.items.map(obj => ({ title: obj.title, address: obj.address, _id: obj._id }));
                });
                */
                let count = $w('#schoolsDataset').getTotalCount();
                if (count === 0) {
                    $w('#schoolsRepeater').collapse();
                } else {
                    $w('#schoolsRepeater').expand();
                }
            });
    } else {
        $w('#schoolsRepeater').collapse();
    }
}

export function schoolInput_input(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        filter($w('#schoolInput').value);
    }, 500);
}

export function schoolInput_keyPress(event) {
    listSize = $w('#schoolsRepeater').data.length;
    switch (event.key) {
    case 'Enter':
        if (currIndex !== -1) {
            $w('#schoolInput').value = $w('#schoolsRepeater').data[currIndex].title;
            schoolReadOnly();
        }
        break;
    case 'ArrowUp':
        if (currIndex > 0) {
            currIndex = currIndex - 1;
            refreshItemsColors();
            $w('#schoolInput').value = $w('#schoolsRepeater').data[currIndex].title;
        } else {
            currIndex = currIndex - 1;
            $w('#schoolInput').focus();
            $w('#container').background.src = 'https://static.wixstatic.com/media/2dcc6c_3ef08e60987b4f0aa963f1c0471e39f8~mv2.png';
        }
        break;
    case 'ArrowDown':
        if (currIndex < listSize - 1) {
            currIndex = currIndex + 1;
            refreshItemsColors();
            $w('#schoolInput').value = $w('#schoolsRepeater').data[currIndex].title;
        } else {
            currIndex = 0;
            $w('#schoolInput').value = $w('#schoolsRepeater').data[currIndex].title;
            $w('#schoolInput').focus();
            refreshItemsColors();
        }
        console.log(currIndex);
        break;
    case 'Escape':
        $w('#schoolInput').value = '';
        currIndex = -1;
        $w('#schoolsRepeater').collapse();
        break;
    }
}

function selectSchool(schoolId) {
    $w('#schoolInput').disable();
}

function refreshItemsColors() {
    $w('#schoolsRepeater').forEachItem(($item, itemData, index) => {
        if (index === currIndex) {
            $item('#container').background.src = 'https://static.wixstatic.com/media/2dcc6c_df6123451dd64254a1c485c53cc17e3e~mv2.png';
        } else {
            $item('#container').background.src = null;
        }
    });
}

export function schoolsRepeater_itemReady($item, itemData, index) {
    $item('#container').onClick((event, $w) => {
        $w('#schoolInput').value = itemData.title;
        console.log(itemData.address);
        schoolReadOnly();
    });
    $item('#container').onMouseIn((event, $w) => {
        $item('#container').background.src = 'https://static.wixstatic.com/media/2dcc6c_df6123451dd64254a1c485c53cc17e3e~mv2.png';
    });
    $item('#container').onMouseOut((event, $w) => {
        $item('#container').background.src = null;
    });
}

export function schooleditButton_click(event) {
    $w("#schoolInput").readOnly = false;
    $w('#schoolsRepeater').expand();
    $w('#schoolSearchIcon').show();
    $w('#schooleditButton').hide();
    $w('#back, #continue').collapse();
}

function schoolReadOnly() {
    $w("#schoolInput").readOnly = true;
    $w('#schoolsRepeater').collapse();
    $w('#schoolSearchIcon').hide();
    $w('#schooleditButton').show();
    $w('#back, #continue').expand();
}

async function updateRegistrationMemberStatus() {
    const member = {
        contactDetails: {
            customFields: {
                "custom.registration-status": {
                    value: "Complete"
                }
            }
        }
    }
    let prefs = {
        deletePhones: false
    }
    return updateData(member, prefs)
        .then((member) => {
            if (member.status === true) {
                return { status: true };
            } else {
                console.log(member.error);
                console.log(member.status);
                return { status: false };
            }
        })
        .catch((error) => {
            console.error('Error Updating Data - ' + error);
        })
}

export function schoolAskYes_click(event) {
    //if (wixLocation.query.code) {
    if (roles.includes("Teacher")) {
        if (wixLocation.query.code) {
            wixLocation.to(`/join-organization?code=${wixLocation.query.code}`);
        } else {
            wixLocation.to(`/join-organization`);
        }
    } else {
        if (wixLocation.query.code) {
            wixLocation.to(`/join-class?code=${wixLocation.query.code}`);
        } else {
            wixLocation.to(`/join-class`);
        }
    }
    //} else {
    //$w('#statebox').changeState('Complete');
    // }
}

export function schoolAskNo_click(event) {
    prevState = "SchoolAsk";
    $w('#statebox').changeState('Complete');
}

export function organizationAskYes_click(event) {
    roles.push("Administrator");
    assignRoleFunc().then(() => {
        prevState = "OrganizationAsk";
        $w('#statebox').changeState('OrganizationJoin');
    });
}

export function organizationAskNo_click(event) {
    $w('#statebox').changeState('OrganizationJoin');
}

export function adminAskSchool_click(event) {
    $w('#statebox').changeState('SchoolCreate');
}

export function adminAskDistrict_click(event) {
    $w('#statebox').changeState('DistrictCreate');
}

export function personalInfoFirstName_input(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        updatePersonalInfoValidity();
    }, 500);
}

export function personalInfoLastName_input(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        updatePersonalInfoValidity();
    }, 500);
}

export async function emailListSchoolBeta_click(event) {
    $w('#emailListSchoolBeta').disable();
    labelSchoolPlatformEmailList().then(() => {
        $w('#statebox').changeState('ComingSoonFinished');
    }).finally(() => {
        $w('#emailListSchoolBeta').enable();
    })
}

export function backtoRolesBtn_click(event) {
    $w('#statebox').changeState('Roles');
}

export function backtoHome_click(event) {
    wixWindow.openLightbox("Leave Confirmation", {
        "leaveLink": '/'
    })
}

function errorSetUp(error) {
    errorMessage = error;
    $w('#statebox').changeState('Error');
}

export function errorText_click(event) {
    wixWindow.openLightbox("Error Details", { "errorDetails": errorMessage });
}

export function alreadyHaveAccountTxt_click(event) {
    if (wixLocation.query.code) {
        wixWindow.openLightbox("Login Form", { "successUrl": '/' });
    } else {
        wixWindow.openLightbox("Login Form", { "successUrl": `/join-class?code=${wixLocation.query.code}` });
    }
}

export function emailAlreadyExists_click(event) {
    wixWindow.openLightbox("Login Form", { "successUrl": '/' });
}