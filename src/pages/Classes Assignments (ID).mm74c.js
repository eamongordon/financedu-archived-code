// API Reference: https://www.wix.com/velo/reference/api-overview/introduction
// “Hello, World!” Example: https://learn-code.wix.com/en/article/1-hello-world

$w.onReady(function () {

});

export function repeaterassignments_itemReady($item, itemData, index) {
    if (itemData.visible === true) {
        $item('#showButton').label = 'Hide';
        $item('#hiddenLine').show();
        //$item('#showButton').icon = 'https://static.wixstatic.com/shapes/2dcc6c_c76e12bb16eb4ca3ab9125aeefdd05eb.svg';
    }
}

/*
//$w("#repeaterassignments").forEachItem(($item, itemData, index) => {
    if ($w('#showButton').label === 'Hide') {
        $item('#showButton').onClick(() => {
            $w("#assignmentsDataset").setFieldValue("visible", false);
            $item('#hiddenLine').hide();
            $item('#showButton').label = 'Show';
            $w('#assignmentsDataset').save();
        })
    } else {
        $item('#showButton').onClick(() => {
            $item('#showButton').label = 'Hide';
            $item('#hiddenLine').show();
            $w("#assignmentsDataset").setFieldValues({ "startDate": new Date(), "visible": true });
            $w('#assignmentsDataset').save();
        })
    }
//});
*/

export function showButton_click(event) {
    let $item = $w.at(event.context);
    if ($item('#showButton').label === 'Hide') {
        $w("#assignmentsDataset").setFieldValue("visible", false);
        $item('#hiddenLine').hide();
        $item('#showButton').label = 'Show';
        $w('#assignmentsDataset').save();
    } else {
        $item('#showButton').label = 'Hide';
        $item('#hiddenLine').show();
        $w("#assignmentsDataset").setFieldValues({ "startDate": new Date(), "visible": true });
        $w('#assignmentsDataset').save();
    }
}