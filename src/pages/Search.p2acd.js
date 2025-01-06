import wixSiteFrontend from 'wix-site-frontend';
import wixLocation from 'wix-location';

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
    if (wixLocation.query.q) {
        filter(wixLocation.query.q);
        $w('#iTitle').value = wixLocation.query.q;
    } else {
        const slicedArray = allResults.slice(0, 4);
        $w('#resultsRepeater').data = slicedArray;
        $w('#loadingStrip').collapse();
        $w('#noInputStrip').expand();
    }
    //const glossarySitemap = await wixSiteFrontend.routerSitemap("Glossary");

});

export function iTitle_keyPress(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        if ($w('#iTitle').value) {
            $w('#noInputStrip').collapse();
            filter(event.target.value);
            wixLocation.queryParams.add({ "q": $w('#iTitle').value });
        } else {
            $w('#noInputStrip').expand();
            $w('#resultStrip').collapse();
            if ($w('#selectionTags').value.length > 0) {
                $w('#noResultsStrip').collapse();
            }
            wixLocation.queryParams.remove(['q']);
        }
    }, 500);
}

function filter(value) {
    $w('#noResultsStrip, #resultStrip').collapse();
    const fuse = new Fuse(allResults, searchOptions)
    currResults = fuse.search(value).map((obj) => {
        return { ...obj.item, score: obj.score }
    });
    if ($w('#selectionTags').value.length > 0) {
        currResults = currResults.filter((obj) => $w('#selectionTags').value.includes(obj.type));
    }
    let segmentedCurrResults = [];
    while (currResults.length) {
        segmentedCurrResults.push(currResults.splice(0, 4));
    }
    if (segmentedCurrResults[0]?.length > 0) {
        $w('#resultsRepeater').data = segmentedCurrResults[0];
        $w('#resultStrip').expand();
        if (segmentedCurrResults.length > 1) {
            $w('#loadMore').expand();
        } else {
            $w('#loadMore').collapse();
        }
    } else {
        if ($w('#iTitle').value) {
            $w('#noResultsStrip').expand();
        } else {
            $w('#noResultsStrip').collapse();
        }
    }
    $w('#loadingStrip').collapse();
}

export function resultsRepeater_itemReady($item, itemData, index) {
    //$item('#title').text = itemData.title;
    console.log(itemData.url);
    $item('#title').html = `<h4 class="wixui-rich-text__text" style="font-size:21px;"><a href=${itemData.url} target="_self" class="wixui-rich-text__text"><span style="font-size:21px;" class="wixui-rich-text__text">${itemData.title}</span></a></h4>`
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
    if (event.target.value.length > 0) {
        const fuse = new Fuse(allResults, searchOptions)
        currResults = fuse.search($w('#iTitle').value).map((obj) => {
            return { ...obj.item, score: obj.score }
        });
        $w('#resultsRepeater').data = currResults.filter((obj) => event.target.value.includes(obj.type));
        if ($w('#resultsRepeater').data.length === 0) {
            $w('#resultStrip').collapse();
            if ($w('#iTitle').value) {
                $w('#noResultsStrip').expand();
            }
        }
        $w('#loadMore').collapse();
    } else {
        filter($w('#iTitle').value);
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
    wixLocation.queryParams.add({ "q": event.target.value });
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

export function tryagainTxt_click(event) {
    $w('#iTitle').value = null;
    const slicedArray = allResults.slice(0, 4);
    $w('#resultsRepeater').data = slicedArray;
    $w('#noResultsStrip').collapse();
    $w('#noInputStrip').expand();
    $w('#selectionTags').value = [];
    wixLocation.queryParams.remove(['q']);
}