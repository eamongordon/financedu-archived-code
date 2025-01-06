import wixData from 'wix-data';
import wixLocation from 'wix-location';

let assignment
let submission;
let submissionfield;

$w.onReady(function () {
	assignment = $w('#dynamicDataset').getCurrentItem();
});

export function repeater_itemReady($item, itemData, index) {
	let cact = itemData;
	$w('#submissionsDataset').getItems(0, 1)
	.then((submissiont) => {
			submission = submissiont.items[0];
			submissionfield = 'data' + Number(cact.order - 1).toString();
	if (cact.type === 'text') {
		$item('#responsetext').html = submission[submissionfield];
		console.log(submission[submissionfield]);
	} else if (cact.type === 'quiz') {
		$item('#responsetext').text = cact.data.options[Number(submission[submissionfield])].label;
	} else if (cact.type === 'dropdown') {
		$item('#responsetext').text = cact.data.options[Number(submission[submissionfield])].label;
	} else if (cact.type === 'checkbox') {
		
	} else if (cact.type === 'link') {
		$item('#responsetext').text = submission[submissionfield];
	} else if (cact.type === 'fileupload') {
		console.log('file')
	}
	$item('#editButton').onClick( (event) => {
		wixLocation.to(`/assignments/take/${assignment._id}?activity=${Number(cact.order - 1)}`);
	} );
	});
}

export function submitButton_click(event) {
	wixData.get("Submissions", submission._id)
  	.then( (item) => {
      item.submitted = true,
	  item.attempts = item.attempts + 1;
      wixData.update("Submissions", item)
	  .then( (upitem) => {
		 $w('#submissionsDataset').refresh();
		 wixLocation.to(assignment['link-assignments-1-title'])
  	  } )
	})
	gradeassignment();
}

function gradeassignment() {
	$w('#dynamicDataset').getItems(0, 1)
	.then((activity) => {
	$w("#repeater").forEachItem( ($item, itemData, index) => {	


	} );
}