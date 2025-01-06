// Copyrights (c) 2018 Chart,js Contributors is provided herein based on the MIT Cicense (MIT). This code includes features bearing an MIT License.

// The MIT License (MIT)

// Copyright (c) 2018 Chart.js Contributors
// Permission is hereby granted, free of charge, to any person obtaining a copy 
// of this software and associated documentation files (the "Software"), to deal 
// in the Software without restriction, including without limitation the rights 
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies 
// of the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all copies 
// or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
// INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
// IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, 
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import { formFactor, getBoundingRect } from 'wix-window';
import { timeline } from 'wix-animations';
import { generateError } from 'public/statusbox.js';
import wixLocation from 'wix-location';

let debounceTimer;

$w.onReady(async function () {
    setUpBreadcrumbs();
    loadParams();
    completeInterestCalculations();
});

async function setUpBreadcrumbs() {
    let breadcrumbItems = [];
    breadcrumbItems.push({ 'label': 'Resources', 'link': `/resources` }, { 'label': "Compound Interest Calculator", 'link': null, 'isCurrent': true });
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

function loadParams() {
    const query = wixLocation.query;
    if (query.principal) {
        $w('#principalInput').value = query.principal;
    }
    if (query.rate) {
        $w('#rateInput').value = Number(query.rate);
    }
    if (query.time) {
        $w('#timeInput').value = Number(query.time);
    }
    if (query.compoundFrequency) {
        $w('#compoundFrequencyInput').value = query.compoundFrequency;
    }
    if (query.showTotals) {
        $w('#stackBarChart').checked = true;
    }
    if (query.contributions) {
        if (query.contributionAmount) {
            $w('#contributionAmountInput').value = query.contributionAmount;
        }
        if (query.contributionFrequency) {
            $w('#contributionFrequencyInput').value = query.contributionFrequency;
        }
    } else {
        if (wixLocation.url.includes('?')) {
            $w('#contributionCheckbox').checked = false;
            $w('#contributionAmountInput, #contributionFrequencyInput').collapse();
        }
    }
}

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

function calculateInterest(principal, rate, time, compoundFrequency, contributionAmount, contributionFrequency) {
    console.log(principal + 'a' + rate + 'a' + time + 'a' + compoundFrequency + 'a' + contributionAmount + 'a' + contributionFrequency);
    principal = Number(principal);
    rate = Number(rate);
    contributionAmount = Number(contributionAmount);
    rate = rate / 100
    let intervals = [{ amount: principal, timePeriod: 0, year: "Now", interestTotal: 0, contributionTotal: 0 }];
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
    let amount = principal;
    for (let i = 1; i <= timeInDays; i++) {
        if (i % compoundPeriodDayLength === 0) {
            interestTotal += (principal + interestTotal + contributionTotal) * rate;
        }
        if (i % contributionPeriodDayLength === 0) {
            contributionTotal += contributionAmount
        }
        amount = principal + contributionTotal + interestTotal;
        if (i % 365 === 0) {
            intervals.push({ amount: amount, timePeriod: i, year: (i / 365).toString(), interestTotal: interestTotal, contributionTotal: contributionTotal })
        }
    }
    return {
        finalAmount: principal + interestTotal + contributionTotal,
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
    if ($w('#contributionCheckbox').checked) {
        if ($w('#principalInput, #rateInput #compoundFrequencyInput, #contributionAmountInput, #contributionFrequencyInput').valid) {
            result = calculateInterest($w('#principalInput').value, $w('#rateInput').value, $w('#timeInput').value, $w('#compoundFrequencyInput').value, $w('#contributionAmountInput').value, $w('#contributionFrequencyInput').value);
            computeInterest();
        } else {
            generateError('Please fill out all fields.');
        }
    } else {
        if ($w('#principalInput, #rateInput #compoundFrequencyInput').valid) {
            result = calculateInterest($w('#principalInput').value, $w('#rateInput').value, $w('#timeInput').value, $w('#compoundFrequencyInput').value);
            computeInterest();
        } else {
            generateError('Please fill out all fields.');
        }
    }

    function computeInterest() {
        const chartItems = result.intervals.map((obj) => { return { "label": obj.year.toString(), "data": obj.amount } })
        const labels = chartItems.map(item => item.label);
        const principalData = result.intervals.map(item => $w('#principalInput').value);
        const principalDataAlt = result.intervals.map(item => item.amount);
        const interestData = result.intervals.map(item => item.interestTotal);
        const contributionData = result.intervals.map(item => item.contributionTotal);
        $w('#principalTxt').text = 'principal: ' + formatter.format(Number($w('#principalInput').value));
        $w('#interestTxt').text = 'Interest: ' + formatter.format(result.finalInterest);
        $w('#descriptionTxt').text = `After ${$w('#timeInput').value.toString()} years, at an annual rate of ${$w('#rateInput').value.toString()}%, you would have ${formatter.format(result.finalAmount)}`;
        if ($w('#contributionCheckbox').checked) {
            $w('#contributionTxt').expand();
            $w('#contributionTxt').text = `Contributions: ${formatter.format(result.finalContributions)}`;
            if ($w('#stackBarChart').checked) {
                $w('#CustomElement1').setAttribute('chart-data', JSON.stringify({
                    labels,
                    datasets: [{ label: 'Total', data: principalDataAlt, backgroundColor: '#fec178' }]
                }));
            } else {
                $w('#CustomElement1').setAttribute('chart-data', JSON.stringify({
                    labels,
                    datasets: [{ label: 'Principal', data: principalData, backgroundColor: '#13c402' }, { label: 'Interest', data: interestData, backgroundColor: '#3bde2c' }, { label: 'Contributions', data: contributionData, backgroundColor: '#93e98c', borderRadius: 4 }]
                }));
            }
        } else {
            $w('#contributionTxt').collapse();
            if ($w('#stackBarChart').checked) {
                console.log(principalDataAlt);
                $w('#CustomElement1').setAttribute('chart-data', JSON.stringify({
                    labels,
                    datasets: [{ label: 'Total', data: principalDataAlt, backgroundColor: '#fec178' }]
                }));
            } else {
                $w('#CustomElement1').setAttribute('chart-data', JSON.stringify({
                    labels,
                    datasets: [{ label: 'Principal', data: principalData, backgroundColor: '#13c402' }, { label: 'Interest', data: interestData, backgroundColor: '#3bde2c', borderRadius: 4 }]
                }));
            }
        }
    }
}

export function contributionCheckbox_change(event) {
    if (event.target.checked) {
        wixLocation.queryParams.add({ "contributions": true });
        $w('#contributionAmountInput, #contributionFrequencyInput').expand();
    } else {
        wixLocation.queryParams.remove(["contributions"]);
        $w('#contributionAmountInput, #contributionFrequencyInput').collapse();
    }
    completeInterestCalculations();
}

export function principalInput_keyPress(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        wixLocation.queryParams.add({ "principal": event.target.value });
        if ($w('#contributionCheckbox').checked) {
            wixLocation.queryParams.add({ "contributions": true });
        }
        completeInterestCalculations();
    }, 500);
}

export function rateInput_keyPress(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        wixLocation.queryParams.add({ "rate": event.target.value });
        if ($w('#contributionCheckbox').checked) {
            wixLocation.queryParams.add({ "contributions": true });
        }
        completeInterestCalculations();
    }, 500);
}

export function compoundFrequencyInput_change(event) {
    wixLocation.queryParams.add({ "compoundFrequency": event.target.value });
    if ($w('#contributionCheckbox').checked) {
        wixLocation.queryParams.add({ "contributions": true });
    }
    completeInterestCalculations();
}

export function timeInput_change(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        wixLocation.queryParams.add({ "time": event.target.value });
        if ($w('#contributionCheckbox').checked) {
            wixLocation.queryParams.add({ "contributions": true });
        }
        completeInterestCalculations();
    }, 500);
}

export function contributionAmountInput_keyPress(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        wixLocation.queryParams.add({ "contributions": true });
        wixLocation.queryParams.add({ "contributionAmount": event.target.value });
        completeInterestCalculations();
    }, 500);
}

export function contributionFrequencyInput_change(event) {
    wixLocation.queryParams.add({ "contributions": true });
    wixLocation.queryParams.add({ "contributionFrequency": event.target.value });
    completeInterestCalculations();
}

export function stackBarChart_change(event) {
    if (event.target.checked) {
        wixLocation.queryParams.add({ "showTotals": true });
    } else {
        wixLocation.queryParams.remove(["showTotals"]);
    }
    completeInterestCalculations();
}