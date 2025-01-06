import wixSiteFrontend from 'wix-site-frontend';
import { generateRandom } from 'public/util.js';

import Fuse from 'fuse.js';

let debounceTimer;
let allResults;
let currResults;

const searchOptions = {
    includeScore: true,
    keys: ['title'],
    threshold: 0.3
}

$w.onReady(async function () {
    console.log($w('#vectorImage28').src);
    $w('#vectorImage27').src = `wix:vector://v1/11062b_a23dfceddf9946ccadb9b9d27953b60a.svg/`
    //$w('#vectorImage27').src = `wix:vector://v1/11062b_a23dfceddf9946ccadb9b9d27953b60a.svg/`
    /*
    let result = await wixSearch.search().documentType("Site/Pages").find();
	let allResults = result.documents;
    while (result.hasNext()) {
        result = await result.next();
        allResults = allResults.concat(result.documents);
    }
    */
    const structure = wixSiteFrontend.getSiteStructure();
    const pagesSitemap = structure.pages.filter((obj) => obj.type === 'static').map((obj) => { return { title: obj.name, url: obj.url, type: 'static' } });
    const lessonSitemap = (await wixSiteFrontend.routerSitemap("lesson")).map((obj) => { return { title: obj.title, url: `/lesson/${obj.url}`, type: 'lesson' } });
    const activitySitemap = (await wixSiteFrontend.routerSitemap("activity")).map((obj) => { return { title: obj.title, url: `/activity/${obj.url}`, type: 'activity' } });
    const courseSitemap = (await wixSiteFrontend.routerSitemap("courses")).map((obj) => { return { title: obj.title, url: `/courses/${obj.url}`, type: 'course' } });
    const toolSitemap = (await wixSiteFrontend.routerSitemap("tools")).map((obj) => { return { title: obj.title, url: `/tools/${obj.url}`, type: 'tool' } });
    const glossarySitemap = (await wixSiteFrontend.routerSitemap("glossary")).map((obj) => { return { title: obj.title.replace(' | Financedu', ''), url: `/glossary/${obj.url}`, type: 'glossary' } });
    const helpSitemap = (await wixSiteFrontend.routerSitemap("help")).map((obj) => { return { title: obj.title.replace(' | Financedu', ''), url: `/help/${obj.url}`, type: 'help' } });;
    const allSitemmap = pagesSitemap.concat(lessonSitemap, activitySitemap, courseSitemap, toolSitemap, glossarySitemap, helpSitemap);
    const allSitemapwithId = allSitemmap.map((obj, index) => {
        return { ...obj, _id: `index${index}` }
    })
    allResults = allSitemapwithId;
    const slicedArray = allResults.slice(0, 4);
    $w('#resultsRepeater').data = slicedArray;
    $w('#loadingStrip').collapse();
    $w('#noInputStrip').expand();
    //const glossarySitemap = await wixSiteFrontend.routerSitemap("Glossary");

});

/*
        while (res.items.length) {
            coursesDataArr.push(res.items.splice(0, 2));
        }
*/

/**
*	Sets the function that runs when a new repeated item is created.
	[Read more](https://www.wix.com/corvid/reference/$w.Repeater.html#onItemReady)
*	 @param {$w.$w} $item
*/
export function lessonsRepeater_itemReady($item, itemData, index) {
    $item('#lessonName').text = itemData.title;
    $item('#aboutLessonTxt').html = itemData.description;

}

export function activityRepeater_itemReady($item) {
    // This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
    // Add your code for this event here: 
}

/**
*	Sets the function that runs when a new repeated item is created.
	[Read more](https://www.wix.com/corvid/reference/$w.Repeater.html#onItemReady)
*	 @param {$w.$w} $item
*/
export function resourceRepeater_itemReady($item) {
    // This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
    // Add your code for this event here: 
}

export function glossaryRepeater_itemReady($item) {
    // This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
    // Add your code for this event here: 
}

export function helpRepeater_itemReady($item) {
    // This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
    // Add your code for this event here: 
}

export function iTitle_keyPress(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        if ($w('#iTitle').value.length > 0) {
            $w('#noInputStrip').collapse();
            filter(event.target.value);
        } else {
            $w('#noInputStrip').expand();
            $w('#resultStrip').collapse();
        }
    }, 500);
}

function filter(value) {
    $w('#noResultsStrip, #resultStrip').collapse();
    const fuse = new Fuse(allResults, searchOptions)
    currResults = fuse.search(value).map((obj) => {
        return { ...obj.item, score: obj.score }
    });
    let segmentedCurrResults = [];
    while (currResults.length) {
        segmentedCurrResults.push(currResults.splice(0, 4));
    }
    if (segmentedCurrResults[0].length > 0) {
        $w('#resultsRepeater').data = segmentedCurrResults[0];
        $w('#resultStrip').expand();
        if (segmentedCurrResults.length > 1) {
            $w('#loadMore').expand();
        } else {
            $w('#loadMore').collapse();
        }
    } else {
        $w('#noResultsStrip').expand();
    }
    $w('#loadingStrip').collapse();
}

export function resultsRepeater_itemReady($item, itemData, index) {
    $item('#title').text = itemData.title;
    let color;
    let text;
    switch (itemData.type) {
    case 'static':
        color = '#4bdb7b';
        text = 'PAGE';
        break;
    case 'lesson':
        color = '#ff8f05';
        text = 'LESSON';
        break;
    case 'activity':
        color = '#f64d43';
        text = 'ACTIVITY';
        break;
    case 'course':
        color = '#0792de';
        text = 'COURSE';
        break;
    case 'tool':
        color = '#67D6D6';
        text = 'TOOL'
    case 'glossary':
        color = '#8C84FA';
        text = 'GLOSSARY';
        break;
    case 'help':
        color = '#AAAAAA';
        text = 'HELP';
        break;
    }
    $item('#colorButton').style.backgroundColor = color;
    $item('#colorButton').label = text;
}

export function selectionTags_change(event) {
    if (event.target.value) {
        const fuse = new Fuse(allResults, searchOptions)
        currResults = fuse.search($w('#iTitle').value).map((obj) => {
            return { ...obj.item, score: obj.score }
        });
        $w('#resultsRepeater').data = currResults.filter((obj) => event.target.value.includes(obj.type));
        $w('#loadMore').collapse();
    }
}

export function loadMore_click() {
    let segmentedCurrResults = [];
    const fuse = new Fuse(allResults, searchOptions)
    currResults = fuse.search($w('#iTitle').value).map((obj) => {
        return { ...obj.item, score: obj.score }
    });
    const originalLength = currResults.length;
    while (currResults.length) {
        segmentedCurrResults.push(currResults.splice(0, 4));
    }
    const currentIndex = Math.floor($w('#resultsRepeater').data.length / 4);
    let concatArray = [];
    for (let step = 0; step < currentIndex + 2; step++) {
        if (segmentedCurrResults.length > step) {
            concatArray = concatArray.concat(segmentedCurrResults[step]);
        }
        if (step + 1 === segmentedCurrResults.length) {
            $w('#loadMore').collapse();
        }
    }
    $w('#resultsRepeater').data = concatArray;
}

export function searchTermSelectionTags_change(event) {
    $w('#noInputStrip').collapse();
    $w('#iTitle').value = event.target.value[0];
    filter(event.target.value[0]);
    $w('#searchTermSelectionTags').value = [];
}

export function sortDropdown_change(event) {
    let repeaterData = $w('#resultsRepeater').data;
    switch (event.target.value) {
    case 'relevance':
        repeaterData.sort((a, b) => a.score - b.score);
        break;
    case 'a-z':
        repeaterData.sort((a, b) => a.title.localeCompare(b.title));
        break;
    case 'z-a':
        repeaterData.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }
    $w('#resultsRepeater').data = repeaterData;
}