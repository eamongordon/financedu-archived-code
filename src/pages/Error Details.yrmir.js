import wixWindow from 'wix-window';
import { session } from 'wix-storage';
import { sendBugReport } from 'public/testing.js';

$w.onReady(function () {
    let received = wixWindow.lightbox.getContext();
    $w('#errorDetails').text = JSON.stringify(received.errorDetails);
});

export function close_click(event) {
    wixWindow.lightbox.close();
}

export function sendBugReport_click(event) {
  let received = wixWindow.lightbox.getContext();
  sendBugReport(received.errorDetails);
}