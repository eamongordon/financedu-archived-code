import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { hexToRGB } from 'public/util.js';
import { generateError, generateSuccess } from 'public/statusbox.js';
import { getRouterData, formFactor, copyToClipboard, getBoundingRect } from 'wix-window';
import { timeline } from 'wix-animations'
import { getMemberData } from 'public/memberFunctions.js';
import { getClassPeople, leaveClassStudent } from 'backend/classes.jsw';
import { openLightbox } from 'wix-window';

let prevSelectedValue = null;
let peopleLoaded;
let submissions;
let memberId;
let classitem;
let assignments;
let rgbColor;

let lastFilterTitle;
let filteredAssigmentsData;
let debounceTimer;

$w.onReady(async function () {
    const routerData = getRouterData();
    memberId = await getMemberData('_id');
    classitem = getRouterData().classInfo;
    assignments = getRouterData().assignments;
    let submissionsQuery = await wixData.query("AssignmentSubmissions").eq("_owner", memberId).find();
    submissions = submissionsQuery.items;
    while (submissionsQuery.hasNext()) {
        submissionsQuery = await submissionsQuery.next();
        submissions = submissions.concat(submissionsQuery.items);
    }
    $w('#classTitle').text = classitem.title;
    $w("#htmlStripGradient").onMessage(event => {
        $w("#htmlStripGradient").postMessage([classitem.color, hexToRGB(classitem.color, 0.75)]);
    });
    $w("#stripHtml").onMessage(event => {
        $w("#stripHtml").postMessage(classitem.color);
        $w('#topStrip, #bottomStrip').show();
        //$w('#loadingGif').hide();
    });
    rgbColor = hexToRGB(classitem.color, null, true);
    if (formFactor === 'Mobile') {
        $w("#mobileHtml1").postMessage(classitem.color);
    }
    if (formFactor === 'Mobile') {
        $w('#backButton').show();
    } else {
        const timelineBreadcrumbs = timeline();
        const windowInfo = await getBoundingRect();
        let xOffset = -(windowInfo.window.width - 980) / 2 + ((windowInfo.window.width - 980) * 0.115);
        timelineBreadcrumbs.add($w('#backButton'), [{ "x": xOffset, "duration": 10 }]).play().onComplete(async () => {
            await $w('#backButton').show();
        });
    }
    if (wixLocation.query.section) {
        switch (wixLocation.query.section) {
        case 'Assignments':
            assignmentsButton_click();
            break;
        case 'People':
            peopleButton_click();
            break;
        case 'Settings':
            settingsClassroomButton_click();
            break;
        }
    } else {
        assignmentsButton_click();
    }
    /*
     $w('#assignmentsButton').style.backgroundColor = `rgb(${Math.round(Number(rgbColor[0])*0.8)}, ${Math.round(Number(rgbColor[1])*0.8)}, ${Math.round(Number(rgbColor[2])*0.8)})`;
     $w('#newAssignment').style.backgroundColor = classitem.color;
    assignmentSubmissions = await wixData.query("Submissions").eq("_owner", memberId).find();
    $w('#upcomingAssignmentsRepeater').data = routerData.assignments.items.filter((assignment) => {
        let dueDate;
        if (assignment.assignData.some((obj) => obj.students.includes(memberId))) {
            dueDate = assignment.assignData.find((obj) => obj.students.includes(memberId)).dueDate;
        } else {
            dueDate = assignment.assignData[0].dueDate;
        }
        return new Date(dueDate) > new Date() || !dueDate
    });
    $w('#pastAssignmentsRepeater').data = routerData.assignments.items.filter((assignment) => {
        let dueDate;
        if (assignment.assignData.some((obj) => obj.students.includes(memberId))) {
            dueDate = assignment.assignData.find((obj) => obj.students.includes(memberId)).dueDate;
        } else {
            dueDate = assignment.assignData[0].dueDate;
        }
        return new Date(dueDate) < new Date()
    });
    if (classItem.color) {
        const rgbColor = hexToRGB(classItem.color, 0.8, false);
        $w('#classBox').style.backgroundColor = String(rgbColor);
        //$w('#menuTags').style.backgroundColor = classitem.color;
        //$w('#menuTags').style.borderColor = classitem.color;
    }
    $w('#codetxt').text = classItem.code;
    $w('#createdtxt').text = new Date(classItem._createdDate['$date']).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    $w('#statebox').changeState('Assignments');
    //$w('#createdtxt').text = $w('#dynamicDataset').getCurrentItem()._createdDate.toLocaleString('en-US', { month: "short", day: "numeric", hour: "numeric", minute: "numeric"});
    */
});

export function mobileMenuButton_click(event) {
    if ($w('#classeseMenuStrip').collapsed) {
        $w('#classeseMenuStrip, #stripHtml').expand();
        $w('#mobileMenuButton').label = "Hide Menu";
    } else {
        $w('#classeseMenuStrip, #stripHtml').collapse();
        $w('#mobileMenuButton').label = "Show Menu";
    }
}

export function peopleButton_click(event) {
    $w('#peopleButton').style.backgroundColor = `rgb(${Math.round(Number(rgbColor[0])*0.8)}, ${Math.round(Number(rgbColor[1])*0.8)}, ${Math.round(Number(rgbColor[2])*0.8)})`;
    $w('#assignmentsButton, #settingsClassroomButton').style.backgroundColor = classitem.color;
    $w('#assignmentsButton, #settingsClassroomButton').enable();
    if (peopleLoaded) {
        $w('#statebox').changeState('People');
    } else {
        loadpeople();
    }
    wixLocation.queryParams.add({ section: "People" });
}

export function assignmentsButton_click(event) {
    $w('#assignmentsButton').style.backgroundColor = `rgb(${Math.round(Number(rgbColor[0])*0.8)}, ${Math.round(Number(rgbColor[1])*0.8)}, ${Math.round(Number(rgbColor[2])*0.8)})`;
    $w('#peopleButton, #settingsClassroomButton').style.backgroundColor = classitem.color;
    $w('#peopleButton, #settingsClassroomButton').enable();
    loadAssignments();
    wixLocation.queryParams.add({ section: "Assignments" });
}

export function settingsClassroomButton_click(event) {
    $w('#settingsClassroomButton').style.backgroundColor = `rgb(${Math.round(Number(rgbColor[0])*0.8)}, ${Math.round(Number(rgbColor[1])*0.8)}, ${Math.round(Number(rgbColor[2])*0.8)})`;
    $w('#assignmentsButton, #peopleButton').style.backgroundColor = classitem.color;
    $w('#assignmentsButton, #peopleButton').enable();
    loadSettings();
    wixLocation.queryParams.add({ section: "Settings" });
}

async function loadSettings() {
    $w('#classTitleSettings').text = classitem.title;
    $w('#codetxt').text = classitem.code;
    $w('#createdtxt').text = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(classitem._createdDate['$date']));
    $w('#statebox').changeState('Settings');
}

function loadAssignments() {
    $w('#assignmentsRepeater').data = assignments.items;
    $w('#statebox').changeState('Assignments');
}

async function loadpeople() {
    const students = await getRouterData().people.students;
    const instructors = await wixData.queryReferenced("Classes", classitem._id, "instructors");
    if (students.totalCount === 1) {
        $w('#studentsCountTxt').text = students.items.length + '  Student';
    } else {
        $w('#studentsCountTxt').text = students.items.length + '  Students';
    }
    if (instructors.totalCount === 1) {
        $w('#instructorsCountTxt').text = instructors.items.length + '  Instructor';
    } else {
        $w('#instructorsCountTxt').text = instructors.items.length + '  Instructors';
    }
    $w('#repeaterInstructors').data = instructors.items;
    $w('#instructorsRepeaterClassInfo').data = instructors.items;
    $w('#repeaterStudents').data = students.items;
    peopleLoaded = true;
    $w('#statebox').changeState('People');
}

export function instructorsRepeaterClassInfo_itemReady($item, itemData) {
    $item('#instructorNameClassInfo').text = `${itemData.firstName} ${itemData.lastName}`;
    if (itemData.profilePhoto) {
        $item('#instructorProfileImageClassInfo').src = itemData.profilePhoto;
    }
}

export function repeaterStudents_itemReady($item, itemData) {
    $item('#studentName').text = `${itemData.firstName} ${itemData.lastName}`;
    if (itemData.profilePhoto) {
        $item('#studentProfilePhoto').src = itemData.profilePhoto;
    }
}

export function repeaterInstructors_itemReady($item, itemData) {
    $item('#instructorName').text = `${itemData.firstName} ${itemData.lastName}`;
    if (itemData.profilePhoto) {
        $item('#instructorProfilePhoto').src = itemData.profilePhoto;
    }
}

export async function assignmentsRepeater_itemReady($item, itemData, index) {
    $item('#assignmentTitle').html = `<h4 class="wixui-rich-text__text" style="line-height:normal; font-size:24px;"><a href="/assignment/${itemData._id}/preview" target="_self" class="wixui-rich-text__text"><span style="letter-spacing:normal;" class="wixui-rich-text__text">${itemData.title}</span></a></h4>`;
    $item('#unsubmitted, #submitted').link = `/assignment/${itemData._id}/preview`;
    let assignmentGroup;
    if (itemData.assignData.some((obj) => obj.students.includes(memberId))) {
        assignmentGroup = itemData.assignData.find((obj) => obj.students.includes(memberId));
    } else {
        assignmentGroup = itemData.assignData[0];
    }
    const matchingSubmissions = submissions.filter((obj) => obj.assignment === itemData._id);
    if (matchingSubmissions.length > 0) {
        if (matchingSubmissions[0].submitted) {
            //Submitted
            $item('#submitted').show();
            $item('#statusLine').style.backgroundColor = '#3BDE2C';
            console.log("submittedDate");
            console.log(matchingSubmissions[0]);
            $item('#assignmentSubtext').text = 'Submitted ' + new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(matchingSubmissions[0].submittedDate));
        } else {
            //In Progress
            $item('#unsubmitted').show();
            $item('#unsubmitted').label = "In Progress";
            $item('#unsubmitted').iconCollapsed = true;
            checkAvailability(true);
        }
    } else {
        $item('#unsubmitted').show();
        checkAvailability(false);
    }

    function checkAvailability(inProgress) {
        if (assignmentGroup.availability.limitAvailability) {
            const now = new Date();
            console.log("sssk" + assignmentGroup.availability.startDate)
            if (now.getTime() > assignmentGroup.availability.startDate.getTime()) {
                if (now.getTime() > assignmentGroup.availability.startDate.endTime()) {
                    //Past Available Range
                    $item('#statusLine').style.backgroundColor = '#C7C7C7';
                    $item('#assignmentSubtext').text = 'Assignment Unavailable';
                } else {
                    if (assignmentGroup.dueDates.enabled) {
                        if (now.getTime() > assignmentGroup.dueDates.dueDate.getTime()) {
                            //Missing Assignment
                            $item('#statusLine').style.backgroundColor = '#FF5454';
                        }
                        $item('#assignmentSubtext').text = 'Due ' + new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(assignmentGroup.dueDates.dueDate));
                    } else {
                        if (inProgress) {
                            $item('#statusLine').style.backgroundColor = '#00B5EA';
                        }
                        $item('#assignmentSubtext').text = 'Available Until ' + new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(assignmentGroup.availability.endDate));
                    }
                }
            } else {
                //Not Available Yet
                $item('#statusLine').style.backgroundColor = '#c7c7c7';
                $item('#assignmentSubtext').text = 'Available After ' + new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(assignmentGroup.availability.startDate));
            }
        } else {
            //Not Available Yet
            if (inProgress) {
                $item('#statusLine').style.backgroundColor = '#00B5EA';
            }
            $item('#assignmentSubtext').text = 'Always Available';
        }
    }

    /*
        let dueDate;
        if (itemData.assignData.some((obj) => obj.students.includes(memberId))) {
            dueDate = itemData.assignData.find((obj) => obj.students.includes(memberId)).dueDate;
        } else {
            dueDate = itemData.assignData[0].dueDate;
        }
        $item('#upcomingAssignmentTitle').text = itemData.title;
        if (dueDate) {
            $item('#upcomingAssignmentDueDate').text = `${new Date(dueDate).toLocaleDateString('en-us', { month: "short", day: "numeric" })} at ${new Date(itemData.dateFinished['$date']).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}`
        } else {
            $item('#upcomingAssignmentDueDate').collapse();
        }
        const matchingSubmission = assignmentSubmissions.items.find((submissionObj) => submissionObj.assignment === itemData._id);
        if (matchingSubmission) {
            if (matchingSubmission.submitted) {
                $item('#upcomingAssignmentStatusTxt').html = `<h6 style="font-size:16px"><span class="color_23">Completed 
    			${new Date(itemData.dateFinished['$date']).toLocaleDateString('en-us', { year: "numeric", month: "short", day: "numeric" })} at 
    			</span></h6>`;
            } else {
                $item('#upcomingAssignmentStatusTxt').text = "In Progress";
            }
        } else {
            $item('#upcomingAssignmentStatusTxt').text = "Not Started";
        }
        */
}

export function leaveClassButton_click(event) {
    openLightbox("Delete Confirmation", {
        "confirmText": "Are you sure you want to leave this class?",
        "infoMessage": "Your past assignment submissions will be deleted."
    }).then((res) => {
        if (res.confirmed === true) {
            leaveClassStudent(classitem._id).then(() => {
                wixLocation.to('/account/classes');
            }).catch((error) => {
                generateError("An error occured. Try again later.");
            });
        }
    });
}

export function copyInviteLinkTxt_click(event) {
    copyToClipboard(`https://www.financedu.org/join-class?code=${$w('#codetxt').text}`).then(() => {
        generateSuccess('Invite Link Copied!');
    }).catch(() => {
        generateError('Unable to Copy Link. Try again.');
    })
}

 export function sortButton_click(event) {
     if ($w('#filterAndSortStatebox').collapsed || $w('#filterAndSortStatebox').currentState.id !== 'Sort') {
         $w('#filterAndSortStatebox').changeState('Sort');
         $w('#filterAndSortStatebox').expand();
     } else {
         $w('#filterAndSortStatebox').collapse();
     }
 }

 export function filterButton_click(event) {
     if ($w('#filterAndSortStatebox').collapsed || $w('#filterAndSortStatebox').currentState.id !== 'Filter') {
         $w('#filterAndSortStatebox').changeState('Filter');
         $w('#filterAndSortStatebox').expand();
     } else {
         $w('#filterAndSortStatebox').collapse();
     }
 }

 function filter(title) {
     if (lastFilterTitle !== title) {
         filteredAssigmentsData = assignments.items;
         if (title)
             filteredAssigmentsData = filteredAssigmentsData.filter((obj) => obj.title.toLowerCase().includes(title.toLowerCase()));
         lastFilterTitle = title;
     }
 }

  export function titleInput_keyPress(event) {
     if (debounceTimer) {
         clearTimeout(debounceTimer);
         debounceTimer = undefined;
     }
     debounceTimer = setTimeout(() => {
         filter(event.target.value);
         $w('#assignmentsRepeater').data = filteredAssigmentsData;
     }, 500);
 }

export function clearFiltersBtn_click(event) {
	$w('#titleInput').value = null;
    filter(null);
    $w('#assignmentsRepeater').data = assignments.items;
}