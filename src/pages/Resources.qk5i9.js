import wixData from 'wix-data';

let lastFilterTitle;
let lastFilterResourceType;

let debounceTimer;

$w.onReady(function () {

    // Write your Javascript code here using the Velo framework API

    // Print hello world:
    // console.log("Hello world!");

    // Call functions on page elements, e.g.:
    // $w("#button1").label = "Click me!";

    // Click "Run", or Preview your site, to execute your code

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
    $w('#resourceDataset').setSort(sort);

}

function filter(title, resourceType) {
    if (lastFilterTitle !== title || lastFilterResourceType !== resourceType) {
        let newFilter = wixData.filter();
        if (title)
            newFilter = newFilter.contains('title', title);
        if (resourceType)
            newFilter = newFilter.hasSome("type", resourceType);
        $w('#resourceDataset').setFilter(newFilter)
            .then(() => {
                noResultsCheck();
            });
        lastFilterTitle = title;
        lastFilterResourceType = resourceType;
    }
}

export function titleInput_keyPress(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        filter(event.target.value, lastFilterResourceType);
    }, 500);
}

export function sortDropdown_change(event) {
	sortDataset();
}

async function noResultsCheck(){
  let count = await $w('#resourceDataset').getTotalCount();
  if (count > 0){
    $w('#noresultsTxt').hide();
  } else {
    $w('#noresultsTxt').show();
  }
}

export function noresultsTxt_click(event) {
  $w('#noresultsTxt').hide();
   clearFilters();
}

export function resourceTypeSelectionTags_change(event) {
    if (event.target.value[0]) {
        filter(lastFilterTitle, event.target.value);
    } else {
        filter(lastFilterTitle, null);
    }
}

function clearFilters() {
    filter(null, null);
    $w('#resourceTypeSelectionTags').value = [];
    $w('#titleInput').value = null;
}

export function clearFiltersBtn_click(event) {
	clearFilters();
}