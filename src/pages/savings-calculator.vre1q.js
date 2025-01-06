import { generateError } from 'public/statusbox.js';
import { formFactor, getBoundingRect } from 'wix-window';
import { timeline } from 'wix-animations';

let debounceTimer;

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

$w.onReady(function () {
    completeInterestCalculations();
	setUpBreadcrumbs();
});

async function setUpBreadcrumbs() {
    let breadcrumbItems = [];
    breadcrumbItems.push({ 'label': 'Resources', 'link': `/resources` }, { 'label': "Savings Calculator", 'link': null, 'isCurrent': true });
    $w('#breadcrumbs').items = breadcrumbItems;
    if (formFactor === 'Mobile') {
        $w('#breadcrumbs').show();
    } else {
        const timelineBreadcrumbs = timeline();
        const windowInfo = await getBoundingRect();
        let xOffset = -(windowInfo.window.width - 980) / 2 + ((windowInfo.window.width - 980) * 0.16);
        timelineBreadcrumbs.add($w('#breadcrumbs'), [{ "x": xOffset, "duration": 10 }]).play().onComplete(async () => {
            await $w('#breadcrumbs').show();
        });
    }
}

function calculateSavings(amount, principle, rate, timeframe, timeYears) {
    let timeDivisor;
    if (timeframe === 'Yearly') {
        timeDivisor = 1;
    } else if (timeframe === 'Monthly') {
        timeDivisor = 12;
    } else if (timeframe === 'Weekly') {
        timeDivisor = 52;
    } else if (timeframe === 'Daily') {
        timeDivisor = 365;
    }
    let adjRate = rate / timeDivisor;
    let adjTimeUnits = timeYears * timeDivisor;
    const contribution = (adjRate * (amount - principle * Math.pow(1 + adjRate, adjTimeUnits))) / (Math.pow(adjRate + 1, adjTimeUnits) - 1)
    const adjContribution = contribution;
    return adjContribution;
}

function calculateInterest(principle, rate, time, compoundFrequency, contributionAmount, contributionFrequency) {
    console.log(principle + 'a' + rate + 'a' + time + 'a' + compoundFrequency + 'a' + contributionAmount + 'a' + contributionFrequency);
    principle = Number(principle);
    rate = Number(rate);
    contributionAmount = Number(contributionAmount);
    rate = rate / 100
    let intervals = [{ amount: principle, timePeriod: 0, year: "Now", interestTotal: 0, contributionTotal: 0 }];
    let compoundPeriodDayLength;
    switch (compoundFrequency) {
    case 'Yearly':
        compoundPeriodDayLength = 365;
        break;
    case 'Monthly':
        rate = rate / 12;
        compoundPeriodDayLength = 30;
        break;
    case 'Weekly':
        rate = rate / 52;
        compoundPeriodDayLength = 7;
        break;
    case 'Daily':
        rate = rate / 365;
        compoundPeriodDayLength = 1;
        break;
    }
    let contributionPeriodDayLength;
    switch (contributionFrequency) {
    case 'Yearly':
        contributionPeriodDayLength = 365;
        break;
    case 'Monthly':
        contributionPeriodDayLength = 30;
        break;
    case 'Weekly':
        contributionPeriodDayLength = 7;
        break;
    case 'Daily':
        contributionPeriodDayLength = 1;
        break;
    }
    const timeInDays = time * 365;
    let contributionTotal = 0;
    let interestTotal = 0;
    for (let i = 1; i <= timeInDays; i++) {
        if (i % compoundPeriodDayLength === 0) {
            interestTotal += (principle + interestTotal + contributionTotal) * rate;
        }
        if (i % contributionPeriodDayLength === 0) {
            contributionTotal += contributionAmount
        }
        if (i % 365 === 0) {
            intervals.push({ amount: principle, timePeriod: i, year: (i / 365).toString(), interestTotal: interestTotal, contributionTotal: contributionTotal })
        }
    }
    return {
        finalAmount: principle + interestTotal + contributionTotal,
        finalInterest: interestTotal,
        finalContributions: contributionTotal,
        intervals: intervals
    }
}

/*
export function calculateButton_click(event) {
    completeInterestCalculations();
}
*/

function completeInterestCalculations() {
    let result;
	let contribution;
    if ($w('#principleInput, #rateInput #compoundFrequencyInput').valid) {
        contribution = calculateSavings($w('#goalInput').value, $w('#principleInput').value, $w('#rateInput').value / 100, $w('#compoundFrequencyInput').value, $w('#timeInput').value);
        result = calculateInterest($w('#principleInput').value, $w('#rateInput').value, $w('#timeInput').value, $w('#compoundFrequencyInput').value, contribution, $w('#compoundFrequencyInput').value);
        computeInterest();
    } else {
        generateError('Please fill out all fields.');
    }

    function computeInterest() {
        const chartItems = result.intervals.map((obj) => { return { "label": obj.year.toString(), "data": obj.amount } })
        const labels = chartItems.map(item => item.label);
        const principleData = result.intervals.map(item => $w('#principleInput').value);
        const interestData = result.intervals.map(item => item.interestTotal);
        const contributionData = result.intervals.map(item => item.contributionTotal);
        $w('#principleTxt').text = 'Principle: ' + formatter.format(Number($w('#principleInput').value));
        $w('#interestTxt').text = 'Interest: ' + formatter.format(result.finalInterest);
		$w('#descriptionTxt').html = `<h4 class="wixui-rich-text__text" style="font-size:24px;"><span style="font-size:24px;" class="wixui-rich-text__text">You would need to ${(contribution < 0)? 'withdraw' : 'contribute'} ${formatter.format(Math.abs(contribution))} <i><b>${$w('#compoundFrequencyInput').value.toLowerCase()}</b></i> for ${$w('#timeInput').value.toString()} years to have ${formatter.format($w('#goalInput').value)}.</span></h4>`;
        //$w('#descriptionTxt').text = `You would need to contribute ${formatter.format(contribution)} ${$w('#compoundFrequencyInput').value.toLowerCase()} for ${$w('#timeInput').value.toString()} years to make ${formatter.format($w('#goalInput').value)}`;
        $w('#contributionTxt').expand();
        $w('#contributionTxt').text = `Contributions: ${formatter.format(result.finalContributions)}`;
        $w('#CustomElement1').setAttribute('chart-data', JSON.stringify({
            labels,
            datasets: [{ label: 'Principle', data: principleData, backgroundColor: '#FF7105' }, { label: 'Interest', data: interestData, backgroundColor: '#FF8F05' }, { label: 'Contributions', data: contributionData, backgroundColor: '#FEC178', borderRadius: 4 }]
        }));
    }
}

export function timeInput_change(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
		completeInterestCalculations();
	}, 500);
}

export function goalInput_keyPress(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        completeInterestCalculations();
    }, 500);
}

export function principleInput_keyPress(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        completeInterestCalculations();
    }, 500);
}

export function rateInput_change(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        completeInterestCalculations();
    }, 500);
}

export function compoundFrequencyInput_change(event) {
    completeInterestCalculations();
}