import wixData from 'wix-data';
import wixUsers from 'wix-users';
import { generateError, generateSuccess } from 'public/statusbox.js';
import { updateReadData } from 'backend/memberMessageFunctions.jsw'
const he = require('he');

let debounceTimer;
let currIndex = -1;
let listSize;
let person;
let threadCount;
let threadCounted = 0;
let threadIndexNum;

$w.onReady(function () {
    person = $w('#dynamicDataset').getCurrentItem();
    $w('#threadDataset').onReady(async function () {
        threadCount = $w('#threadDataset').getTotalCount();
        const allThreadsData = await $w('#threadDataset').getItems(0, 12);
        const allThreads = allThreadsData.items;
        /*
        allThreads.forEach((thread) => {
            threadCounted++;
            const filteredPersonalMessageData = person.messagesData.filter((obj) => {
                if (obj.id) {
                    return obj.id === thread._id
                }
            })
            if (filteredPersonalMessageData.length === 0) {
                person.messagesData.push({
                    "id": thread._id,
                    "starred": false,
                    "read": false,
                    "category": "inbox"
                });
                if (threadCounted === threadCount) {
                    $w('#dynamicDataset').setFieldValues({
                        "messagesData": person.messagesData
                    });
                    $w('#dynamicDataset').save();
                } else {
                    console.log(threadCounted + 'A');
                }
            }
        
        });
        */
        //$w('#threadLineRepeater').data = allThreads;
        const filteredThreadsInbox = allThreads.filter((thread) => {
            const personMessageDataItem = person.messagesData.filter((obj) => obj.id === thread._id)[0];
            return person.messagesData.filter((obj) => obj.id === thread._id).length > 0 && personMessageDataItem.category === 'inbox';
        });
        $w('#threadLineRepeater').data = filteredThreadsInbox;
        setInterval(() => {console.log($w('#threadDataset').getCurrentItemIndex())}, 1000);
    })
});

async function setUpNewMessage(type, threadId) {
    $w('#messagesDataset').add().then(() => {
        if (type === 'Reply') {
            $w('#messageIndicTxt').text = 'Write a Reply';
            $w('#messagesDataset').setFieldValues({
                "thread": threadId,
                "isThread": false
            });
        } else if (type === 'New'){
            $w('#messageIndicTxt').text = 'New Message';
            $w('#messagesDataset').setFieldValues({
                "thread": threadId,
                "isThread": true
            });            
        } else if (type === 'Forward'){
            $w('#messageIndicTxt').text = 'Forward Message';
            $w('#messagesDataset').setFieldValues({
                "isThread": true
            }); 
            $w('#responsetext').value = $w('#threadDataset').getCurrentItem().textContent;
            $w('#subjectInput').value = `Fwd: ${$w('#threadDataset').getCurrentItem().subject}`
        }
        $w('#stateboxMail').changeState('Write');
    });
}

export function recipientsRepeater_itemReady($item, itemData, index) {
    $item("#recipientsContainer").onClick((event) => {
        addRecipient(itemData._id, itemData.name);
    });
}

export function recipientTags_change(event) {
    const filteredArray = $w('#recipientTags').options.filter(obj => obj.value !== event.target.value[0]);
    $w('#recipientTags').options = filteredArray;
    if ($w('#recipientTags').options.length === 0) {
        $w('#recipientTags').collapse();
        $w('#recipientInput').placeholder = 'Type in a Name...';
    }
}

function addRecipient(itemId, itemName) {
    const newRecipent = {
        "label": `${itemName} ⓧ`,
        "value": itemId
    }
    let recipientTagsArray;
    if ($w('#recipientTags').options.length > 0 && $w('#recipientTags').options[0].value === 'delete') {
        recipientTagsArray = [];
    } else {
        recipientTagsArray = $w('#recipientTags').options;
    }
    recipientTagsArray.push(newRecipent);
    $w('#recipientTags').options = recipientTagsArray;
    $w('#recipientsRepeater').collapse();
    $w('#recipientTxt, #recipientTags').expand();
    filterRecipients(null);
    $w('#recipientInput').value = null;
}

function filterRecipients(name) {
    $w('#recepientSearchDataset').setFilter(wixData.filter().contains("name", name));
}

export function sendButton_click(event) {
    //$w('#recipientTags').value.map(ite => ({ "label": ite.title, "value": ite._id }));
    $w('#sendButton').disable();	
    let recipientArray = $w('#recipientTags').options.map(obj => (obj.value));
    let allPeopleArray = recipientArray;
    allPeopleArray.push('7f66e91a-a2db-46b9-8df5-4a812a54c6f9'); //wixUsers.currentUser.id);
    $w('#messagesDataset').setFieldValues({
        "fromPerson": '7f66e91a-a2db-46b9-8df5-4a812a54c6f9', //wixUsers.currentUser.id,
        "published": true
    });
    $w('#messagesDataset').save().then(() => {
        wixData.replaceReferences("Messages", "toPeople", $w('#messagesDataset').getCurrentItem()._id, recipientArray).then(() => {
            console.log('successtoPeople');
            console.log($w('#recipientTags').value);
            wixData.replaceReferences("Messages", "allPeople", $w('#messagesDataset').getCurrentItem()._id, allPeopleArray).then(() => {
                updateReadData($w('#messagesDataset').getCurrentItem()._id).then(() => {
                    generateSuccess('Message has been succesfully sent.');
                    $w('#recipientTags').options = [];
                    $w('#stateboxMail').changeState('Read');
                }).catch((error) => {
                    generateError('Unable to Send Message. Please Try again later.')
                })
            }).catch((error) => {
                generateError('Unable to Send Message. Please Try again later.')
            })
        }).catch((error) => {
            generateError('Unable to Send Message. Please Try again later.')
        })
    }).catch((error) => {
        generateError('Unable to Send Message. Please Try again later.')
    })
}

export function recipientInput_input(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        if ($w('#recipientInput').value === '') {
            $w('#recipientsRepeater').collapse();
        }
        filterRecipients($w('#recipientInput').value);
    }, 500);
}

export function recipientInput_keyPress(event) {
    $w('#recipientsRepeater').expand();
    listSize = $w('#recipientsRepeater').data.length;
    switch (event.key) {
    case 'Enter':
        if (currIndex === -1) {
            addRecipient($w('#recipientsRepeater').data[currIndex]._id, $w('#recipientsRepeater').data[currIndex].name);
            $w('#recipientInput').placeholder = 'Enter another recipient...';
        } else {
            addRecipient($w('#recipientsRepeater').data[currIndex]._id, $w('#recipientsRepeater').data[currIndex].name);
            $w('#recipientInput').placeholder = 'Enter another recipient...';
        }
        break;
    case 'ArrowUp':
        if (currIndex > 0) {
            currIndex = currIndex - 1;
            refreshItemsColors();
            $w('#recipientInput').value = $w('#recipientsRepeater').data[currIndex].title;
        } else {
            currIndex = currIndex - 1;
            $w('#recipientInput').focus();
            $w('#recipientsContainer').background.src = 'https://static.wixstatic.com/media/2dcc6c_3ef08e60987b4f0aa963f1c0471e39f8~mv2.png';
        }
        break;
    case 'ArrowDown':
        if (currIndex < listSize - 1) {
            currIndex = currIndex + 1;
            refreshItemsColors();
            $w('#recipientInput').value = $w('#recipientsRepeater').data[currIndex].title;
        }
        console.log(currIndex);
        break;
    case 'Escape':
        $w('#recipientInput').value = '';
        currIndex = -1;
        $w('#recipientsRepeater').collapse();
        break;
    }
}

export function newMessageButton_click(event) {
    setUpNewMessage('New', null);
}

function refreshItemsColors() {
    $w('#recipientsRepeater').forEachItem(($item, itemData, index) => {
        if (index === currIndex) {
            $item('#recipientsContainer').background.src = 'https://static.wixstatic.com/media/2dcc6c_df6123451dd64254a1c485c53cc17e3e~mv2.png';
        } else {
            $item('#recipientsContainer').background.src = 'https://static.wixstatic.com/media/2dcc6c_3ef08e60987b4f0aa963f1c0471e39f8~mv2.png';
        }
    });
}

export function messageThreadRepeater_itemReady($item, itemData, index) {
    if (itemData.isThread === true) {
        $item('#originalMessageReplyButton').show();
    }
    $item("#replyIndividualMessage").onClick((event) => {
        setUpNewMessage('Reply', itemData._id);
    });
    $item("#originalMessageReplyButton").onClick((event) => {
        $w('#subjectText').text = 'Viewing Original Message';
        $w('#prevButton').show();
        $w('#messagesDataset').setFilter(wixData.filter().contains("_id", itemData.thread._id));
    });
}

export function replyMainButton_click(event) {
    setUpNewMessage('Reply', $w('#threadDataset').getCurrentItem()._id);
}

function savedata(action, currenthreadId) {
    //const currenthread = $w('#threadDataset').getCurrentItem();

    updateResponseData(action);

    function updateResponseData(action) {
        person.messagesData = person.messagesData.map((obj, index) => {
            if (obj.id === currenthreadId) {
                switch (action) {
                case 'star':
                    return { ...obj, starred: true };
                    break;
                case 'unstar':
                    return { ...obj, starred: false };
                    break;
                case 'read':
                    return { ...obj, read: true };
                    break;
                case 'archive':
                    return { ...obj, category: "archived" };
                    break;
                case 'delete':
                    return { ...obj, category: "deleted" };
                    break;
                }
            }
            return obj;
        });
    }
    //setTimeout(() => {
        console.log(person.messagesData);
        $w("#dynamicDataset").setFieldValues({
            "messagesData": person.messagesData
        });
        return $w('#dynamicDataset').save().then(() =>{
            return {status: true};
        });
    //}, 500);
}

export function threadLineRepeater_itemReady($item, itemData, index) {
    $item('#dateTxt').text = itemData._createdDate.toLocaleString('en-US', { month: "short", day: "numeric" });
    $item('#nameTxt').text = itemData.fromPerson.name;
    $item('#subjectLineTopic').text = itemData.subject.substring(0, 20);
    $item('#unstarredIcon').onClick(() => {
        savedata('star', itemData._id);
        $item('#unstarredIcon').hide();
        $item('#starredIcon').show();
    });
    $item('#starredIcon').onClick(() => {
        savedata('unstar', itemData._id);
        $item('#starredIcon').hide();
        $item('#unstarredIcon').show();
    });
    $item('#messageContainer').onClick(() => {
        threadIndexNum = index;
        console.log(index);
        editRepeater(itemData._id);
        console.log(itemData._id);
    });
    $item('#messageContent').text = he.decode(itemData.textContent.replace(/(<([^>]+)>)/ig, "").replace(/(&rsquo;)/ig, "'").replace(/\r?\n/g, "")).slice(0, 20);
    const itemArray = person.messagesData.filter(obj => obj.id === itemData._id);
    if (itemArray.length > 0) {
        if (itemArray[0].starred === true) {
            $item('#starredIcon').show();
            $item('#unstarredIcon').hide();
        } else {
            $item('#starredIcon').hide();
            $item('#unstarredIcon').show();
        }
        if (itemArray[0].read === false) {
            $item('#unreadIndicatorBox').show();
        }
    } else {
        /*
        threadCounted++;
        $item('#starredIcon').hide();
        $item('#unstarredIcon').show();
        $item('#unreadIndicatorBox').show();
        person.messagesData.push({
            "id": itemData._id,
            "starred": false,
            "read": false,
            "category": "inbox"
        });
        console.log('yes');
        console.log(person.messagesData);
        if (threadCounted === threadCount) {
            $w('#dynamicDataset').setFieldValues({
                "messagesData": person.messagesData
            });
            $w('#dynamicDataset').save();
        } else {
            console.log(threadCounted + 'A');
        }
        */
    }
    if (index === 0) {
        //editRepeater(itemData._id);
    }
}

function editRepeater(itemId) {
    /*
    if (formFactor === 'Mobile') {
        $w('#lessonColumn').collapse();
        $w('#materialsColumn').expand();
    }
    */
    //$w('#threadDataset').setCurrentItemIndex(threadIndexNum);
    $w("#threadLineRepeater").forEachItem(($item, itemData, index) => {
        if (itemData._id === itemId) {
            //$item('#iconBox').style.backgroundColor = '#00A2FF';
            /*
            $item('#nameTxt').html = `<h6 style="color: #00A2FF; font-size:18px;">${$item('#nameTxt').text}</h6>`;
            $item('#subjectLineTopic').html = `<h6 style="color: #00A2FF; font-size:16px;">${$item('#subjectLineTopic').text}</h6>`;
            $item('#messageContent').html = `<p2 style="color: #00A2FF; font-size:16px;">${$item('#messageContent').text}</p2>`;
            */
            $item('#messageContainer').background.src = 'https://static.wixstatic.com/media/2dcc6c_df6123451dd64254a1c485c53cc17e3e~mv2.png';
            savedata('read', itemId).then((res) => {
                if (res.status === true){
                    console.log('Saved!');
                    $w('#threadDataset').setCurrentItemIndex(threadIndexNum);
                }
            })
            $item('#unreadIndicatorBox').hide();
        } else {
            /*
            $item('#nameTxt').html = `<h6 style="color: #000000; font-size:18px;">${$item('#nameTxt').text}</h6>`;
            $item('#subjectLineTopic').html = `<h6 style="color: #757575; font-size:16px;">${$item('#subjectLineTopic').text}</h6>`;
            $item('#messageContent').html = `<p2 style="color: #757575; font-size:16px;">${$item('#messageContent').text}</p2>`;
            */
            $item('#messageContainer').background.src = 'https://static.wixstatic.com/media/2dcc6c_3ef08e60987b4f0aa963f1c0471e39f8~mv2.png';
            //$item('#iconBox').style.backgroundColor = '#7F808A';
            //$item('#activityTitleTxt').html = `<h4 style="color: #000000; font-size:18px;">${itemData.title}</h4>`;

        }
    });

}

export function filterInput_input(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        if (event.target.value !== '') {
            $w('#subjectText, #actionGroup, #column20').collapse();
            filterMessages($w('#filterInput').value);
        } else {
            filterMessages(null);
            $w('#subjectText, #actionGroup, #column20').expand();
        }
    }, 500);
}

function filterMessages(input) {
    $w('#messagesDataset').setFilter(wixData.filter().contains("textContent", input).or(wixData.filter().contains("subject", input)));
}

export function prevButton_click(event) {
    $w('#prevButton').hide();
    filterMessages(null);
}

export function saveasDraft_click(event) {
    $w('#sendButton').enable();
    let recipientArray = $w('#recipientTags').options.map(obj => (obj.value));
    let allPeopleArray = recipientArray;
    allPeopleArray.push('7f66e91a-a2db-46b9-8df5-4a812a54c6f9'); //wixUsers.currentUser.id);
    $w('#messagesDataset').setFieldValues({
        "fromPerson": '7f66e91a-a2db-46b9-8df5-4a812a54c6f9', //wixUsers.currentUser.id,
        "published": false
    });
    $w('#messagesDataset').save().then(() => {
        wixData.replaceReferences("Messages", "toPeople", $w('#messagesDataset').getCurrentItem()._id, recipientArray).then(() => {
            console.log('successtoPeople');
            console.log($w('#recipientTags').value);
            wixData.replaceReferences("Messages", "allPeople", $w('#messagesDataset').getCurrentItem()._id, allPeopleArray).then(() => {
                console.log('successAllPeople');
                console.log(allPeopleArray);
                generateSuccess('Message has been succesfully saved.');
                $w('#recipientTags').options = [];
                $w('#stateboxMail').changeState('Read');
            }).catch((error) => {
                generateError('Unable to Save Message. Please Try again later.')
            })
        }).catch((error) => {
            generateError('Unable to Send Message. Please Try again later.')
        })
    }).catch((error) => {
        generateError('Unable to Send Message. Please Try again later.')
    })
}

export async function categorySwitcherDropdown_change(event) {
    const allThreadsData = await $w('#threadDataset').getItems(0, 12);
    const allThreads = allThreadsData.items;
    switch (event.target.value) {
    case 'Inbox':
        console.log('Inbox');
        const filteredThreadsInbox = allThreads.filter((thread) => {
            const personMessageDataItem = person.messagesData.filter((obj) => obj.id === thread._id)[0];
            return person.messagesData.filter((obj) => obj.id === thread._id).length > 0 && personMessageDataItem.category === 'inbox';
        });
        $w('#threadLineRepeater').data = filteredThreadsInbox;
        break;
    case 'Starred':
        const filteredThreadsStarred = allThreads.filter((thread) => {
            const personMessageDataItem = person.messagesData.filter((obj) => obj.id === thread._id)[0];
            return person.messagesData.filter((obj) => obj.id === thread._id).length > 0 && personMessageDataItem.starred === true;
        });
        $w('#threadLineRepeater').data = filteredThreadsStarred;
        break;
    case 'Archived':
        console.log('Archived');
        const filteredThreadsArchived = allThreads.filter((thread) => {
            const personMessageDataItem = person.messagesData.filter((obj) => obj.id === thread._id)[0];
            return person.messagesData.filter((obj) => obj.id === thread._id).length > 0 && personMessageDataItem.category === 'archived';
        });
        $w('#threadLineRepeater').data = filteredThreadsArchived;
        break;
    }
}

export function archiveButton_click(event) {
    $w('#threadLineRepeater').data = $w('#threadLineRepeater').data.filter((obj) => obj._id !== $w('#threadDataset').getCurrentItem()._id);
	savedata('archive', $w('#threadDataset').getCurrentItem()._id);
    threadIndexNum = 0;
}

export function deleteButton_click(event) {
    $w('#threadLineRepeater').data = $w('#threadLineRepeater').data.filter((obj) => obj._id !== $w('#threadDataset').getCurrentItem()._id);
	savedata('delete', $w('#threadDataset').getCurrentItem()._id);
    threadIndexNum = 0;
}

export function forwardButton_click(event) {
	setUpNewMessage('Forward', $w('#threadDataset').getCurrentItem()._id);
}