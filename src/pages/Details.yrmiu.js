import wixWindow from 'wix-window';

$w.onReady(function () {
    let received = wixWindow.lightbox.getContext();
    if (received.title) {
      $w('#titleTxt').text = received.title;
    }
    $w('#details').text = received.details;
});

export function close_click(event) {
    wixWindow.lightbox.close();
}

export function sendBugReport_click(event) {
  let received = wixWindow.lightbox.getContext();
  sendBugReport(received.errorDetails);
}