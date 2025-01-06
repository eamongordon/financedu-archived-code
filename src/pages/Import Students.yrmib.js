import wixData from 'wix-data';
import wixUsers from 'wix-users';
import wixWindow from 'wix-window';
import { sendStudentInvite } from 'backend/memberFunctions/classInvites.jsw'
import { fetch } from 'wix-fetch';
import { getDownloadUrlFunction } from 'backend/csvtojson.jsw';
import { generateError } from 'public/statusbox.js';

let user;
let importedData;
let temporaryFileurl;
let received;

$w.onReady(async function () {
    user = wixUsers.currentUser;
    received = wixWindow.lightbox.getContext();
    //populateclassdropdown(numb)
});

export function uploadButtonCsv_change(event) {
    $w("#uploadButtonCsv").uploadFiles()
        .then((uploadedFiles) => {
            temporaryFileurl = uploadedFiles[0].fileUrl;
            $w('#nextButton').enable();
        }).catch(() => {
            setUpError()
        })

}

/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/
async function getfileData(fileUrl) {
    //const fileUrl = 'https://2dcc6c62-bd62-4b8c-b16f-7a821c7c9db3.usrfiles.com/ugd/2dcc6c_c5067ac273c040139430412c67bfb57b.csv' //`https://static.wixstatic.com/media/${uploadedFiles[0].fileName}`;
    console.log(fileUrl);
    return fetch(fileUrl).then(r => r.text()).then(r => {
        //console.log(r.replaceAll("(?<=[a-zA-Z]),(?=\d)", " "));
        var array = r.replace(/\n/g, '').split("\r");
        console.log("fetch result: " + array);
        // All the rows of the CSV will be
        // converted to JSON objects which
        // will be added to result in an array
        let result = [];

        // The array[0] contains all the
        // header columns so we store them
        // in headers array
        let headers = array[0].split(",")
        console.log(headers);
        // Since headers are separated, we
        // need to traverse remaining n-1 rows.
        for (let i = 1; i < array.length; i++) {
            let obj = {}

            // Create an empty object to later add
            // values of the current row to it
            // Declare string str as current array
            // value to change the delimiter and
            // store the generated string in a new
            // string s
            let str = array[i]
            let s = ''

            // By Default, we get the comma separated
            // values of a cell in quotes " " so we
            // use flag to keep track of quotes and
            // split the string accordingly
            // If we encounter opening quote (")
            // then we keep commas as it is otherwise
            // we replace them with pipe |
            // We keep adding the characters we
            // traverse to a String s
            let flag = 0
            for (let ch of str) {
                if (ch === '"' && flag === 0) {
                    flag = 1
                } else if (ch === '"' && flag == 1) flag = 0
                if (ch === ', ' && flag === 0) ch = '|'
                if (ch !== '"') s += ch
            }

            // Split the string using pipe delimiter |
            // and store the values in a properties array
            let properties = s.split(",")
            // For each header, if the value contains
            // multiple comma separated data, then we
            // store it in the form of array otherwise
            // directly the value is stored
            console.log(properties);
            /*
            headers.forEach((obj, index) => {
                headers[index] = properties[0]
            });
            */

            for (let j in headers) {
                if (properties[j].includes(", ")) {
                    obj[headers[j]] = properties[j]
                        .split(",").map(item => item.trim())
                } else obj[headers[j]] = properties[j]
            }
            // Add the generated object to our
            // result array
            result.push(obj)

        }

        // Convert the resultant array to json and
        // generate the JSON output file.
        let json = JSON.stringify(result);
        importedData = result;
        return { status: true, data: result };
    });
}

async function processData(data) {
    if (data.length > 0 && Object.keys(data[0]).length > 1) {
        const dropdownoptions = Object.keys(data[0]).map((property, index) => { return { 'label': `"${property.toString()}"`, 'value': property } });
        console.log(dropdownoptions);
        $w('#emailDropdown, #nameDropdown').options = dropdownoptions;
        return { status: true };
    } else {
        throw new Error('No Students in List');
    }
}

function loadTable() {
    const tableRows = importedData.map((obj) => {
        return { 'name': obj[$w('#nameDropdown').value], 'email': obj[$w('#emailDropdown').value] }
    });
    $w('#table').rows = tableRows;
}

export function nextButton_click(event) {
    switch ($w('#stateboxImport').currentState.id) {
    case 'Upload':
        $w('#prevButton').show();
        $w('#stateboxImport').changeState('Loading');
        getDownloadUrlFunction(temporaryFileurl).then((fileUrl) => {
            getfileData(fileUrl).then((res) => {
                processData(res.data).then((res) => {
                    console.log(res);
                    $w('#nextButton').disable();
                    $w('#stateboxImport').changeState('Connect');
                }).catch((error) => {
                    setUpError()
                })
            }).catch(() => {
                setUpError();
            });
        });
        break;
    case 'Connect':
        loadTable();
        $w('#stateboxImport').changeState('Preview');
        break;
    case 'Preview':
        $w('#nextButton').disable();
        $w('#prevButton').hide();
        console.log("importedData");
        console.log(importedData);
        $w('#stateboxImport').changeState('Loading');
        importedData.forEach((obj) => {
            const email = obj[$w('#emailDropdown').value];
            sendStudentInvite(email, received.classId);
        }).then(() => {
            $w('#stateboxImport').changeState('Done');
        }).catch((err) => {
            $w('#stateboxImport').changeState('Error');
            generateError(null, err);
        })
        break;
    }
}

export function prevButton_click(event) {
    switch ($w('#stateboxImport').currentState.id) {
    case 'Error':
        $w('#stateboxImport').changeState('Upload');
        break;
    case 'Connect':
        $w('#stateboxImport').changeState('Upload');
        break;
    case 'Preview':
        $w('#stateboxImport').changeState('Preview');
        break;
    }
}

function setUpError() {
    $w('#stateboxImport').changeState('Error');
}

export function stateboxImport_change(event) {
    switch (event.currentState.id) {
    case 'Error':
        $w('#prevButton, #nextButton').hide();
        break;
    case 'Upload':
        $w('#prevButton').hide();
        $w('#nextButton').show();
        break;
    case 'Connect':
        $w('#prevButton, #nextButton').show();
        break;
    case 'Preview':
        $w('#prevButton, #nextButton').show();
        break;
    case 'Done':
        $w('#prevButton, #nextButton').hide();
        break;
    case 'Loading':
        $w('#prevButton, #nextButton').hide();
        break;
    }
}

export function nameDropdown_change(event) {
    if ($w('#nameDropdown, #emailDropdown').valid) {
        $w('#nextButton').enable();
    } else {
        $w('#nameDropdown, #emailDropdown').updateValidityIndication();
    }
}

/**
*	Adds an event handler that runs when an input element's value
 is changed.
	[Read more](https://www.wix.com/corvid/reference/$w.ValueMixin.html#onChange)
*	 @param {$w.Event} event
*/
export function emailDropdown_change(event) {
    if ($w('#nameDropdown, #emailDropdown').valid) {
        $w('#nextButton').enable();
    } else {
        $w('#nameDropdown, #emailDropdown').updateValidityIndication();
    }
}