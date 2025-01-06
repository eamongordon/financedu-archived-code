 import wixData from 'wix-data';
 import { hexToRGB } from 'public/util.js'
 import { generateInfo, generateError, generateSuccess } from 'public/statusbox.js';
 import wixLocation from 'wix-location';
 import { getRouterData, openLightbox, formFactor, copyToClipboard, getBoundingRect } from 'wix-window';
 import { timeline } from 'wix-animations';
 import { fetchAssignmentSubmissions } from 'backend/assignments.jsw';
 import wixAnimations from 'wix-animations';
 import { leaveClassInstructor } from 'backend/classes.jsw';

 let classitem;
 let gradebookLoaded;
 let graphLoaded;
 let rgbColor;
 let selectedcolor;
 let assignments;
 let submissions;
 let filteredAssigmentsData;

 let lastFilterTitle;
 let lastFilterPublishStatus;

 let contextIndex;

 const themecolors = [{ _id: 'FEC178' }, { _id: '13C402' }, { _id: '00B5EA' }, { _id: '00799C' }, { _id: 'ac59d9' }, { _id: '1ee8af' }, { _id: 'e8471e' }];

 $w.onReady(async function () {
     classitem = getRouterData().classInfo;
     assignments = getRouterData().assignments;
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
     //$w('#assignmentsButton').style.backgroundColor = `rgb(${Math.round(Number(rgbColor[0])*0.8)}, ${Math.round(Number(rgbColor[1])*0.8)}, ${Math.round(Number(rgbColor[2])*0.8)})`;
     $w('#newAssignment').style.backgroundColor = classitem.color;
     if (wixLocation.query.section) {
         switch (wixLocation.query.section) {
         case 'Gradebook':
             gradebookButton_click();
             break;
         case 'Analytics':
             analyticsButton_click();
             break;
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
     //loadpeople();

     //$w('#gradebookButton, #announcementButton, #assignmentsButton, #peopleButton').style.color = classitem.color;
     //$w('#boxName').style.backgroundColor = classitem.color;
 });

 export function importStudents_click(event) {
     openLightbox("Import Students", { className: classitem.title, classCode: classitem.code, classId: classitem._id });
 }

 export function addStudentButton_click(event) {
     openLightbox("Add Student", { classId: classitem._id });
 }

 async function loadpeople() {
     const students = getRouterData().people.students;
     const instructors = getRouterData().people.instructors;
     $w('#addInstructorButton, #addStudentButton').style.color = classitem.color;
     $w('#table').rows = students.items.map((student) => ({ "student": student.name, "studentId": student._id }));
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
     $w('#repeaterStudents').data = students.items;
     $w('#statebox').changeState('People');
 }

 export function repeaterStudents_itemReady($item, itemData) {
     $item('#studentName').text = `${itemData.firstName} ${itemData.lastName}`;
     $item('#studentEmail').text = itemData.email;
     if (itemData.profilePhoto) {
         $item('#studentProfilePhoto').src = itemData.profilePhoto;
     }
 }

 export function repeaterInstructors_itemReady($item, itemData) {
     $item('#instructorName').text = `${itemData.firstName} ${itemData.lastName}`;
     $item('#instructorEmail').text = itemData.email;
     if (itemData.profilePhoto) {
         $item('#instructorProfilePhoto').src = itemData.profilePhoto;
     }
 }

 export function addInstructorButton_click(event) {
     openLightbox("Add Instructor", { classId: classitem._id });
 }

 export function gradebookButton_click(event) {
     $w('#gradebookButton').style.backgroundColor = `rgb(${Math.round(Number(rgbColor[0])*0.8)}, ${Math.round(Number(rgbColor[1])*0.8)}, ${Math.round(Number(rgbColor[2])*0.8)})`;
     $w('#analyticsButton, #assignmentsButton, #peopleButton, #settingsClassroomButton').style.backgroundColor = classitem.color;
     $w('#analyticsButton, #assignmentsButton, #peopleButton, #settingsClassroomButton').enable();
     if (gradebookLoaded) {
         $w('#statebox').changeState('Gradebook');
     } else {
         $w('#statebox').changeState('Loading');
         loadGradebook();
     }
     wixLocation.queryParams.add({ section: "Gradebook" });
 }

 export function analyticsButton_click(event) {
     $w('#analyticsButton').style.backgroundColor = `rgb(${Math.round(Number(rgbColor[0])*0.8)}, ${Math.round(Number(rgbColor[1])*0.8)}, ${Math.round(Number(rgbColor[2])*0.8)})`;
     $w('#gradebookButton, #assignmentsButton, #peopleButton, #settingsClassroomButton').style.backgroundColor = classitem.color;
     $w('#gradebookButton, #assignmentsButton, #peopleButton, #settingsClassroomButton').enable();
     if (gradebookLoaded) {
         loadGraph(true);
     } else {
         loadGraph(false);
     }
     wixLocation.queryParams.add({ section: "Analytics" });
     //loadAssignments();
 }

 export function assignmentsButton_click(event) {
     $w('#assignmentsButton').style.backgroundColor = `rgb(${Math.round(Number(rgbColor[0])*0.8)}, ${Math.round(Number(rgbColor[1])*0.8)}, ${Math.round(Number(rgbColor[2])*0.8)})`;
     $w('#gradebookButton, #analyticsButton, #peopleButton, #settingsClassroomButton').style.backgroundColor = classitem.color;
     $w('#gradebookButton, #analyticsButton, #peopleButton, #settingsClassroomButton').enable();
     loadAssignments();
     wixLocation.queryParams.add({ section: "Assignments" });
 }

 export function peopleButton_click(event) {
     $w('#peopleButton').style.backgroundColor = `rgb(${Math.round(Number(rgbColor[0])*0.8)}, ${Math.round(Number(rgbColor[1])*0.8)}, ${Math.round(Number(rgbColor[2])*0.8)})`;
     $w('#gradebookButton, #analyticsButton, #assignmentsButton, #settingsClassroomButton').style.backgroundColor = classitem.color;
     $w('#gradebookButton, #analyticsButton, #assignmentsButton, #settingsClassroomButton').enable();
     loadpeople();
     wixLocation.queryParams.add({ section: "People" });
 }

 export function settingsClassroomButton_click(event) {
     $w('#settingsClassroomButton').style.backgroundColor = `rgb(${Math.round(Number(rgbColor[0])*0.8)}, ${Math.round(Number(rgbColor[1])*0.8)}, ${Math.round(Number(rgbColor[2])*0.8)})`;
     $w('#analyticsButton, #assignmentsButton, #peopleButton, #gradebookButton').style.backgroundColor = classitem.color;
     $w('#analyticsButton, #assignmentsButton, #peopleButton, #gradebookButton').enable();
     loadSettings();
     wixLocation.queryParams.add({ section: "Settings" });
 }

 async function loadSettings() {
     const rgbColor = hexToRGB(classitem.color, null, true);
     $w('#currentColor').style.backgroundColor = classitem.color;
     $w('#coverImg').src = classitem.coverImage;
     selectedcolor = $w('#currentColor').style.backgroundColor;
     $w('#CEPickerBackground').on('change', ({ detail }) => {
         selectedcolor = detail;
         classitem.color = selectedcolor;
         $w("#htmlStripGradient").postMessage([selectedcolor, hexToRGB(selectedcolor, 0.75)]);
         const newrgbColor = hexToRGB(selectedcolor, null, true);
         $w("#stripHtml").postMessage(selectedcolor);
         $w('#settingsClassroomButton').style.backgroundColor = `rgb(${Math.round(Number(newrgbColor[0])*0.8)}, ${Math.round(Number(newrgbColor[1])*0.8)}, ${Math.round(Number(newrgbColor[2])*0.8)})`;
         $w('#analyticsButton, #gradebookButton, #assignmentsButton, #peopleButton').style.backgroundColor = classitem.color;
         $w('#currentColor').style.backgroundColor = detail;
         $w('#txtCustomColorIndicator').text = detail.toUpperCase();
         updateColorRepeater(null);
         $w('#customColorBox').style.borderColor = '#757575';
         $w('#customColorBox').style.borderWidth = '3px';
     });
     $w('#iclassName').value = classitem.title;
     $w('#codetxt').text = classitem.code;
     $w('#createdtxt').text = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(classitem._createdDate['$date']));
     $w('#colorRepeater').data = themecolors;
     $w('#statebox').changeState('Settings');
     const instructors = getRouterData().people.instructors;
     if (instructors.totalCount > 1) {
         $w('#leaveClassBtn').expand();
     }
 }

 function updateColorRepeater(noItem) {
     $w("#colorRepeater").forEachItem(($item, itemData, index) => {
         if (itemData._id !== noItem) {
             $item('#colorBox').style.borderWidth = '1px';
         }
     });
 }

 export function saveSettingsButton_click(event) {
     $w('#settingsClassroomButton').disable();
     return wixData.update("Classes", classitem).then(() => {
         $w('#classTitle').text = classitem.title;
         generateSuccess('Settings successfully updated');
     }).catch((error) => {
         generateError('Something went wrong. Try again.');
         console.log(error);
     }).finally(() => {
         $w('#settingsClassroomButton').enable();
     })
 }

 export function discardSettingsButton_click(event) {
     classitem = getRouterData().classInfo;
     loadSettings();
 }

 export function copyInviteLinkTxt_click(event) {
     copyToClipboard(`https://www.financedu.org/join-class?code=${$w('#codetxt').text}`).then(() => {
         generateSuccess('Invite Link Copied!');
     }).catch(() => {
         generateError('Unable to Copy Link. Try again.');
     })
 }

 export function colorRepeater_itemReady($item, itemData, index) {
     $item('#colorBox').style.backgroundColor = '#' + itemData._id;
 }

 export function colorBox_click(event) {
     let $item = $w.at(event.context);
     $w('#currentColor').style.backgroundColor = $item('#colorBox').style.backgroundColor;
     $item('#colorBox').style.borderWidth = '3px';
     selectedcolor = $item('#colorBox').style.backgroundColor;
     classitem.color = selectedcolor;
     $w("#htmlStripGradient").postMessage([selectedcolor, hexToRGB(selectedcolor, 0.75)]);
     const newrgbColor = hexToRGB(selectedcolor, null, true);
     $w("#stripHtml").postMessage(selectedcolor);
     $w('#settingsClassroomButton').style.backgroundColor = `rgb(${Math.round(Number(newrgbColor[0])*0.8)}, ${Math.round(Number(newrgbColor[1])*0.8)}, ${Math.round(Number(newrgbColor[2])*0.8)})`;
     $w('#analyticsButton, #gradebookButton, #assignmentsButton, #peopleButton').style.backgroundColor = classitem.color;
     $w('#customColorBox').style.borderColor = '#F3F3F3';
     $w('#customColorBox').style.borderWidth = '2px';
     updateColorRepeater($w('#currentColor').style.backgroundColor.substring(1));
 }

 async function loadGraph(initialized, type) {
     if (!initialized) {
         $w('#statebox').changeState('Loading');
         graphLoaded = true;
     }
     $w('#menuselectiontags').style.backgroundColor = classitem.color;
     $w('#menuselectiontags').style.borderColor = classitem.color;
     if (!submissions) {
         submissions = await fetchAssignmentSubmissions([classitem._id]);
     }
     let filteredSubmissions = [];
     submissions.forEach((sub) => {
         if (!filteredSubmissions.some((obj) => obj._owner)) {
             filteredSubmissions.push(sub);
         }
     });
     //let assignmentGroups = [];
     if (type === 'accuracy') {
         let chartData = [];
         assignments.items.forEach((assignment) => {
             const submissionsList = filteredSubmissions.filter((sub) => sub.assignment === assignment._id && sub.gradingComplete === true);
             let averageAccuracy = 0;
             submissionsList.forEach((submission) => {
                 averageAccuracy += ((submission.accuracy / submissionsList.length) * 100);
             });
             chartData.push({ "label": assignment.title, "data": averageAccuracy });
         });
         /*
         assignmentSubmissions.forEach((submission, index, array) => {
             const assignmentGroupIndex = assignmentGroups.findIndex((obj) => obj._id === submission._id);
             if (assignmentGroupIndex !== -1) {
                 assignmentGroups[assignmentGroupIndex].assignmentSubmissions.push(submission)
             } else {
                 const assignmentObj = assignments.items.filter((obj) => obj._id === submission._id)
                 assignmentGroups.push({
                     "_id": submission._id,
                     "title": assignmentObj.title,
                     "assignmentSubmissions": [submission]
                 })
             }
         });
         assignmentGroups.forEach((item, index, array) => {
             let totalPointAccuracy = 0;
             item.assignmentSubmissions.forEach((submission) => {
                 totalPointAccuracy += submission.accuracy
             });
             const finalAccuracy = totalPointAccuracy / item.assignmentSubmissions.length;
             chartData.push({ "label": item.title, "data": finalAccuracy });
         });
         */
         const accuracyData = chartData.map((obj) => obj.data);
         const labels = chartData.map(obj => obj.label);
         $w('#CustomElement1').setAttribute('chart-data', JSON.stringify({
             labels,
             datasets: [{ label: 'Accuracy', data: accuracyData, backgroundColor: '#13c402', borderRadius: 4 }]
         }));
         $w('#CustomElement1').setAttribute('y-max', 100);
     } else {
         let submittedData = [];
         let lateData = [];
         let missingData = [];
         let unsubmittedData = [];
         assignments.items.forEach((assignment) => {
             const assignmentSubmissions = filteredSubmissions.filter((obj) => obj.assignment === assignment._id);
             let submittedCount = 0;
             let lateCount = 0;
             let missingCount = 0;
             let unsubmittedCount = 0;
             assignmentSubmissions.forEach((submission) => {
                 let assignmentGroup;
                 const assignment = assignments.items.find((obj) => obj._id === submission.assignment);
                 if (assignment.assignData.some((obj) => obj.students.includes(submission._owner))) {
                     assignmentGroup = assignment.assignData.find((obj) => obj.students.includes(submission._owner));
                 } else {
                     assignmentGroup = assignment.assignData[0];
                 }
                 if (submission.submitted) {
                     if (assignmentGroup.dueDates.enabled) {
                         if (new Date(assignmentGroup.dueDates.dueDate).getTime() < new Date(submission.submittedDate).getTime()) {
                             lateCount += 1;
                         } else {
                             submittedCount += 1;
                         }
                     } else {
                         submittedCount += 1
                     }
                 } else {
                     if (assignmentGroup.dueDates.enabled) {
                         if (new Date(assignmentGroup.dueDates.dueDate).getTime() < new Date(submission.submittedDate).getTime()) {
                             missingCount += 1;
                         } else {
                             unsubmittedCount += 1;
                         }
                     } else {
                         unsubmittedCount += 1
                     }
                 }
             });
             submittedData.push(submittedCount);
             lateData.push(lateCount);
             missingData.push(missingCount);
             unsubmittedData.push(unsubmittedCount);
         });
         const labels = assignments.items.map(obj => obj.title);
         $w('#CustomElement1').setAttribute('chart-data', JSON.stringify({
             labels,
             datasets: [{ label: 'Submitted', data: submittedData, backgroundColor: '#13c402' }, { label: 'Late', data: lateData, backgroundColor: 'orange' }, { label: 'Missing', data: missingData, backgroundColor: 'red' }, { label: 'Unsubmitted', data: unsubmittedData, backgroundColor: 'gray' }]
         }));
         $w('#CustomElement1').setAttribute('y-max', null);
     }
     $w('#statebox').changeState('Analytics');
     $w('#CustomElement1').show();
 }

 export function threeDotsMenu_click(event) {
     const repeaterIndex = $w('#assignmentsRepeater').data.findIndex(obj => obj._id === event.context.itemId);
     contextIndex = repeaterIndex;
     //memory.setItem("prevUrl", wixLocation.url);
     //$w('#previewButton').link = `/activity/${$w('#assignmentsRepeater').data[contextIndex]._id}`;
     /*
     if (repeaterIndex + 1 === $w('#assignmentsRepeater').data.length) {
         $w('#moveDown, #moveBottom').disable();
         $w('#moveUp, #moveTop').enable();
     } else {
         $w('#moveDown, #moveBottom').enable();
         if (repeaterIndex === 0) {
             $w('#moveUp, #moveTop').disable();
         } else {
             $w('#moveUp, #moveTop').enable();
         }
     }
     */
     const timeline = wixAnimations.timeline();
     let yOffset;
     if (formFactor === 'Mobile') {
         yOffset = 96 * repeaterIndex;
     } else {
         yOffset = 96 * repeaterIndex
     }
     timeline.add($w('#contextMenu'), [{ "y": yOffset, "duration": 10 }]).play().onComplete(async () => {
         await $w('#contextMenu').show();
         $w('#settingsButton').link = `/assignment/${event.context.itemId}/instructor`;
         $w('#previewButton').link = `/assignment/${event.context.itemId}/take`;
     });
 }

 export function contextMenu_mouseOut(event) {
     $w('#contextMenu').hide();
 }

 function loadAssignments() {
     $w('#assignmentsRepeater').data = assignments.items;
     $w('#statebox').changeState('Assignments');
 }

 export function assignmentsRepeater_itemReady($item, itemData, index) {
     $item('#assignmentTitle').html = `<h4 class="wixui-rich-text__text" style="line-height:normal; font-size:24px;"><a href="/assignment/${itemData._id}/instructor" target="_self" class="wixui-rich-text__text"><span style="letter-spacing:normal;" class="wixui-rich-text__text">${itemData.title}</span></a></h4>`;
     const now = new Date();
     const classDefaultAssignmentGroup = itemData.assignData.find((obj) => obj.students.length === 0);
     if (itemData.published) {
         $item('#published').show();
         if (classDefaultAssignmentGroup.availability.limitAvailability) {
             if (now.getTime() > classDefaultAssignmentGroup.availability.startDate.getTime()) {
                 $item('#statusLine').style.backgroundColor = '#3BDE2C';
                 if (classDefaultAssignmentGroup.dueDates.enabled) {
                     $item('#assignmentSubtext').text = 'Due ' + new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(classDefaultAssignmentGroup.dueDates.dueDate));
                 } else {
                     $item('#assignmentSubtext').text = 'Available Until ' + new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(classDefaultAssignmentGroup.availability.endDate));
                 }
             } else {
                 $item('#statusLine').style.backgroundColor = '#c7c7c7';
                 $item('#assignmentSubtext').text = 'Available After ' + new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(classDefaultAssignmentGroup.availability.startDate));
             }
         } else {
             $item('#statusLine').style.backgroundColor = '#3BDE2C';
             $item('#assignmentSubtext').text = 'Always Available';
         }
     } else {
         $item('#assignmentSubtext').text = 'Unpublished';
         $item('#unpublished').show();
     }

 }

 async function loadGradebook() {
     if (!submissions) {
         submissions = await fetchAssignmentSubmissions([classitem._id]);
     }
     console.log('loadgradebook1');
     $w('#legendButton, #helpGradebookButton').style.backgroundColor = classitem.color;
     //$w('#table').rows = students.items.map((student) => ({ "student": student.name, "studentId": student._id }));
     let tablecolumns = $w('#table').columns;
     let tablecolumnwidth;
     const filteredAssignmentItems = assignments.items.filter((assignment) => assignment.published);
     if (formFactor !== 'Mobile') {
         if (assignments.items.length < 9) {
             tablecolumnwidth = Math.floor(705 / filteredAssignmentItems.length);
         } else {
             tablecolumnwidth = 100;
         }
     } else {
         if (assignments.items.length < 3) {
             tablecolumnwidth = 200 / Math.floor(filteredAssignmentItems.length);
         } else {
             tablecolumnwidth = 100;
         }
     }
     tablecolumns.push(...filteredAssignmentItems.map(assignment => {
         return { "id": assignment._id, "dataPath": assignment._id, "label": `${assignment.title}`, "width": tablecolumnwidth, "visible": true, "type": "richText" };
     }));
     $w('#table').columns = tablecolumns;
     const routerData = getRouterData();
     $w('#table').rows = routerData.people.students.items.map((tablerow, index) => {
         tablerow.student = `${tablerow.firstName} ${tablerow.lastName}`;
         console.log("tableRow", tablerow)
         console.log("tableColumns", tablecolumns)
         tablecolumns.forEach(async function (assignmentelement) {
             const targetedField = assignmentelement.id;
             const filteredsubmissions = submissions.filter(item => item.assignment === targetedField && item.student === tablerow.studentId);
             const sub = filteredsubmissions[0];
             const filteredassignments = assignments.items.filter(item => item._id === targetedField);
             if (filteredassignments.length > 0) {
                 if (filteredsubmissions.length) {
                     let txtColor;
                     let dueDate;
                     if (filteredassignments[0].assignData.some((obj) => obj.students.includes(sub._owner))) {
                         dueDate = new Date(filteredassignments[0].assignData.find((obj) => obj.students.includes(sub._owner)).dueDate);
                     } else {
                         dueDate = new Date(filteredassignments[0].assignData[0].dueDate);
                     }
                     const submittedDate = new Date(sub.dateFinished);
                     const dueDateTimestamp = (dueDate).getTime();
                     const submittedTimeStamp = submittedDate.getTime();
                     if (dueDateTimestamp - submittedTimeStamp < 0) {
                         txtColor = '#FEC178';
                     } else {
                         txtColor = '#757575';
                     }
                     if (sub.gradingComplete === true) {
                         const score = Math.round(sub.accuracy * 100).toString();
                         tablerow[targetedField] = `<p style="color: ${txtColor}; font-size:18px;"><span style="font-size:18px;">${score}</span></p>`; //submissionscore//await getSubmissionScore(targetedField);
                         tablerow.submissionId = sub._id;
                     } else {
                         tablerow[targetedField] = `<p style="color: ${txtColor}; font-size:21px;"><span style="font-size:21px;">✎</span></p>`;
                         tablerow.submissionId = sub._id;
                     }
                 } else {
                     let dueDate;
                     if (filteredassignments[0].assignData.some((obj) => obj.students.includes(tablerow.studentId))) {
                         dueDate = new Date(filteredassignments[0].assignData.find((obj) => obj.students.includes(tablerow.studentId)).dueDate);
                     } else {
                         dueDate = new Date(filteredassignments[0].assignData[0].dueDate);
                     }
                     const now = new Date();
                     const dueDateTimestamp = (dueDate).getTime();
                     const nowTimeStamp = now.getTime();
                     if (dueDateTimestamp - nowTimeStamp < 0) {
                         tablerow[targetedField] = '<p style="color: #ff412b; font-size:18px;"><span style="font-size:18px;">M</span></p>';
                     }
                 }
             }
         });
         return tablerow;
     }); //$w("#table").updateRow(0, {"0b81c0fa-c4c8-4f2b-b88f-b5268f295fcc": '10'});
     console.log('loadgradebook2')
     console.log("modifiedTableRows", $w("#table").rows)
     $w('#statebox').changeState('Gradebook');
     gradebookLoaded = true;
 }

 /**
 *	Adds an event handler that runs when a table cell is selected.
 	[Read more](https://www.wix.com/corvid/reference/$w.Table.html#onCellSelect)
 *	 @param {$w.TableCellEvent} event
 */
 export function table_cellSelect(event) {
     let cellColId = event.cellColumnId; // "columnId_b2b3-87d9-49250"
     let cellData = event.cellData; // "John"
     let cellRowIndex = event.cellRowIndex;
     if (cellData) {
         //TODO FIX
         /*
         console.log($w('#table').columns);
         console.log($w('#table').rows);
         if (cellColId !== 'student') {
             wixLocation.to(`/assignment/${cellColId}/instructor?section=Grading&submissionOwner=${$w('#table').rows[cellRowIndex]._id}`);
             //wixLocation.to(`/assignments/grade/${cellColId}?student=${$w('#table').rows[cellRowIndex].submissionId}`);
         }
         */
     }
 }

 export function legendButton_click(event) {
     if ($w('#legendTitle').isVisible) {
         $w('#legendTitle, #legendKey, #hideLegend').collapse();
     } else {
         $w('#legendTitle, #legendKey, #hideLegend').expand();
     }
 }

 export function hideLegend_click(event) {
     $w('#legendTitle, #legendKey, #hideLegend').collapse();
 }

 export function uploadButtonCoverImage_change(event) {
     $w("#uploadButtonCoverImage").uploadFiles()
         .then((uploadedFiles) => {
             classitem.coverImage = uploadedFiles[0].fileUrl;
         })
         .catch((uploadError) => {
             let errCode = uploadError.errorCode; // 7751
             let errDesc = uploadError.errorDescription; // "Error description"
         });
 }

 let debounceTimer;

 export function iclassName_keyPress(event, $w) {
     if (debounceTimer) {
         clearTimeout(debounceTimer);
         debounceTimer = undefined;
     }
     debounceTimer = setTimeout(() => {
         classitem.title = event.target.value;
     }, 500);
 }

 export async function unpublished_click(event) {
     let $item = $w.at(event.context);
     let assignment = assignments.items.find((obj) => obj._id == event.context.itemId);
     const referencedItemQuery = await wixData.queryReferenced("Assignments", assignment._id, "Activities");
     if (referencedItemQuery.totalCount > 0) {
         try {
             assignment.published = true;
             wixData.update("Assignments", assignment);
             generateSuccess("Assignment Published");
             $item('#unpublished').hide();
             $item('#published').show();
             const now = new Date();
             const classDefaultAssignmentGroup = assignment.assignData.find((obj) => obj.students.length === 0);
             if (classDefaultAssignmentGroup.availability.limitAvailability) {
                 if (now.getTime() > classDefaultAssignmentGroup.availability.startDate.getTime()) {
                     $item('#statusLine').style.backgroundColor = '#3BDE2C';
                     if (classDefaultAssignmentGroup.dueDates.enabled) {
                         $item('#assignmentSubtext').text = 'Due ' + new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(classDefaultAssignmentGroup.dueDates.dueDate));
                     } else {
                         $item('#assignmentSubtext').text = 'Available Until ' + new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(classDefaultAssignmentGroup.availability.endDate));
                     }
                 } else {
                     $item('#statusLine').style.backgroundColor = '#c7c7c7';
                     $item('#assignmentSubtext').text = 'Available After ' + new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(classDefaultAssignmentGroup.availability.startDate));
                 }
             } else {
                 $item('#statusLine').style.backgroundColor = '#3BDE2C';
                 $item('#assignmentSubtext').text = 'Always Available';
             }
         } catch (error) {
             generateError(null, error);
         }
     } else {
         generateError("No activities are in this lesson. You must add activities before publishing the assignment.");
     }
 }

 export function published_click(event) {
     let $item = $w.at(event.context)
     let assignment = assignments.items.find((obj) => obj._id == event.context.itemId);
     assignment.published = false;
     return wixData.update("Assignments", assignment).then(() => {
         generateSuccess("Assignment Unpublished");
         $item('#published').hide();
         $item('#unpublished').show();
         $item('#statusLine').style.backgroundColor = '#c7c7c7';
         $item('#assignmentSubtext').text = 'Unpublished';
     }).catch(() => {
         generateError();
     });
 }

 export function newAssignment_click(event) {
     openLightbox("New Assignment", { classId: classitem._id }).then((res) => {
         if (res?.newAssignment) {
             let repeaterData = $w('#assignmentsRepeater').data;
             repeaterData.unshift(res.newAssignment);
             $w('#assignmentsRepeater').data = repeaterData;
         }
     });
 }

 export function deleteAssignment_click(event) {
     let repeaterData = $w('#assignmentsRepeater').data;
     const itemId = repeaterData[contextIndex]._id;
     //const repeaterIndex = repeaterData.findIndex((obj) => obj._id === event.context.itemId);
     repeaterData.splice(contextIndex, 1);
     $w('#assignmentsRepeater').data = repeaterData;
     $w("#contextMenu").hide();
     return wixData.remove("Assignments", itemId).then(() => {
         generateSuccess('Assignment Deleted');
     }).catch((error) => {
         console.log(error);
         generateError();
     })
 }

 export function mobileMenuButton_click(event) {
     if ($w('#bottomStrip').collapsed) {
         $w('#bottomStrip').expand();
         $w('#mobileMenuButton').label = "Hide Menu";
     } else {
         $w('#bottomStrip').collapse();
         $w('#mobileMenuButton').label = "Show Menu";
     }
 }

 let prevSelectedValueMenu = 'completion';

 export function menuselectiontags_change(event) {
     if (!event.target.value || event.target.value.length === 0) {
         // Re-apply the previously selected tag.
         event.target.value = [prevSelectedValueMenu];
         // Replace the previously selected tag with the newly selected one.
     } else {
         // Note: Array.filter() was added in ES7. Only works in some browsers.
         event.target.value = event.target.value.filter(x => x !== prevSelectedValueMenu);
         prevSelectedValueMenu = event.target.value[0];
     }
     const selectedvalue = $w('#menuselectiontags').value[0];
     loadGraph(true, selectedvalue);
 }

 export function deleteClass_click(event) {
     openLightbox("Delete Confirmation", { confirmText: `Are you sure you want to delete "${classitem.title}"`, infoMessage: "All associated assignments and submissions will be deleted." }).then((data) => {
         if (data.confirmed) {
             return wixData.remove("Classes", classitem._id).then(() => {
                 wixLocation.to('/account/classes');
             });
         }
     });
 }

 export function leaveClassBtn_click(event) {
     openLightbox("Delete Confirmation", { confirmText: `Are you sure you want to leave "${classitem.title}"`, infoMessage: "You can rejoin later.", confirmButtonLabel: "Leave" }).then((data) => {
         if (data.confirmed) {
             leaveClassInstructor(classitem._id).then(() => {
                 wixLocation.to('/account/classes');
             });
         }
     });
 }

 export function titleInput_keyPress(event) {
     if (debounceTimer) {
         clearTimeout(debounceTimer);
         debounceTimer = undefined;
     }
     debounceTimer = setTimeout(() => {
         /*
         filteredAssigmentsData = undefined;
         filteredAssigmentsData = assignments.items.filter((obj) => obj.title.toLowerCase().includes(event.target.value.toLowerCase()));
         */
         filter(event.target.value, lastFilterPublishStatus);
         $w('#assignmentsRepeater').data = filteredAssigmentsData;
     }, 500);
 }

 export function sortDropdown_change(event) {
     let assignmentDataToSort;
     if (filteredAssigmentsData) {
         assignmentDataToSort = filteredAssigmentsData;
     } else {
         assignmentDataToSort = assignments.items;
     }
     switch (event.target.value) {
     case 'newestFirst':
         $w('#assignmentsRepeater').data = assignmentDataToSort.sort(function (a, b) {
             return new Date(b._createdDate['$date']) - new Date(a._createdDate['$date']);
         });
         break;
     case 'oldestFirst':
         $w('#assignmentsRepeater').data = assignmentDataToSort.sort(function (a, b) {
             return new Date(a._createdDate['$date']) - new Date(b._createdDate['$date']);
         });
         break;
     case 'lastUpdatedFirst':
         $w('#assignmentsRepeater').data = assignmentDataToSort.sort((a, b) =>
             new Date(b._updatedDate['$date']) - new Date(a._updatedDate['$date'])
         );
         break;
     case 'a-z':
         $w('#assignmentsRepeater').data = assignmentDataToSort.sort(function (a, b) {
             var textA = a.title.toUpperCase();
             var textB = b.title.toUpperCase();
             return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
         });
         break;
     case 'z-a':
         $w('#assignmentsRepeater').data = assignmentDataToSort.sort(function (a, b) {
             var textA = a.title.toUpperCase();
             var textB = b.title.toUpperCase();
             return (textA > textB) ? -1 : (textA < textB) ? 1 : 0;
         });
         break;
     case 'default':
         $w('#assignmentsRepeater').data = assignmentDataToSort.sort(function (a, b) {
             return new Date(b._createdDate['$date']) - new Date(a._createdDate['$date']);
         });
         break;
     }
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

 function filter(title, publishStatus) {
     if (lastFilterTitle !== title || lastFilterPublishStatus !== publishStatus) {
         filteredAssigmentsData = assignments.items;
         if (title)
             filteredAssigmentsData = filteredAssigmentsData.filter((obj) => obj.title.toLowerCase().includes(title.toLowerCase()));
         if (publishStatus)
             filteredAssigmentsData = filteredAssigmentsData.filter((obj) => obj.published === publishStatus);
         if (publishStatus === false)
             filteredAssigmentsData = filteredAssigmentsData.filter((obj) => obj.published === false);
         lastFilterTitle = title;
         lastFilterPublishStatus = publishStatus;
     }
 }

 export function publishSelectionTags_change(event) {
     if (event.target.value.length === 2 || event.target.value.length === 0) {
         filter(lastFilterTitle, null);
     } else {
         if (event.target.value[0] === 'published') {
             filter(lastFilterTitle, true);
         } else {
             filter(lastFilterTitle, false);
         }
     }
     $w('#assignmentsRepeater').data = filteredAssigmentsData;
 }

 export function clearFiltersBtn_click(event) {
     $w('#titleInput').value = null;
     $w('#publishSelectionTags').value = [];
     filter(null, null);
     $w('#assignmentsRepeater').data = assignments.items;
 }

 /*
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
             fetchActivities();
         });
     } else {
         dateRange = eventDateRange(event.target.value);
         fetchActivities();
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
 */