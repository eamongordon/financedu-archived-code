let article;

$w.onReady(async function () {
	article = await $w('#dynamicDataset').getCurrentItem();
	let breadcrumbItems = [];
    breadcrumbItems.push({'label': 'All Topics', 'link': article['link-help-topics-1-all']}, {'label': article.category, 'link': article['link-help-topics-1-all']}, {'label': article.title, 'link': article['link-help-topics-title'], 'isCurrent': true});
    $w('#breadcrumbs').items = breadcrumbItems;
});

export function yesBtn_click(event) {
    $w('#yesBtn').disable();
    $w('#noBtn').enable();
    $w('#helpfulstatebox').show();
	$w('#helpfulstatebox').changeState('Yes');
}

export function noBtn_click(event) {
    $w('#yesBtn').enable();
    $w('#noBtn').disable();
    $w('#helpfulstatebox').show();
	$w('#helpfulstatebox').changeState('No');
}