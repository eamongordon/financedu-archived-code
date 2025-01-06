import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
let debounceTimer;

let page;

$w.onReady(function () {
    page = wixWindow.lightbox.getContext().page;
});

export function iTitle_keyPress(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        if (event.key === 'Enter') {
            if (page === 'search') {
                wixLocation.to(`https://www.financedu.org/search?q=${event.target.value}`);
            } else {
                wixLocation.to(`/search?q=${event.target.value}`);
            }
        } else {
            if (page === 'search') {
                $w('#searchglassIcon').link = `https://www.financedu.org?q=${event.target.value}`
            } else {
                $w('#searchglassIcon').link = `/search?q=${event.target.value}`
            }
        }
    }, 500);
}

export function searchTermSelectionTags_change(event) {
    $w('#searchTermSelectionTags').disable();
    $w('#iTitle').value = event.target.value[0];
    if (page === 'search') {
        wixLocation.to(`https://www.financedu.org/search?q=${event.target.value[0]}`);
    } else {
        wixLocation.to(`/search?q=${event.target.value[0]}`);
    }
}