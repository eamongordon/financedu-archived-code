import wixWindow from 'wix-window';

$w.onReady( function () {
  let received = wixWindow.lightbox.getContext();
  $w('#leave').link = received.leaveLink;
} );

export function stay_click(event) {
	wixWindow.lightbox.close();
}
