import { lightbox } from 'wix-window';

$w.onReady(function () {
    let received = lightbox.getContext();
    const { confirmText, infoMessage } = received;
    let confirmButtonLabel = received?.confirmButtonLabel;
    $w('#confirmText').text = confirmText;
    $w('#infoMessage').text = infoMessage;
    if (confirmButtonLabel) {
        $w('#confirm').label = confirmButtonLabel;
    }
    if (received?.mode === "confirm") {
        $w('#confirm').style.backgroundColor = '#3bde2c'
    }
});

export function stay_click(event) {
    lightbox.close({ "confirmed": false });
}

export function confirm_click(event) {
    lightbox.close({ "confirmed": true });
}

export function cancel_click(event) {
    lightbox.close({ "confirmed": false });
}