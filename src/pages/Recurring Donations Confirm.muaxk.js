import { local } from 'wix-storage';
import { checkPricingPlans } from 'backend/recurringdonations.jsw';
import { checkout } from 'wix-pricing-plans';
import wixLocation from 'wix-location';

let prevSelectedValue = 'Yearly';
let prevSelectedValueMenu;
let donationAmount;
let donationFrequency;

$w.onReady(async function () {
    $w('#menuselectiontags').value = [prevSelectedValue];
    donationAmount = local.getItem("RecurringDonationAmount");
	$w('#donationselectionTags').value = [donationAmount];
    donationFrequency = local.getItem("RecurringDonationFrequency");
    $w('#confirmtext').text = '$ ' + donationAmount + ' ' + donationFrequency;
    $w('#statebox').changeState('Confirm');
});

export function editDonation_click(event) {
    //if ($w('#statebox').currentState.id === 'Confirm'){
    $w('#statebox').changeState('Edit');
    /*
		$w('#editDonation').label = 'Save';
		$w('#editDonation').style.backgroundColor = '3BDE2C';
		
	} else {
		$w('#statebox').changeState('Confirm');
		/*
		$w('#editDonation').label = 'Edit Donation';
		$w('#editDonation').style.backgroundColor = 'FFFFFF';	
		*/
    //}
}

export function save_click(event) {
    if ($w('#donationselectionTags').valid) {
        donationFrequency = $w('#menuselectiontags').value[0];
        if (!donationAmount) {
            donationAmount = $w('#customdonationField').value;
        }
        $w('#confirmtext').text = '$ ' + donationAmount + ' ' + donationFrequency;
        local.setItem("RecurringDonationAmount", donationAmount);
        local.setItem("RecurringDonationFrequency", donationFrequency);
        $w('#statebox').changeState('Confirm');
    } else {
        $w('#donationselectionTags').updateValidityIndication();
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
    const monthlyAmounts = [{ "value": "10", "label": "$10" }, { "value": "15", "label": "$15" }, { "value": "20", "label": "$25" }, { "value": "40", "label": "$40" }, { "value": "50", "label": "$50" }, { "value": "Other", "label": "Other" }];
    const yearlyAmounts = [{ "value": "25", "label": "$25" }, { "value": "50", "label": "$50" }, { "value": "75", "label": "$75" }, { "value": "100", "label": "$100" }, { "value": "250", "label": "$250" }, { "value": "Other", "label": "Other" }];
    if (selectedvalue === 'Monthly') {
        $w('#donationselectionTags').options = monthlyAmounts;
        $w('#menuselectiontags').options = [{ "value": "Monthly", "label": "✓ Monthly" }, { "value": "Yearly", "label": "Yearly" }];
    } else if (selectedvalue === 'Yearly') {
        $w('#donationselectionTags').options = yearlyAmounts;
        $w('#menuselectiontags').options = [{ "value": "Monthly", "label": "Monthly" }, { "value": "Yearly", "label": "✓ Yearly" }];
    }
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

async function payDonation(rawamount, rawfrequency) {
    let amount;
    let frequency;
    amount = Number(rawamount);
    frequency = rawfrequency;
	checkPricingPlans(amount, frequency).then( (results) => {
		const planId = results.id;
		checkout.createOnlineOrder(planId).then( () => {
			wixLocation.to('/thankyou');
		});
	});
}

export function confirmandPay_click(event) {
	payDonation(donationAmount, donationFrequency);
}