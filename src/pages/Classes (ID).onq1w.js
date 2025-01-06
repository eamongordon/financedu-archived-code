import wixData from 'wix-data';
import { hexToRGB } from 'public/util.js';

let prevSelectedValue = null;
let classitem;

$w.onReady(function () {
    classitem = $w('#dynamicDataset').getCurrentItem();
    $w('#assignmentsDataset').onReady(() => {
        $w('#assignmentsDataset').getItems(0, 50).then((res) => {
            console.log(res.items);
            $w('#upcomingAssignmentsRepeater').data = res.items.filter((obj) => new Date(obj.dueDate) > new Date() || !obj.dueDate);
            $w('#pastAssignmentsRepeater').data = res.items.filter((obj) => new Date(obj.dueDate) < new Date());
        });
    });
    if (classitem.color) {
        const rgbColor = hexToRGB(classitem.color, 0.8, false);
        $w('#classBox').style.backgroundColor = String(rgbColor);
        //$w('#menuTags').style.backgroundColor = classitem.color;
        //$w('#menuTags').style.borderColor = classitem.color;
    }
    loadclassInfo();
    //$w('#createdtxt').text = $w('#dynamicDataset').getCurrentItem()._createdDate.toLocaleString('en-US', { month: "short", day: "numeric", hour: "numeric", minute: "numeric"});
});

export function menuTags_change(event) {
    if (!event.target.value || event.target.value.length === 0) {
        event.target.value = [prevSelectedValue];
    } else {
        event.target.value = event.target.value.filter(x => x !== prevSelectedValue);
        prevSelectedValue = event.target.value[0];
    }
    const selectedvalue = $w('#menuTags').value[0];
    $w('#titleTxt').text = selectedvalue;
    switch (selectedvalue) {
    case 'Assignments':
        $w('#statebox').changeState("Assignments");
        break;
    case 'Students':
        $w('#statebox').changeState('Loading');
        loadstudents();
        //loadstudents().then( () => {
        //$w('#statebox').changeState("Students");
        //})
        break;
    case 'Settings':
        $w('#statebox').changeState('Settings');
        break;
    case 'Class Info':
        $w('#statebox').changeState('Info');
        break;
    }
}

export function pastAssignmentsRepeater_itemReady($item, itemData, index) {
    $w('#statebox').changeState('Assignments');
    $item('#dueDate').text = `${itemData.dueDate.toLocaleString('en-US', { month: "short", day: "numeric" })} at ${itemData.dueDate.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}`;
    $item('#startDate').text = itemData.startDate.toLocaleString('en-US', { month: "short", day: "numeric" });
}

async function loadstudents() {
    await wixData.queryReferenced("Classes", classitem._id, "students")
        .then((results) => {
            if (results.items.length === 1) {
                $w('#studentsCountTxt').text = results.items.length + '  Student';
            } else {
                $w('#studentsCountTxt').text = results.items.length + '  Students';
            }
            if (results.items.length > 0) {
                $w('#repeaterstudents').data = results.items;
                $w("#repeaterstudents").forEachItem(($item, itemData, index) => {
                    $item('#studentNameTxt').text = itemData.name;
                    if (itemData.profilePhoto) {
                        $item('#profilePicture').src = itemData.profilePhoto;
                    }
                });
                $w('#statebox').changeState("Students");
            } else {
                $w('#statusbox').show('fade', { duration: 200 });
                $w('#statustext').text = 'No Students Yet';
                setTimeout(function () {
                    $w('#statusbox').hide('fade', { duration: 200 });
                }, 3000);
            }
        })
        .catch((err) => {
            let errorMsg = err;
        });
}

async function loadclassInfo() {
    //$w('#studentstxt').text = classitem.students.length.toString();
}