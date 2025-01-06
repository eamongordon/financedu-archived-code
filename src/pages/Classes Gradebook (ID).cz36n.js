import wixLocation from 'wix-location';
import { formFactor } from 'wix-window';

let assignments;

$w.onReady(async function () {
});

export async function assignmentsDataset_ready() {
    const res = await $w('#assignmentsDataset').getItems(0, 12);
    assignments = res;
    $w('#progressBar').targetValue = assignments.items.length;
    /*
    defaultOpts.push(...res.items.map(region => {
        return { "value": region._id, "label": region.title };
    }));
	*/
    let tablecolumns = $w('#table').columns;
    let tablecolumnwidth;
    if (formFactor !== 'Mobile') {
        if (res.items.length < 9) {
            tablecolumnwidth = Math.floor(705 / res.items.length);
        } else {
            tablecolumnwidth = 100;
        }
    } else {
        if (res.items.length < 3) {
            tablecolumnwidth = 200 / Math.floor(res.items.length);
        } else {
            tablecolumnwidth = 100;
        }
    }
    tablecolumns.push(...res.items.map(assignment => {
        return { "id": assignment._id, "dataPath": assignment._id, "label": `${assignment.title} (Out of ${assignment.maxScore.toString()})`, "width": tablecolumnwidth, "visible": true, "type": "richText" };
    }));
    $w('#table').columns = tablecolumns;
}

export function gradebookButton_click(event) {
    console.log('enabled');
}

/**
*	Adds an event handler that runs when a table cell is selected.
	[Read more](https://www.wix.com/corvid/reference/$w.Table.html#onCellSelect)
*	 @param {$w.TableCellEvent} event
*/
export function table_cellSelect(event) {
    let cellColId = event.cellColumnId; // "columnId_b2b3-87d9-49250"
    let cellData = event.cellData; // "John"
    let cellRowIndex = event.cellRowIndex
    if (cellData) {
        if (cellColId !== 'Student') {
            console.log(cellColId);
            console.log($w('#table').columns);
            //wixLocation.to(`/assignments/grade/${cellColId}?student=${$w('#table').rows[cellRowIndex].submissionId}`);
        }
    }
}

export async function submissionsDataset_ready() {
    $w('#submissionsDataset').getItems(0, 50).then(async function (submissions) {
        setTimeout(async function () {
            /*
            function getSubmissionScore(assignmentId) {
                const filteredsubmissions = submissions.items.filter(item => item.assignment === assignmentId);
                if (filteredsubmissions.length > 0) {
                    const score = filteredsubmissions[0].totalScore.toString();
                    console.log(score + 'yes');
                    return score;
                } else {
                    console.log('no' + filteredsubmissions.length);
                    return '1';
                }
            }
            */
            /*
            let defaultRows = $w('#table').rows;
            const options = defaultRows.map((element) => ({
                ...element,
                score: submissions;
            }));
            */
            let tableRows = $w('#table').rows;
            tableRows.forEach(async function (tablerow, index) {
                $w('#table').columns.forEach(async function (assignmentelement) {
                    const targetedField = assignmentelement.id;
                    const filteredsubmissions = submissions.items.filter(item => item.assignment === targetedField && item.student === tablerow.studentId);
                    const sub = filteredsubmissions[0];
                    if (filteredsubmissions.length > 0) {
                        let txtColor;
                        const filteredassignments = assignments.items.filter(item => item._id === targetedField);
                        const dueDate = new Date(filteredassignments[0].dueDate);
                        const submittedDate = new Date(sub.dateFinished);
                        const dueDateTimestamp = (dueDate).getTime();
                        const submittedTimeStamp = submittedDate.getTime();
                        if (dueDateTimestamp - submittedTimeStamp < 0) {
                            txtColor = '#FEC178';
                        } else {
                            txtColor = '#757575';
                        }
                        if (sub.gradingComplete === true) {
                            const score = sub.totalScore.toString();
                            tablerow[targetedField] = `<p style="color: ${txtColor}; font-size:18px;"><span style="font-size:18px;">${score}</span></p>`; //submissionscore//await getSubmissionScore(targetedField);
                            tablerow.submissionId = sub._id;
                        } else {
                            tablerow[targetedField] = `<p style="color: ${txtColor}; font-size:21px;"><span style="font-size:21px;">✎</span></p>`;
                            tablerow.submissionId = sub._id;
                        }
                    } else {
                        const filteredassignments = assignments.items.filter(item => item._id === targetedField);
                        const dueDate = new Date(filteredassignments[0].dueDate);
                        const now = new Date();
                        const dueDateTimestamp = (dueDate).getTime();
                        const nowTimeStamp = now.getTime();
                        if (dueDateTimestamp - nowTimeStamp < 0) {
                            tablerow[targetedField] = '<p style="color: #ff412b; font-size:18px;"><span style="font-size:18px;">M</span></p>';
                        }
                    }
                });
                if (index + 1 === $w('#table').rows.length) {
                    $w('#loadingGif, #progressBar').hide();
                    $w('#table').show();
                } else {
                    $w('#progressBar').value = index + 1;
                }
            });
            $w("#table").rows = tableRows; //$w("#table").updateRow(0, {"0b81c0fa-c4c8-4f2b-b88f-b5268f295fcc": '10'});
        }, 500);
        /*
        setTimeout(async function () {
            $w("#table").updateRow(0, {"0b81c0fa-c4c8-4f2b-b88f-b5268f295fcc": '10'});
        }, 2000);
        */
    });
}

export async function peopleDataset_ready() {
    const studentlist = await $w('#peopleDataset').getItems(0, 100);
    $w('#table').rows = studentlist.items.map((student) => ({ "student": student.name, "studentId": student._id }));
    //$w('#progressBar').value = $w('#progressBar').targetValue / 4;
}

/*
export async function loadingBarAnimation() {
    let inverval_timer;
    //Time in milliseconds [1 second = 1000 milliseconds ]    
    inverval_timer = setInterval(function () {
        if ($w('#progressBar').value === $w('#progressBar').targetValue){
            $w('#progressBar').value = 0;
        } else {
            $w('#progressBar').value = $w('#progressBar').targetValue;
        }
    }, 500);
}
*/

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