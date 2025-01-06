import wixData from 'wix-data';
import { session } from 'wix-storage';
import { startStopwatch, stopStopwatch } from 'public/stopwatch.js';
import { generateInfo, generateSuccess, generateError } from 'public/statusbox.js';
import { timeline } from 'wix-animations';
import { getBoundingRect, openLightbox, formFactor } from 'wix-window';

let testingSessionTimer;
let inactivityTimer;
let previousClicksTimeStamp;
let clicks = [];

export async function checkSession() {
    const testSessionStorage = session.getItem("testingsession");
    if (testSessionStorage) {
        $w('#endSession').onClick(() => {
            stopSession();
        });
        $w('#giveFeedback').onClick(() => {
            openLightbox("Feedback", { testingSession: JSON.parse(testSessionStorage)._id }).then((res) => {
                if (res.status) {
                    generateSuccess("Thank you for your feedback!");
                } else {
                    generateError();
                }
            });
        });
        if (formFactor !== 'Mobile') {
            const timelineTestTxt = timeline();
            const windowInfo = await getBoundingRect();
            let xOffset = -(windowInfo.window.width - 980) / 2 + ((windowInfo.window.width - 980) * 0.115);
            timelineTestTxt.add($w('#testingTxt'), [{ "x": xOffset, "duration": 10 }]).play().onComplete(async () => {
                await $w('#testingTxt').show();
            });
            const timelineGiveFeedback = timeline();
            let xOffset2 = (windowInfo.window.width - 980) / 2 - ((windowInfo.window.width - 980) * 0.115);
            timelineGiveFeedback.add([$w('#giveFeedback'), $w('#endSession')], [{ "x": xOffset2, "duration": 10 }]).play().onComplete(async () => {
                await $w('#giveFeedback, #endSession').show();
            });
        }
        let testSession = JSON.parse(testSessionStorage);
        $w('#testingStrip').restore();
        inactivityTimer = setTimeout(() => {
            generateInfo("Your session will end soon due to inactivity. Please interact with the page to continue.")
        }, 100000);
        testingSessionTimer = setTimeout(() => {
            stopSession();
            generateInfo("Due to inactivity, your testing session has ended.");
        }, 120000);
        const endDate = (new Date(testSession.endDate)).getTime();
        const now = (new Date()).getTime();
        startStopwatch(new Date(testSession.startDate), $w('#testingTxt'), "Testing for ");
        let gap = (endDate + 1000) - now;
        if (gap > 0) {
            setTimeout(() => {
                testSession.endDate = new Date();
                wixData.save("TestingSessions", testSession);
            }, gap);
        } else {
            testSession.endDate = new Date();
            wixData.save("TestingSessions", testSession);
        }
    }
}
if ($w('Page').some((obj) => obj.id === "page1")) {
    $w('#page1, #header1, #container1').onClick((event) => {
        initFeedbackTimer(event);
    });
    /*
    $w('#page1, #header1, #container1').onMouseIn((event) => {
        clearTimeout(testingSessionTimer);
        setTimeout(() => {
            generateInfo("Your session will end soon due to inactivity.")
        }, 100000);
        testingSessionTimer = setTimeout(() => {
            stopSession();
        }, 120000);
    });
    */
}

export function initFeedbackTimer(event) {
    console.log("initFeedbackTimer")
    if (session.getItem("testingsession")) {
        let clickObj = {
            "xOffset": event.offsetX,
            "yOffset": event.offsetY,
        }
        const filteredClicks = clicks.filter(click => click.xOffset !== null && click.xOffset !== undefined && click.yOffset !== null && click.yOffset !== undefined);
        if (filteredClicks.length > 5) {
            const allEqual = arr => arr.every(val => val === arr[0]);
            const xCompare = allEqual(filteredClicks.map((obj) => obj.xOffset));
            const yCompare = allEqual(filteredClicks.map((obj) => obj.yOffset));
            const time = allEqual(filteredClicks.map((obj) => obj.time));
            if (xCompare && yCompare || time) {
                openLightbox("Captcha").then((res) => {
                    if (res?.verified) {
                        clicks = [];
                    } else {
                        stopSession();
                        clicks.splice(5, 1, clickObj);
                    }
                })
            } else {
                clicks.splice(5, 1, clickObj);
            }
        } else {
            if (previousClicksTimeStamp) {
                clickObj.time = new Date().getTime() - previousClicksTimeStamp?.getTime();
                clicks.push(clickObj);
            }
            previousClicksTimeStamp = new Date();
        }
        clearTimeout(inactivityTimer)
        clearTimeout(testingSessionTimer);
        inactivityTimer = setTimeout(() => {
            generateInfo("Your session will end soon due to inactivity.")
        }, 100000);
        testingSessionTimer = setTimeout(() => {
            stopSession();
            generateInfo("Due to inactivity, your testing session has ended.");
        }, 120000);
    }
}

export function handleFeedbackModalSession() {
    clearTimeout(inactivityTimer)
    clearTimeout(testingSessionTimer);
}

function stopSession() {
    const testSessionStorage = session.getItem("testingsession");
    let testSession = JSON.parse(testSessionStorage);
    testSession.endDate = new Date();
    wixData.save("TestingSessions", testSession);
    session.removeItem("testingsession");
    stopStopwatch();
    $w('#testingStrip').delete();
    clearTimeout(testingSessionTimer);
    clearTimeout(inactivityTimer);
    if ($w('Button').some((obj) => obj.id === 'beginSessionBtn')) {
        $w('#endSessionBtn').hide();
        $w('#beginSessionBtn').show();
    }
}

export function sendBugReport(message) {
    let feedbackObj = {
        "category": "Bug Report",
        "errorMessage": message
    }
    const testSessionStorage = session.getItem("testingsession");
    if (testSessionStorage) {
        feedbackObj.testingSession = JSON.parse(testSessionStorage)._id
    }
    openLightbox("Feedback", feedbackObj).then((res) => {
        if (res.status) {
            generateSuccess("Thank you for your feedback!");
        } else {
            generateError();
        }
    });
}