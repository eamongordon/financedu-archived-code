import wixLocation from 'wix-location';
import { createMyPayment } from 'backend/pay';
import wixPay from 'wix-pay';
import { getCountries } from 'public/countries.js'
import wixWindow from 'wix-window';
import { local } from 'wix-storage';
import { authentication } from 'wix-members';

let prevSelectedValueMenu;
let prevSelectedValue;
let donationAmount;
let firstName;
let lastName;

$w.onReady(async function () {
    prevSelectedValue = "One Time";
    $w('#menuselectiontags').value = ["One Time"];
    setUpCountryDropdown();
});

export function checkout_click(event) {
    /*
  startCheckout($w('#donationfield).value);
	*/
}
/*
export function checkout_click(event) {
	getAccess()
	.then( (tok) => {
		if(tok.access_token) {
			let token = tok.access_token;
			let item = 'Donation to Financedu';
			let amount = Number($w("#donationfield").value);
			order(token, item, amount)
			.then( (response) => {
				if(response.id) {
					let url = response.links[1].href;
					wixLocation.to(`${url}`);
				} else {
					console.log(response);
				}
			});
		} else {
			console.log(tok);
		}
	});
}
*/

async function startCheckout(amount, userInfo) {
    createMyPayment(amount, userInfo)
        .then((payment) => {
            wixPay.startPayment(payment.id, { "skipUserInfoPage": true }).then((result) => {
                if (result.status === 'Successful' || result.status === "Pending") {
                    wixLocation.to('/thankyou');
                } else {

                }
            })
        });
}

export function donationselectionTags_change(event) {
    // Prevent deselecting the only selected tag. Radio buttons do not allow it so tags shouldn't either.
    if (!event.target.value || event.target.value.length === 0) {
        // Re-apply the previously selected tag.
        event.target.value = [prevSelectedValueMenu];
        // Replace the previously selected tag with the newly selected one.
    } else {
        // Note: Array.filter() was added in ES7. Only works in some browsers.
        event.target.value = event.target.value.filter(x => x !== prevSelectedValueMenu);
        prevSelectedValueMenu = event.target.value[0];
    }
    const selectedvalue = $w('#donationselectionTags').value[0];
    if (selectedvalue === 'Other') {
        $w('#dollarSignTxt, #customdonationField').expand();
    } else {
        donationAmount = selectedvalue;
        $w('#dollarSignTxt, #customdonationField').collapse();
    }
}

export function menuselectiontags_change(event) {
    // Prevent deselecting the only selected tag. Radio buttons do not allow it so tags shouldn't either.
    if (!event.target.value || event.target.value.length === 0) {
        // Re-apply the previously selected tag.
        event.target.value = [prevSelectedValue];
        // Replace the previously selected tag with the newly selected one.
    } else {
        // Note: Array.filter() was added in ES7. Only works in some browsers.
        event.target.value = event.target.value.filter(x => x !== prevSelectedValue);
        prevSelectedValue = event.target.value[0];
    }
    const selectedvalue = $w('#menuselectiontags').value[0];
    const oneTimeAmounts = [{ "value": "25", "label": "$25" }, { "value": "50", "label": "$50" }, { "value": "75", "label": "$75" }, { "value": "100", "label": "$100" }, { "value": "250", "label": "$250" }, { "value": "Other", "label": "Other" }];
    const monthlyAmounts = [{ "value": "10", "label": "$10" }, { "value": "15", "label": "$15" }, { "value": "20", "label": "$25" }, { "value": "40", "label": "$40" }, { "value": "50", "label": "$50" }, { "value": "Other", "label": "Other" }];
    const yearlyAmounts = [{ "value": "25", "label": "$25" }, { "value": "50", "label": "$50" }, { "value": "75", "label": "$75" }, { "value": "100", "label": "$100" }, { "value": "250", "label": "$250" }, { "value": "Other", "label": "Other" }];
    if (selectedvalue === 'One Time') {
        $w('#donationselectionTags').options = oneTimeAmounts;
        $w('#menuselectiontags').options = [{ "value": "One Time", "label": "✓ One Time" }, { "value": "Monthly", "label": "Monthly" }, { "value": "Yearly", "label": "Yearly" }];
    } else if (selectedvalue === 'Monthly') {
        $w('#donationselectionTags').options = monthlyAmounts;
        $w('#menuselectiontags').options = [{ "value": "One Time", "label": "One Time" }, { "value": "Monthly", "label": "✓ Monthly" }, { "value": "Yearly", "label": "Yearly" }];
    } else if (selectedvalue === 'Yearly') {
        $w('#donationselectionTags').options = yearlyAmounts;
        $w('#menuselectiontags').options = [{ "value": "One Time", "label": "One Time" }, { "value": "Monthly", "label": "Monthly" }, { "value": "Yearly", "label": "✓ Yearly" }];
    }
}

function oneTimeDonation() {
    if (!donationAmount) {
        donationAmount = $w('#customdonationField').value;
    }
    const namearray = $w('#nameInput').value.split(" ");
    firstName = namearray[0];
    if (namearray.length > 1) {
        lastName = namearray[1]
    } else {
        lastName = null;
    }
    let userInfo = {
        "firstName": firstName,
        "lastName": lastName,
        "email": $w('#emailInput').value,
        "phone": null,
        "countryCode": "USA"
    }
    startCheckout(donationAmount, userInfo);
}

async function setUpCountryDropdown() {
    let coutrylist = await getCountries();
    $w('#countryInput').options = coutrylist.map(country => ({ label: country.name, value: country.let3 }));
    $w('#countryInput').value = "USA";
}

export function donate_click(event) {
    if ($w('#nameInput').valid && $w('#emailInput').valid && $w('#donationselectionTags').valid && $w('#countryInput').valid) {
        if ($w('#menuselectiontags').value[0] === 'One Time') {
            oneTimeDonation();
        } else {
            recurringDonation();
        }
    } else {
        $w('#nameInput, #emailInput, #donationselectionTags, #countryInput').updateValidityIndication();
    }
}

function recurringDonation() {
    local.setItem("RecurringDonationFrequency", $w('#menuselectiontags').value[0]);
    local.setItem("RecurringDonationAmount", $w('#donationselectionTags').value[0]);
    if (authentication.loggedIn()) {
        wixLocation.to('/recurring-donations-confirm');
    } else {
        const namearray = $w('#nameInput').value.split(" ");
        firstName = namearray[0];
        if (namearray.length > 1) {
            lastName = namearray[1]
        } else {
            lastName = null;
        }
        wixWindow.openLightbox("Donor Registration", { "firstName": firstName, "lastName": lastName });
    }
}