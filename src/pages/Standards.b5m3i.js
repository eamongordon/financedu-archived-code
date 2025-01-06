import wixData from 'wix-data';
import wixLocation from 'wix-location';

import { generateRandom } from 'public/util.js';

let lastFilterState;
let lastFilterTitle;
let lastFilterCategory;
let lastFilterLessons;

let debounceTimer;

$w.onReady(function () {
    $w('#standardsDataset').onReady(async () => {
        while ($w('#standardsDataset').getCurrentPageIndex() < $w('#standardsDataset').getTotalPageCount()) {
            await $w('#standardsDataset').loadMore();
        }
    });
    if (wixLocation.query.q) {
        $w('#searchTitle').value = wixLocation.query.q;
        filter(null, wixLocation.query.q, null);
    }
    if (wixLocation.query.lessons) {
        let lessons = wixLocation.query.lessons.split(',')
        filter(null, wixLocation.query.q, null, lessons)
    }
});

export function listRepeater_itemReady($item, itemData, index) {
    $item('#numberTxt').text = (index + 1).toString();
}

function filter(state, title, categories, lessons) {
    if (lastFilterState !== state || lastFilterTitle !== title || lastFilterCategory !== categories || lastFilterLessons !== lessons) {
        let newFilter = wixData.filter();
        if (title)
            newFilter = newFilter.contains('title', title)
            .or(newFilter.contains("description", title));
        if (state)
            newFilter = newFilter.eq('state', state);
        if (categories)
            newFilter = newFilter.hasSome('category', categories);
        if (lessons)
            newFilter = newFilter.hasSome('Lessons', lessons);
        $w('#standardsDataset').setFilter(newFilter);
        lastFilterTitle = title;
        lastFilterState = state;
        lastFilterCategory = categories;
        lastFilterLessons = lessons;
    }
}

export function categoryCheckbox_change(event) {
    filter(lastFilterState, lastFilterTitle, event.target.value);
}

export function searchTitle_keyPress(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        filter(lastFilterState, event.target.value, lastFilterCategory);
        if (event.target.value) {
            wixLocation.queryParams.add({ "q": event.target.value });
        } else {
            wixLocation.queryParams.remove(['q']);
        }
    }, 500);
}

export function stateDropdown_change(event) {
    filter(event.target.value, lastFilterTitle, lastFilterCategory);
}

export async function lessonInput_keyPress(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(async () => {
        const lessonQuery = await wixData.query("Lessons").contains('title', event.target.value).limit(3).find();
        let lessonItems = lessonQuery.items;
        lessonItems.push({ '_id': generateRandom(4), 'title': `"${$w('#lessonInput').value}"` });
        $w('#lessonRepeater').data = lessonItems;
        $w('#lessonRepeater').expand();
        updateLessonRepeater();
    }, 500);
}

function updateLessonRepeater() {
    $w('#lessonRepeater').forEachItem(($item, itemData, index) => {
        const associatesTagMappedArr = $w('#lessonSelectionTags').options.map((obj) => obj.value)
        if (associatesTagMappedArr.includes(itemData._id)) {
            $item('#selectLesson').disable();
            $item('#selectLesson').label = "Selected";
        } else {
            $item('#selectLesson').enable();
            $item('#selectLesson').label = "Select";
        }
    });
}

export function lessonRepeater_itemReady($item, itemData, index) {
    $item('#lessonNameTxt').text = itemData.title;
    $item("#selectLesson").onClick((event) => {
        if (!$w('#lessonSelectionTags').options[0].value) {
            let splicedArray = $w('#lessonSelectionTags').options;
            splicedArray.splice(0, 1);
            $w('#lessonSelectionTags').options = splicedArray;
        }
        addAssociate(itemData._id, itemData.title);
        let associatesArray = $w('#lessonSelectionTags').options.map(obj => (obj.value));
        filter(lastFilterState, lastFilterTitle, lastFilterCategory, associatesArray);
        $w('#lessonInput').label = "Enter another lesson";
    });
}

function addAssociate(itemId, itemName) {
    const newRecipent = {
        "label": `${itemName} ⓧ`,
        "value": itemId
    }
    let recipientTagsArray;
    if ($w('#lessonSelectionTags').options.length > 0 && $w('#lessonSelectionTags').options[0].value === 'delete') {
        recipientTagsArray = [];
    } else {
        recipientTagsArray = $w('#lessonSelectionTags').options;
    }
    recipientTagsArray.push(newRecipent);
    wixLocation.queryParams.add({"lessons": recipientTagsArray.map((obj) => obj.value).join()});
    $w('#lessonSelectionTags').options = recipientTagsArray;
    $w('#lessonSelectionTags').expand();
    //$w('#associatesGroup').expand();
    //$w('#associatesRepeater').data = list('').filter((x) => x).map(item => { return { '_id': item, 'label': item } });
    let associatesArray = $w('#lessonSelectionTags').options.map(obj => (obj.value));
    $w('#lessonInput').value = null;
    updateLessonRepeater();
    filter(lastFilterState, lastFilterTitle, lastFilterCategory, associatesArray);
}

export function lessonSelectionTags_change(event) {
    const filteredArray = $w('#lessonSelectionTags').options.filter(obj => obj.value !== event.target.value[0]);
    $w('#lessonSelectionTags').options = filteredArray;
    let associatesArray = $w('#lessonSelectionTags').options.map(obj => obj.value);
    if ($w('#lessonSelectionTags').options.length === 0) {
        //$w('#associatesGroup').collapse();
        let associatesTagUnshift = $w('#lessonSelectionTags').options;
        associatesTagUnshift.unshift({ "value": null, "label": "placeholder" });
        $w('#lessonSelectionTags').options = associatesTagUnshift;
        $w('#lessonInput').label = 'Enter a Lesson';
        filter(lastFilterState, lastFilterTitle, lastFilterCategory, null);
        $w('#lessonSelectionTags, #lessonRepeater').collapse();
        wixLocation.queryParams.remove(["lessons"]);
    } else {
        const stringArr = $w('#lessonSelectionTags').options.map((obj) => obj.value).join();
        wixLocation.queryParams.add({"lessons": stringArr});
        filter(lastFilterState, lastFilterTitle, lastFilterCategory, associatesArray);
    }
    updateLessonRepeater();
}