import { formFactor, openLightbox } from 'wix-window';
import { memory } from 'wix-storage';

export function generateError(message, details, elementData) {
    let statusboxElement;
    let statusboxTextElement;
    let statusboxSuccessIconElement;
    let statusboxErrorIconElement;
    let statusboxInfoIconElement;
    let closeStatusboxElement;
    if (elementData) {
        statusboxElement = elementData.statusboxElement;
        statusboxTextElement = elementData.statusboxTextElement;
        statusboxSuccessIconElement = elementData.statusboxSuccessIconElement;
        statusboxErrorIconElement = elementData.statusboxErrorIconElement;
        statusboxInfoIconElement = elementData.statusboxInfoIconElement;
        closeStatusboxElement = elementData.closeStatusboxElement;
    } else {
        statusboxElement = $w('#statusbox')
        statusboxTextElement = $w('#statustext')
        statusboxSuccessIconElement = $w('#statusBoxSuccessIcon')
        statusboxErrorIconElement = $w('#statusBoxErrorIcon')
        statusboxInfoIconElement = $w('#statusBoxInfoIcon')
        closeStatusboxElement = $w('#closeStatusMessageButton')
    }
    if (formFactor === 'Mobile') {
        statusboxElement.expand();
    } else {
        statusboxElement.show();
    }
    statusboxElement.style.backgroundColor = '#FF4040';
    statusboxTextElement.text = message || "An error occurred. Try again later.";
    if (details) {
        closeStatusboxElement.label = "Details";
    }
    memory.setItem('ErrorDetails', details);
    statusboxErrorIconElement.show();
    statusboxSuccessIconElement.hide();
    statusboxInfoIconElement.hide();
    //$w('#statustext').html = `<h5 style="color: #eb4034; text-align:center; font-size:20px;"><span style="font-size:20px;">${message}</span></h5>`;
    setTimeout(function () {
        if (formFactor === 'Mobile') {
            statusboxElement.collapse();
        } else {
            statusboxElement.hide('fade', { duration: 200 });
        }
    }, 3000);
    if (formFactor !== 'Mobile') {
        //if ($w('Button').some((obj) => obj.id === closeStatusboxElement)) {
        closeStatusboxElement.onClick(() => {
            if (closeStatusboxElement.label === "Details") {
                openLightbox("Error Details", { "errorDetails": details });
            } else {
                statusboxElement.hide('fade', { duration: 200 });
            }
        });
        //}
    }
}

export function generateInfo(message, elementData) {
    let statusboxElement;
    let statusboxTextElement;
    let statusboxSuccessIconElement;
    let statusboxErrorIconElement;
    let statusboxInfoIconElement;
    let closeStatusboxElement;
    if (elementData) {
        statusboxElement = elementData.statusboxElement;
        statusboxTextElement = elementData.statusboxTextElement;
        statusboxSuccessIconElement = elementData.statusboxSuccessIconElement;
        statusboxErrorIconElement = elementData.statusboxErrorIconElement;
        statusboxInfoIconElement = elementData.statusboxInfoIconElement;
        closeStatusboxElement = elementData.closeStatusboxElement;
    } else {
        statusboxElement = $w('#statusbox')
        statusboxTextElement = $w('#statustext')
        statusboxSuccessIconElement = $w('#statusBoxSuccessIcon')
        statusboxErrorIconElement = $w('#statusBoxErrorIcon')
        statusboxInfoIconElement = $w('#statusBoxInfoIcon')
        closeStatusboxElement = $w('#closeStatusMessageButton')
    }
    if (formFactor === 'Mobile') {
        statusboxElement.expand();
    } else {
        statusboxElement.show();
    }
    statusboxElement.style.backgroundColor = '#00B5EA';
    statusboxTextElement.text = message || "An error occurred. Try again later.";
    statusboxSuccessIconElement.hide();
    statusboxErrorIconElement.hide();
    statusboxInfoIconElement.show();
    //$w('#statustext').html = `<h5 style="color: #eb4034; text-align:center; font-size:20px;"><span style="font-size:20px;">${message}</span></h5>`;
    setTimeout(function () {
        if (formFactor === 'Mobile') {
            statusboxElement.collapse();
        } else {
            statusboxElement.hide('fade', { duration: 200 });
        }
    }, 3000);
    if (formFactor !== 'Mobile') {
        //if ($w('Button').some((obj) => obj.id === closeStatusboxElement)) {
        closeStatusboxElement.onClick(() => {
            statusboxElement.hide('fade', { duration: 200 });
        });
        //}
    }
    /*
    $w('#statusbox').show('fade', { duration: 200 });
    $w('#statusbox').style.backgroundColor = '#00B5EA';
    if (message) {
        $w('#statustext').text = message;
    } else {
        $w('#statustext').text = "An error occurred. Try again later.";
    }
    $w('#statusBoxInfoIcon').show();
    $w('#statusBoxSuccessIcon, #statusBoxErrorIcon').hide();
    setTimeout(function () {
        $w('#statusbox').hide('fade', { duration: 200 });
    }, 3000);
    */
}

export function generateSuccess(message, elementData) {
    let statusboxElement;
    let statusboxTextElement;
    let statusboxSuccessIconElement;
    let statusboxErrorIconElement;
    let statusboxInfoIconElement;
    let closeStatusboxElement;
    if (elementData) {
        statusboxElement = elementData.statusboxElement;
        statusboxTextElement = elementData.statusboxTextElement;
        statusboxSuccessIconElement = elementData.statusboxSuccessIconElement;
        statusboxErrorIconElement = elementData.statusboxErrorIconElement;
        statusboxInfoIconElement = elementData.statusboxInfoIconElement;
        closeStatusboxElement = elementData.closeStatusboxElement;
    } else {
        statusboxElement = $w('#statusbox')
        statusboxTextElement = $w('#statustext')
        statusboxSuccessIconElement = $w('#statusBoxSuccessIcon')
        statusboxErrorIconElement = $w('#statusBoxErrorIcon')
        statusboxInfoIconElement = $w('#statusBoxInfoIcon')
        closeStatusboxElement = $w('#closeStatusMessageButton')
    }
    if (formFactor === 'Mobile') {
        statusboxElement.expand();
    } else {
        statusboxElement.show();
    }
    statusboxElement.style.backgroundColor = '#22DB54';
    statusboxTextElement.text = message || "An error occurred. Try again later.";
    statusboxSuccessIconElement.show();
    statusboxErrorIconElement.hide();
    statusboxInfoIconElement.hide();
    //$w('#statustext').html = `<h5 style="color: #eb4034; text-align:center; font-size:20px;"><span style="font-size:20px;">${message}</span></h5>`;
    setTimeout(function () {
        if (formFactor === 'Mobile') {
            statusboxElement.collapse();
        } else {
            statusboxElement.hide('fade', { duration: 200 });
        }
    }, 3000);
    if (formFactor !== 'Mobile') {
        //if ($w('Button').some((obj) => obj.id === closeStatusboxElement)) {
        closeStatusboxElement.onClick(() => {
            statusboxElement.hide('fade', { duration: 200 });
        });
        //}
    }
    /*
    $w('#statusbox').show('fade', { duration: 200 });
    $w('#statusbox').style.backgroundColor = '#22DB54';
    $w('#statustext').text = message;
    $w('#statusBoxErrorIcon, #statusBoxInfoIcon').hide();
    $w('#statusBoxSuccessIcon').show();
    //$w('#statustext').html = `<h5 style="color: #3bde2c; text-align:center; font-size:20px;"><span style="font-size:20px;">${message}</span></h5>`;
    setTimeout(function () {
        $w('#statusbox').hide('fade', { duration: 200 });
    }, 3000);
    */
}