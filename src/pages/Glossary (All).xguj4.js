import wixData from 'wix-data';
import { formFactor } from 'wix-window-frontend';

let allData;
let savedLetters = [];

let debounceTimer;
let lastFilterTitle;
let lastFilterTags;

$w.onReady(async function () {
    allData = await $w('#dynamicDataset').getItems(0, 1000);
    let allSelectionTagsArray = [];
    allData.items.forEach((obj) => {
        allSelectionTagsArray = allSelectionTagsArray.concat(obj.tags);
    })
    let filteredSelectionTagsArray = [...new Set(allSelectionTagsArray)];
    $w('#selectionTags').options = filteredSelectionTagsArray.map(function (label) {
        return {
            "value": label,
            "label": label
        }
    });
    /*
    if (formFactor === 'Mobile') {
        $w('#lessonsTable').columns = [{
            "id": "column_1",
            "dataPath": "field1",
            "label": "Field 1",
            "width": 100,
            "visible": true,
            "type": "string",
            "linkPath": "link-field-or-property"
        }]
    }
    */
    $w('#glossaryRepeater').forEachItem(($item, itemData, index) => {
        let rows = [];
        savedLetters.push($item('#titleTxt').text);
        const filteredData = allData.items.filter((obj) => obj.title.split('')[0].toUpperCase() === $item('#titleTxt').text);
        filteredData.forEach((item, index, array) => {
            const title = array[index].title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
            let rowObj = {
                column_1: `<a href="/glossary/${title}" target="_self">${array[index].title}</a><br />`
            };
            if (formFactor === 'Mobile') {
                rows.push(rowObj);
            } else {
                if (index === 0 || (index + 1) % 4 === 0) {
                    const openingHtml = `<h5 style="font-size:20px;"><span class="color_33"><span style="font-size:20px;">`;
                    const closingHtml = `</span></span></h5>`;
                    if (array.length > index + 1) {
                        const title = array[index + 1].title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                        rowObj.column_2 = `<a href="/glossary/${title}" target="_self">${array[index + 1].title}</a><br />`
                    }
                    if (array.length > index + 2) {
                        const title = array[index + 2].title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                        rowObj.column_3 = `<a href="/glossary/${title} target="_self"">${array[index + 2].title}</a><br />`
                    }
                    if (array.length > index + 3) {
                        const title = array[index + 3].title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                        rowObj.column_4 = `<a href="/glossary/${title} target="_self"">${array[index + 3].title}</a><br />`
                    }
                    rows.push(rowObj);
                }
            }
        });
        $item('#lessonsTable').rows = rows;
    })
});

export function selectionTagsLetter_change(event) {
    $w('#glossaryRepeater').forEachItem(($item, itemData, index) => {
        if ($item('#titleTxt').text === event.target.value[0]) {
            $item('#container').scrollTo();
        }
    });
    $w('#selectionTagsLetter').value = [];
}

export function sortButton_click(event) {
    if ($w('#statebox').collapsed || $w('#statebox').currentState.id !== 'Sort') {
        $w('#statebox').changeState('Sort');
        $w('#statebox').expand();
    } else {
        $w('#statebox').collapse();
    }
}

export function termInput_keyPress(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        filter(event.target.value, lastFilterTags);
    }, 500);
}

export async function glossaryRepeater_itemReady($item, itemData, index) {
    $item('#titleTxt').text = itemData.letter;
    let rows = [];
    //allData = await $w('#dynamicDataset').getItems(0, 1000);
    const filteredData = allData.items.filter((obj) => obj.title.split('')[0].toUpperCase() === $item('#titleTxt').text);
    filteredData.forEach((item, index, array) => {
        const title = array[index].title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        let rowObj = {
            column_1: `<a href="/glossary/${title}" target="_self">${array[index].title}</a><br />`
        };
        if (formFactor === 'Mobile') {
            rows.push(rowObj);
        } else {
            if (index === 0 || (index + 1) % 4 === 0) {
                const openingHtml = `<h5 style="font-size:20px;"><span class="color_33"><span style="font-size:20px;">`;
                const closingHtml = `</span></span></h5>`;
                if (array.length > index + 1) {
                    const title = array[index + 1].title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                    rowObj.column_2 = `<a href="/glossary/${title}" target="_self">${array[index + 1].title}</a><br />`
                }
                if (array.length > index + 2) {
                    const title = array[index + 2].title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                    rowObj.column_3 = `<a href="/glossary/${title} target="_self"">${array[index + 2].title}</a><br />`
                }
                if (array.length > index + 3) {
                    const title = array[index + 3].title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                    rowObj.column_4 = `<a href="/glossary/${title} target="_self"">${array[index + 3].title}</a><br />`
                }
                rows.push(rowObj);
            }
        }
    });
    $item('#lessonsTable').rows = rows;
}

function filter(title, tags) {
    if (lastFilterTitle !== title || lastFilterTags !== tags) {
        let newFilter = wixData.filter();
        if (title)
            newFilter = newFilter.contains('title', title)
            .or(newFilter.contains("description", title));
        if (tags)
            newFilter = newFilter.hasSome('tags', tags)
        $w('#dynamicDataset').setFilter(newFilter).then(async () => {
            let nonEmptyLetters = [];
            allData = await $w('#dynamicDataset').getItems(0, 1000);
            savedLetters.forEach((value) => {
                const filteredData = allData.items.filter((obj) => obj.title.split('')[0].toUpperCase() === value);
                if (filteredData.length > 0) {
                    nonEmptyLetters.push(value);
                }
            });
            $w('#glossaryRepeater').data = [];
            $w('#glossaryRepeater').data = nonEmptyLetters.map((value) => {
                return {
                    "_id": value + 'A',
                    "letter": value
                }
            });
            console.log($w('#glossaryRepeater').data);
        });
        lastFilterTitle = title;
        lastFilterTags = tags;
    }
}

export function sortDropdown_change(event) {
    sortDataset();
}

function sortDataset() {
    let sort = wixData.sort();
    let sortValue = $w('#sortDropdown').value;
    switch (sortValue) {
    case 'newestFirst':
        // Sort the products by their name: A - Z
        $w('#glossaryRepeater').data = savedLetters.map((value) => {
            return {
                "_id": value + 'A',
                "letter": value
            }
        });
        sort = sort.descending('_createdDate');
        break;

    case 'lastUpdatedFirst':
        $w('#glossaryRepeater').data = savedLetters.map((value) => {
            return {
                "_id": value + 'A',
                "letter": value
            }
        });
        sort = sort.descending('_updatedDate');
        break;

    case 'a-z':
        // Sort the products by their name: A - Z
        $w('#glossaryRepeater').data = savedLetters.map((value) => {
            return {
                "_id": value + 'A',
                "letter": value
            }
        });
        sort = sort.ascending('title');
        break;

    case 'z-a':
        // Sort the products by their name: Z - A
        $w('#glossaryRepeater').data = [...savedLetters].reverse().map((value) => {
            return {
                "_id": value + 'A',
                "letter": value
            }
        });
        sort = sort.descending('title');
        break;
    }

    $w('#dynamicDataset').setSort(sort);

}

export function filterButton_click(event) {
    if ($w('#statebox').collapsed || $w('#statebox').currentState.id !== 'Filter') {
        $w('#statebox').changeState('Filter');
        $w('#statebox').expand();
    } else {
        $w('#statebox').collapse();
    }
}

function clearFilters() {
    filter(null, null);
    $w('#termInput').value = null;
    $w('#selectionTags').value = [];
}

export function clearFiltersBtn_click(event) {
    clearFilters();
}

export function selectionTags_change(event) {
    if (event.target.value[0]) {
        filter(lastFilterTitle, event.target.value);
    } else {
        filter(lastFilterTitle, null);
    }
}