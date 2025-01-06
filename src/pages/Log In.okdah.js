import { getAuthUrl } from '@prospectorminerals/google-oauth-sso';
import wixLocation from 'wix-location';
//import wixData from 'wix-data';
import wixUsers from 'wix-users';
//import wixWindow from 'wix-window';
import { session } from 'wix-storage';
import { getFBAuthUrl } from 'backend/facebook-login.jsw';

let twofastatus;
let twofachannel;

export function googleLogin_click(event) {
	    $w('#googleLogin').disable();
        getAuthUrl()
            .then((url) => {
              session.setItem("landingPage", wixLocation.url);
              wixLocation.to(url);
            })
           .catch((error) => {
                console.log(error);
            });
}

export function facebookLogin_click(event) {
  $w('#facebookLogin').disable();
  getFBAuthUrl()
  .then((url) => {
    session.setItem("landingPage", wixLocation.url);
    wixLocation.to(url);
  })
}

export function submit_click(event) {
  directLogin();
}

export function forgotPassword_click(event) {
	wixUsers.promptForgotPassword();
}

export function resend_click(event) {
	sendverification();
}

export function email_keyPress(event) {
  if(event.key === "Enter"){
    submit_click();
  }
}

export function password_keyPress(event) {
  if(event.key === "Enter"){
    submit_click();
  }
}

function directLogin(){
if ($w('#email').valid && $w('#password').valid) {
	let email = $w("#email").value;
	let password = $w("#password").value;
	wixUsers.login(email, password)
  		.then( () => {
    	console.log("User is logged in");
      refreshPage();
  	} )
  .catch( (err) => {
    console.log(err)
    if (err.details.errorCode === '-19976'){
      $w('#errorTxt').text = 'Incorrect Email or Password.';
    	$w('#errorTxt').show();
    } else {  
      console.log(err.details.errorCode);
      $w('#errorTxt').text = 'There was an error logging in.'
      $w('#errorTxt').show();
    }
  } );
  } else {
    updateValidity();
  }
}

function updateValidity() {
  $w('#errorTxt').text = 'Please fill out all required fields.';
  $w('#errorTxt').show();
  $w("TextInput").updateValidityIndication();  
}

function refreshPage() {
  setTimeout(() => {
    if(wixLocation.path[0]){
      wixLocation.to(wixLocation.url);
    }
  }, 100);
}