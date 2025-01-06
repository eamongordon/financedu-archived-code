import { currentMember } from 'wix-members';
import { session } from 'wix-storage';
import wixData from 'wix-data';
import { generateSuccess, generateError } from 'public/statusbox.js';
import { startStopwatch, stopStopwatch } from 'public/stopwatch.js';
import { checkSession } from 'public/testing.js';
import { openLightbox, formFactor } from 'wix-window';
import { redeemHours } from 'backend/testing.jsw';

let member;
let totalSessionSeconds = 0;
let dateRange;
let sessionItems;

$w.onReady(async function () {
    member = await currentMember.getMember();
    loadMemberCard();
    const testingSessionStorage = session.getItem('testingsession');
    if (testingSessionStorage) {
        $w('#endSessionBtn').expand();
    } else {
        $w('#beginSessionBtn').expand();
    }
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    dateRange = { startDate: oneWeekAgo, endDate: new Date() };
    loadSessions();
});

function loadTotalTime(dataItems) {
    dataItems.forEach((obj) => {
        const millisecondDiff = new Date(obj.endDate).getTime() - new Date(obj.startDate).getTime();
        const totalSeconds = Math.floor(millisecondDiff / 1000);
        totalSessionSeconds += totalSeconds;
    });
    if (totalSessionSeconds > 0) {
        const totalSessionMinutes = Math.floor(totalSessionSeconds / 60);
        const totalSessionHours = Math.floor(totalSessionMinutes / 60);
        const sessionMinutes = totalSessionMinutes - ((60) * totalSessionHours);
        $w('#totalTimeTxt').text = `${totalSessionHours} ${totalSessionHours === 1 ? 'hr' : 'hrs'} ${sessionMinutes} ${sessionMinutes === 1 ? 'min' : 'mins'}`;
    } else {
        $w('#redeemHours').disable();
        $w('#unredeemedTime').text = "0 h 0 min unredeemed";
    }
}

function loadRedeemHours(dataItems) {
    const filteredSessionItems = dataItems.filter((obj) => !obj.redeemed);
    let updatedSessionItems = filteredSessionItems.map((obj) => { return { ...obj, redeemed: true } });
    let totalRedeemSeconds = 0;
    updatedSessionItems.forEach((obj) => {
        const millisecondDiff = new Date(obj.endDate).getTime() - new Date(obj.startDate).getTime();
        const totalSeconds = Math.floor(millisecondDiff / 1000);
        totalRedeemSeconds += totalSeconds;
    });
    if (totalRedeemSeconds > 0) {
        $w('#redeemHours').enable();
    } 
    const totalRedeemMinutes = Math.floor(totalRedeemSeconds / 60);
    const totalRedeemHours = Math.floor(totalRedeemMinutes / 60);
    const redeemMinutes = totalRedeemMinutes - ((60) * totalRedeemHours);
    $w('#unredeemedTime').text = `${totalRedeemHours} ${totalRedeemHours === 1 ? 'hr' : 'hrs'} ${redeemMinutes} ${redeemMinutes === 1 ? 'min' : 'mins'} unredeemed`;
    if (formFactor === 'Mobile') {
        $w('#redeemHours, #unredeemedTime').expand();
    } else {
        $w('#redeemHours, #unredeemedTime').show();
    }
}

async function loadSessions() {
    let sessionData = await wixData.query("TestingSessions").eq('_owner', member._id).find();
    let allSessionResults = sessionData.items;
    while (sessionData.hasNext()) {
        sessionData = await sessionData.next();
        allSessionResults = allSessionResults.concat(sessionData.items);
    }
    sessionItems = allSessionResults;
    if (allSessionResults.length > 0) {
        $w('#recentStatebox').changeState('recentActivity');
        $w('#recentActivityRepeater').data = allSessionResults;
        loadTotalTime(allSessionResults);
        loadRedeemHours(allSessionResults);
    } else {
        $w('#recentStatebox').changeState('noActivity');
    }
}

async function loadMemberCard() {
    if (member.profile.nickname) {
        $w('#firstNameTxt').text = member.profile.nickname;
    } else {
        $w('#firstNameTxt').text = member.profile.slug;
    }
    if (member.profile.profilePhoto) {
        $w('#profileImg, #hoverProfileImg').src = member.profile.profilePhoto.url;
    }
    $w('#profilePicStateBox').onMouseIn((event) => {
        $w('#profilePicStateBox').changeState('Hover');
    });
    $w('#profilePicStateBox').onMouseOut((event) => {
        $w('#profilePicStateBox').changeState('Regular');
    });
}

export function beginSessionBtn_click(event) {
    $w('#beginSessionBtn').disable();
    return wixData.insert("TestingSessions", { "startDate": new Date(), "endDate": new Date(), "memberIdReference": member._id }).then((item) => {
        generateSuccess('Testing session started!');
        session.setItem("testingsession", JSON.stringify(item));
        startStopwatch(item.startDate, $w('#testingTxt'), "Testing for ");
        checkSession();
        $w('#beginSessionBtn').hide();
        $w('#endSessionBtn').show();
    }).catch((error) => {
        $w('#beginSessionBtn').enable();
        generateError(null, error);
        console.log(error);
    }).finally(() => {
        $w('#beginSessionBtn').enable();
    })
}

export function endSessionBtn_click(event) {
    $w('#endSession').disable();
    let testingSession = JSON.parse(session.getItem("testingsession"));
    testingSession.startDate = new Date(testingSession.startDate);
    testingSession.endDate = new Date();
    return wixData.update("TestingSessions", testingSession).then(() => {
        generateSuccess('Testing session ended!');
        session.removeItem("testingsession");
        stopStopwatch();
        $w('#testingStrip').delete();
        $w('#endSession').hide();
        $w('#beginSessionBtn').show();
    }).catch((error) => {
        generateError(null, error);
    }).finally(() => {
        $w('#endSession').enable();
    })
}

export function recentActivityRepeater_itemReady($item, itemData, index) {
    $item('#eventStarted').text = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(itemData.startDate));
    $item('#eventCompleted').text = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(itemData.endDate));
    const millisecondDiff = new Date(itemData.endDate).getTime() - new Date(itemData.startDate).getTime();
    const totalSeconds = Math.floor(millisecondDiff / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes - ((60) * hours);
    $item('#sessionLength').text = `${hours} ${hours === 1 ? 'hr' : 'hrs'} ${minutes} ${minutes === 1 ? 'min' : 'mins'}`;
}

export function eventTimeframeDropdown_change(event) {
    if ($w('#eventTimeframeDropdown').options[3].value === 'customDateRange') {
        let newOptions = $w('#eventTimeframeDropdown').options;
        newOptions.splice(3, 1);
        $w('#eventTimeframeDropdown').options = newOptions;
    }
    if (event.target.value === 'custom') {
        openLightbox("Date Range").then((res) => {
            const newOption = {
                label: `${new Intl.DateTimeFormat('en-US', { dateStyle: 'medium'}).format(res.startDate)} - ${new Intl.DateTimeFormat('en-US', { dateStyle: 'medium'}).format(res.endDate)}`,
                value: 'customDateRange'
            };
            let newOptions = $w('#eventTimeframeDropdown').options;
            newOptions.splice(3, 0, newOption);
            $w('#eventTimeframeDropdown').options = newOptions;
            $w('#eventTimeframeDropdown').value = 'customDateRange';
            dateRange = { startDate: res.startDate, endDate: res.endDate };
            const filteredsessionDataItems = sessionItems.filter((obj) => new Date(obj.startDate).getTime() > dateRange.startDate.getTime() && new Date(obj.endDate).getTime() < dateRange.endDate.getTime());
            totalSessionSeconds = 0;
            $w('#recentActivityRepeater').data = filteredsessionDataItems;
            loadTotalTime(filteredsessionDataItems);
        });
    } else {
        dateRange = eventDateRange(event.target.value);
        const filteredsessionDataItems = sessionItems.filter((obj) => new Date(obj.startDate).getTime() > dateRange.startDate.getTime() && new Date(obj.endDate).getTime() < dateRange.endDate.getTime());
        totalSessionSeconds = 0;
        $w('#recentActivityRepeater').data = filteredsessionDataItems;
        loadTotalTime(filteredsessionDataItems);
    }
}

function eventDateRange(value) {
    let startDate = new Date();
    const endDate = new Date();
    switch (value) {
    case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
    case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
    case 'month':
        startDate.setDate(startDate.getDate() - 30);
        break;
    }
    return { startDate: startDate, endDate: endDate }
}

export function redeemHours_click(event) {
    const filteredSessionItems = sessionItems.filter((obj) => !obj.redeemed);
    const updatedSessionItems = filteredSessionItems.map((obj) => { return { ...obj, redeemed: true } });
    let totalSessionSecondsRedeem = 0;
    updatedSessionItems.forEach((obj) => {
        const millisecondDiff = new Date(obj.endDate).getTime() - new Date(obj.startDate).getTime();
        const totalSeconds = Math.floor(millisecondDiff / 1000);
        totalSessionSecondsRedeem += totalSeconds;
    });
    const totalSessionMinutes = Math.floor(totalSessionSecondsRedeem / 60);
    const totalSessionHours = Math.floor(totalSessionMinutes / 60);
    const sessionMinutes = totalSessionMinutes - ((60) * totalSessionHours);
    openLightbox("Delete Confirmation", { confirmText: `Redeem ${totalSessionHours} ${totalSessionHours === 1 ? 'hr' : 'hrs'} ${sessionMinutes} ${sessionMinutes === 1 ? 'min' : 'mins'}?`, infoMessage: "After you redeem, we will be in contact with you shortly.", confirmButtonLabel: "Redeem!", mode: "confirm" }).then((res) => {
        if (res.confirmed) {
            redeemHours(sessionItems).then(() => {
                $w('#redeemHours').disable();
                $w('#unredeemedTime').text = "0 h 0 min unredeemed";
                generateSuccess("Hours successfully redeemed!");
            });
        }
    });
}