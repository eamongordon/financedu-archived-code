import { lightbox } from 'wix-window'
let debounceTimer;

let currIndex = -1;
let listSize = 3;

$w.onReady(() => {
    const recieved = lightbox.getContext();
    recieved.students.length = 3;
    $w('#recipientsRepeater').data = recieved.students;
    if (recieved.selectedStudents) {
        const studentList = recieved.students.filter((obj) => recieved.selectedStudents.includes(obj._id));
        $w('#recipientTags').options = studentList.map((obj) => { return { "value": obj._id, "label": `${obj.name} ⓧ` } });
        $w('#recipientTxt, #recipientTags').expand();
        $w('#titleText').text = "Manage Students";
    }
});

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
            $w('#recipientsContainer').background.src = 'https://static.wixstatic.com/media/2dcc6c_df6123451dd64254a1c485c53cc17e3e~mv2.png';
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

export function recipientsRepeater_itemReady($item, itemData, index) {
    $item('#studentNameTxt').text = itemData.name;
    $item("#recipientsContainer").onClick((event) => {
        addRecipient(itemData._id, itemData.name);
    });
}

export function recipientTags_change(event) {
    const filteredArray = $w('#recipientTags').options.filter(obj => obj.value !== event.target.value[0]);
    const recieved = lightbox.getContext();
    if (recieved.selectedStudents) {
        if ($w('#recipientTags').options.length === 1) {
            $w('#recipientTags').value = [];
        } else {
            $w('#recipientTags').options = filteredArray;
        }
    } else {
        $w('#recipientTags').options = filteredArray;
        if ($w('#recipientTags').options.length === 0) {
            $w('#recipientTags').collapse();
            $w('#recipientInput').placeholder = 'Type in a Name...';
        }
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
    const students = lightbox.getContext().students;
    let filteredStudents = students.filter((obj) => obj.name.toLowerCase().includes(name.toLowerCase()));
    if (filteredStudents.length > 3) {
        filteredStudents.length = 3;
    }
    $w('#recipientsRepeater').data = filteredStudents;
}

function refreshItemsColors() {
    $w('#recipientsRepeater').forEachItem(($item, itemData, index) => {
        if (index === currIndex) {
            $item('#recipientsContainer').background.src = 'https://static.wixstatic.com/media/2dcc6c_3ef08e60987b4f0aa963f1c0471e39f8~mv2.png';
        } else {
            $item('#recipientsContainer').background.src = 'https://static.wixstatic.com/media/2dcc6c_df6123451dd64254a1c485c53cc17e3e~mv2.png';
        }
    });
}

export function confirm_click(event) {
    const sendData = $w('#recipientTags').options.map((obj) => obj.value);
    lightbox.close({ data: sendData });
}

export function cancel_click(event) {
    lightbox.close();
}