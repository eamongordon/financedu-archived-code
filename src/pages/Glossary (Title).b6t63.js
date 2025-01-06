// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction
let item;

$w.onReady(async function () {
    await $w('#dynamicDataset').onReadyAsync();
    item = await $w('#dynamicDataset').getCurrentItem();
    let breadcrumbItems = [];
    breadcrumbItems.push({ 'label': 'Glossary', 'link': '/glossary' }, { 'label': item.title, 'link': item['link-glossary-1-title'], 'isCurrent': true });
    $w('#breadcrumbs').items = breadcrumbItems;
    if (item.image) {
        $w('#image, #imageCaption').expand();
    }
    console.log($w('#text187').html);
});

/*
<h5 style="font-size:20px;"><span class="color_33"><span style="font-size:20px;">Capital<br />
Labor<br />
Deposit Insurance</span></span></h5>
*/