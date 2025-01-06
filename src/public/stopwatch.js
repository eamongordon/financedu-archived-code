let elapsedSeconds = 0;
let stopwatchVar = 0;

function stopwatchFunction(textElement, textPrefix) {
    elapsedSeconds++;
    textElement.text = textPrefix + new Date(1000 * elapsedSeconds).toISOString().substr(11, 8);
}

export function stopStopwatch() {
    clearInterval(stopwatchVar); // end countdown timer
    elapsedSeconds = 0;
}

export function startStopwatch(startDate, textElement, textPrefix) {
    elapsedSeconds = Math.round(Math.abs(startDate.getTime() - new Date().getTime()) / 1000);
    if (stopwatchVar) {
        clearInterval(stopwatchVar);
    }
    stopwatchVar = setInterval(() => {
        stopwatchFunction(textElement, textPrefix);
    }, 1000); // start countdown timer, update clock every secon
}