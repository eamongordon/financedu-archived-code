import wixData from 'wix-data';
import { authentication } from 'wix-members';
import { getRoles } from 'public/memberFunctions.js';
import wixLocation from 'wix-location';

let lastFilterTitle;
let lastFilterGradeLevel;
let lastFilterLength;

let debounceTimer;
let roles;

$w.onReady(async function () {
    if (authentication.loggedIn()) {
        roles = await getRoles();
        if (roles.includes("Teacher")) {
            await $w('#dynamicDataset').onReadyAsync();
            $w('#dynamicDataset').setFilter(wixData.filter());
        }
    }
    /*
    if (!wixLocation.query.key || wixLocation.query.key !== "t") {
        $w('#MoreButton').collapse();
    }
    */
});

export function sortButton_click(event) {
    if ($w('#statebox').collapsed || $w('#statebox').currentState.id !== 'Sort') {
        $w('#statebox').changeState('Sort');
        $w('#statebox').expand();
    } else {
        $w('#statebox').collapse();
    }
}

export function filterButton_click(event) {
    if ($w('#statebox').collapsed || $w('#statebox').currentState.id !== 'Filter') {
        $w('#statebox').changeState('Filter');
        $w('#statebox').expand();
    } else {
        $w('#statebox').collapse();
    }
}

function sortDataset() {
    let sort = wixData.sort();
    let sortValue = $w('#sortDropdown').value;
    switch (sortValue) {
    case 'newestFirst':
        sort = sort.descending('_createdDate');
        break;
    case 'lastUpdatedFirst':
        sort = sort.descending('_updatedDate');
        break;
    case 'a-z':
        sort = sort.ascending('title');
        break;
    case 'z-a':
        sort = sort.descending('title');
        break;
    case 'mostViewed':
        sort = sort.descending('views')
        break;
    case 'default':
        sort = sort.descending("_createdDate");
        break;
    }
    $w('#dynamicDataset').setSort(sort);

}

function filter(title, gradeLevel, length) {
    if (lastFilterTitle !== title || lastFilterGradeLevel !== gradeLevel || lastFilterLength !== length) {
        let newFilter = wixData.filter();
        if (authentication.loggedIn()) {
            if (!roles.includes("Teacher")) {
                newFilter = newFilter.ne("category", "Classroom");
            }
        } else {
            newFilter = newFilter.ne("category", "Classroom");
        }
        if (title)
            newFilter = newFilter.contains('title', title);
        if (gradeLevel)
            newFilter = newFilter.le('gradeLevelMaximum', gradeLevel);
        if (length) {
            newFilter = newFilter.le("length", length[1])
            newFilter = newFilter.ge("length", length[0])
        }
        $w('#dynamicDataset').setFilter(newFilter)
            .then(() => {
                noResultsCheck();
            });
        lastFilterTitle = title;
        lastFilterGradeLevel = gradeLevel;
        lastFilterLength = length;
    }
}

export function courseLengthSlider_change(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        filter(lastFilterTitle, lastFilterGradeLevel, event.target.value);
    }, 500);
}

export function gradeLevelDropdown_change(event) {
    if (event.target.value === 'All') {
        filter(lastFilterTitle, null, lastFilterLength);
    } else {
        filter(lastFilterTitle, event.target.value, lastFilterLength);
    }
}

export function titleInput_keyPress(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        filter(event.target.value, lastFilterGradeLevel, lastFilterLength);
    }, 500);
}

export function sortDropdown_change(event) {
    sortDataset();
}

async function noResultsCheck() {
    let count = await $w('#dynamicDataset').getTotalCount();
    if (count > 0) {
        $w('#noresultsTxt').hide();
    } else {
        $w('#noresultsTxt').show();
    }
}

export function noresultsTxt_click(event) {
    $w('#noresultsTxt').hide();
    clearFilters();
}

function clearFilters() {
    filter(null, null, null);
    $w('#courseLengthSlider').value = [0, 100];
    $w('#gradeLevelDropdown').value = "All";
    $w('#titleInput').value = null;
}

export function clearFiltersBtn_click(event) {
    clearFilters();
}