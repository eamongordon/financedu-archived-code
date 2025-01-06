import wixWindow from 'wix-window';
import { checkMember, registerNewUser, assignRole } from 'backend/memberFunctions/members.jsw';
import { generateParentInvite, createChildAccount } from 'backend/memberFunctions/parentInvites.jsw';
import { currentMember } from 'wix-members';

let prevState;
let debounceTimer;

const received = wixWindow.lightbox.getContext();

$w.onReady(async function () {
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
});

export function accountEmailInput_input(event) {
    $w('#emailAlreadyExists').hide();
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        if ($w('#accountEmailInput').valid) {
            $w('#continue').enable();
        } else {
            $w('#continue').disable();
            $w('#accountEmailInput').updateValidityIndication();
        }
    }, 500);
}

export function inviteEmailInput_input(event) {
    $w('#emailNoExist').hide();
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        if ($w('#inviteEmailInput').valid) {
            $w('#continue').enable();
        } else {
            $w('#continue').disable();
            $w('#inviteEmailInput').updateValidityIndication();
        }
    }, 500);
}

export function continue_click(event) {
    switch ($w('#statebox').currentState.id) {
    case 'AccountAsk':
        if ($w('#accountAskRadioGroup').value === 'Yes') {
            $w('#continue').disable();
            $w('#statebox').changeState('InviteChild');
        } else {
            $w('#statebox').changeState('AccountName');
        }
        break;
    case 'AccountName':
        if ($w('#firstNameInput, #lastNameInput').valid) {
            $w('#statebox').changeState('AccountEmail');
        } else {
            $w('#firstNameInput, #lastNameInput').updateValidityIndication();
        }
        break;
    case 'AccountEmail':
        if ($w('#accountEmailInput').valid) {
            $w('#statebox').changeState('Loading');
            checkMember($w('#accountEmailInput').value).then((res) => {
                if (res.results === true) {
                    $w('#continue').disable();
                    $w('#emailAlreadyExists').show();
                    $w('#statebox').changeState('AccountEmail');
                } else {
                    $w('#statebox').changeState('AccountPassword');
                }
            }).catch((error) => {
                errorSetup();
                console.log(error);
            })
        } else {
            $w('#accountEmailInput').updateValidityIndication();
        }
        break;
    case 'AccountPassword':
        if ($w('#passwordPasswordConfirm').valid && $w('#passwordPasswordInput').valid) {
            $w('#statebox').changeState('Loading');
            $w('#loadingText').expand();
            const options = {
                contactDetails: {
                    firstName: $w('#firstNameInput').value,
                    lastName: $w('#lastNameInput').value
                }
            }
            createChildAccount($w('#accountEmailInput').value, $w('#passwordPasswordConfirm').value, options).then(() => {
                $w('#statebox').changeState('AccountSuccess');
            }).catch((error) => {
                console.log(error);
                errorSetup();
            })
        } else {
            setTimeout(() => {
                if ($w('#passwordPasswordConfirm').value !== $w('#passwordPasswordInput').value) {
                    $w("#passwordNotMatch").show();
                }
            }, 1000);
            $w('#passwordPasswordInput, #password').updateValidityIndication();
        }
        break;
    case 'InviteChild':
        if ($w('#inviteEmailInput').valid) {
            $w('#statebox').changeState('Loading');
            $w('#loadingText').expand();
            checkMember($w('#inviteEmailInput').value).then(async function (res) {
                if (res.results === true) {
                    generateParentInvite($w('#inviteEmailInput').value).then(() => {
                        $w('#statebox').changeState('InviteSuccess');
                    }).catch((error) => {
                        errorSetup();
                        console.log(error);
                    });
                } else {
                    $w('#emailNoExist').show();
                    $w('#continue').disable();
                }
            });
        } else {
            $w('#inviteEmailInput').updateValidityIndication();
        }
    }
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
    if ($w('#firstNameInput').valid && $w('#lastNameInput').valid) {
        $w('#continue').enable();
    } else {
        $w('#continue').disable();
    }
}

export function firstNameInput_input(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        updatePersonalInfoValidity();
    }, 500);
}

export function lastNameInput_input(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        updatePersonalInfoValidity();
    }, 500);
}

async function errorSetup() {
    $w('#statebox').changeState('Error');
    $w('#back, #continue').collapse();
}

export function back_click(event) {
    $w('#statebox').changeState(prevState);
}

export function statebox_change(event) {
    setUpStates(event.target.currentState.id);
}

async function setUpStates(state) {
    switch (state) {
    case 'Loading':
        $w('#continue, #back').collapse();
        break;
    case 'AccountAsk':
        if ($w('#accountAskRadioGroup').value) {
            $w('#continue').enable();
        }
        $w('#back').collapse();
        break;
    case 'AccountName':
        prevState = "AccountAsk";
        if ($w('#firstNameInput, #lastNameInput').valid) {
            $w('#continue').enable();
        } else {
            $w('#continue').disable();
        }
        $w('#continue, #back').expand();
        break;
    case 'AccountEmail':
        prevState = "AccountName";
        if ($w('#accountEmailInput').valid) {
            $w('#continue').enable();
        } else {
            $w('#continue').disable();
        }
        $w('#continue, #back').expand();
        break;
    case 'AccountPassword':
        prevState = "AccountEmail";
        if ($w('#passwordPasswordInput, #passwordPasswordConfirm').valid && $w('#passwordPasswordInput').value === $w('#passwordPasswordConfirm').value) {
            $w('#continue').enable();
        } else {
            $w('#continue').disable();
        }
        $w('#continue, #back').expand();
        break;
    case 'AccountSuccess':
        $w('#continue, #back').collapse();
        break;
    case 'InviteChild':
        prevState = "AccountAsk";
        $w('#continue, #back').expand();
        break;
    case 'InviteSuccess':
        $w('#continue, #back').collapse();
        break;
    }

}

export function accountAskRadioGroup_change(event) {
    $w('#continue').enable();
}

export function emailNoExist_click(event) {
    $w('#accountEmailInput').value = $w('#inviteEmailInput').value;
    $w('#statebox').changeState('AccountEmail');
}

export function emailAlreadyExists_click(event) {
    $w('#inviteEmailInput').value = $w('#accountEmailInput').value;
    $w('#statebox').changeState('InviteChild');
    $w('#continue').enable();
}

export function accountSuccessClose_click(event) {
    wixWindow.lightbox.close();
}

export function inviteSuccessClose_click(event) {
    wixWindow.lightbox.close();
}