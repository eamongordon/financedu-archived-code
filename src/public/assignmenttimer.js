import wixLocation from 'wix-location';

let timerLengthSeconds = 0;
let timerLengthMinutes = 0;
let countDownSeconds = 0;
let countDownMinutes = 0;
let countdownVar = 0;

function countdownFunction() {
    countDownSeconds--;
    countDownMinutes = Math.floor(countDownSeconds / 60);
    if (countDownSeconds === 0) {
        stopFunction(); // finished
    }
    $w('#assignmentTimerBar').value = $w('#assignmentTimerBar').targetValue - countDownSeconds;
    if (Number(countDownSeconds % 60) < 10) {
        $w('#assignmentTimerText').text = countDownMinutes.toString() + ":" + "0" + (countDownSeconds % 60).toString() + "  Remaining";
    } else {
        $w('#assignmentTimerText').text = countDownMinutes.toString() + ":" + (countDownSeconds % 60).toString() + "  Remaining";
    }
}

function stopFunction() {
    clearInterval(countdownVar); // end countdown timer
    timerLengthSeconds = 0; // reset vars
    timerLengthMinutes = 0;
    countDownSeconds = 0;
    countDownMinutes = 0;
    $w("#submissionsDataset").setFieldValues({
        "submitted": true
    });
    $w('#submissionsDataset').save().then(() => {
        wixLocation.to($w('#dynamicDataset').getCurrentItem()['link-assignments-1-title']);
    })
}

export function startTimer(timerEnd, timerLength) {
    timerLengthSeconds = Math.floor(((timerEnd).getTime() - (new Date()).getTime()) / 1000);
    $w('#assignmentTimerBar').targetValue = timerLength;
    timerLengthMinutes = timerLengthSeconds / 60;
    countDownSeconds = timerLengthSeconds
    countDownMinutes = timerLengthMinutes;
    countdownVar = setInterval(countdownFunction, 1000); // start countdown timer, update clock every second
    $w('#assignmentTimerText').show();
}