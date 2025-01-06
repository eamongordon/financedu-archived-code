import wixLocation from 'wix-location';

$w.onReady(async function () {
    if (wixLocation.query.section) {
        $w(`#${wixLocation.query.section}`).scrollTo();
    }
    /*
    if (!wixLocation.query.key || wixLocation.query.key !== "t") {
        $w('#columnStrip14').collapse();
    }
    */
});

function editPositionRepeater(itemId) {
    $w('#topicRepeater').forEachItem(($item, itemData, index) => {
        if (itemData._id === itemId) {
            $item('#topicContainer').background.src = "https://static.wixstatic.com/media/2dcc6c_623d678059d64fe59f891bd2ffbf8757~mv2.jpeg";
        } else {
            $item('#topicContainer').background.src = null;
        }
    });
}

export function topicContainer_mouseIn(event) {
    editPositionRepeater(event.context.itemId);
}

export function topicContainer_mouseOut(event) {
    editPositionRepeater(null);
}