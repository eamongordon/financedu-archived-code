import { generateRandom } from 'public/util.js';
import { formFactor, getBoundingRect } from 'wix-window';
import { timeline } from 'wix-animations';

let debounceTimer;

$w.onReady(function () {
    setUpBreadcrumbs();
});

async function setUpBreadcrumbs() {
    let breadcrumbItems = [];
    breadcrumbItems.push({ 'label': 'Resources', 'link': `/resources` }, { 'label': "Budgeting Tool", 'link': null, 'isCurrent': true });
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

/**
*	Adds an event handler that runs when an input element's value
 is changed.
	[Read more](https://www.wix.com/corvid/reference/$w.ValueMixin.html#onChange)
*	 @param {$w.Event} event
*/
export function switch_change(event) {
    let $item = $w.at(event.context);
    if (event.target.checked) {
        $item('#labelTxt').html = `<h5 class="wixui-rich-text__text" style="font-size:20px;"><span style="color:#4BDB7B;" class="wixui-rich-text__text">Revenue</span></h5>`;
    } else {
        $item('#labelTxt').html = `<h5 class="wixui-rich-text__text" style="font-size:20px;"><span style="color:#FF5454;" class="wixui-rich-text__text">Expense</span></h5>`;
    }
    calculateBudget();
}

function calculateBudget() {
    let totalRevenue = 0;
    let totalExpenses = 0;
    let USDollar = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });
    $w('#itemRepeater').forEachItem(($item, itemData, index) => {
        if ($item('#switch').checked) {
            if ($item('#amountInput').value) {
                totalRevenue += Number($item('#amountInput').value);
            }
        } else {
            if ($item('#amountInput').value) {
                totalExpenses += Number($item('#amountInput').value);
            }
        }
    });
    $w('#totalRevenueTxt').text = `Total Revenue: ${USDollar.format(totalRevenue)}`;
    $w('#totalExpensesTxt').text = `Total Expenses: ${USDollar.format(totalExpenses)}`;
    let prefix;
    if (totalRevenue - totalExpenses > 0) {
        prefix = '+'
    } else {
        prefix = ''
    }
    $w('#netTxt').text = `${prefix}${USDollar.format(totalRevenue - totalExpenses)}`;
}

/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/
export function deleteItem_click(event) {
    const matchingIndex = $w('#itemRepeater').data.findIndex((obj) => obj.value === event.context.itemId);
    let repeaterData = $w('#itemRepeater').data;
    repeaterData.splice(matchingIndex, 1);
    $w('#itemRepeater').data = repeaterData;
    calculateBudget();
}

export function addItem_click(event) {
    let repeaterData = $w('#itemRepeater').data;
    repeaterData.push({ '_id': generateRandom(8) });
    $w('#itemRepeater').data = repeaterData;
}

export function amountInput_keyPress(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        calculateBudget();
    }, 500);
}