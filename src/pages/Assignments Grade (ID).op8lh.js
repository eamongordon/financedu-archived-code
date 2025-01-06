import wixData from 'wix-data';
import wixUsers from 'wix-users';
import wixLocation from 'wix-location';

let user;
let submission;
let assignment;
let classindex = wixLocation.query.classindex;
let debounceTimer;

$w.onReady(function () {
	user = wixUsers.currentUser.id;
  assignment = $w('#dynamicDataset').getCurrentItem();
  $w('#classesDataset').onReady(() => {
	loaddropdown()
  .then( () => {
  if (classindex) {
      $w('#classDropdown').selectedIndex = Number(classindex);
      classDropdown_change();
	}
  });
  });
  $w('#settingsDataset').onReady(() => {
  $w('#settingsDataset').getItems(0, 1)
  .then((settings) => {
    let setite = settings.items[0]
  $w("#submissionsDataset").onCurrentIndexChanged( (index) => {
  $w('#submissionsDataset').getItems(index, 1)
	.then((submissiont) => {
			submission = submissiont.items[0];
      //$w('#iComment').value = submission.comment;
      $w('#iComment').onChange((event) => {
          if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = undefined;
  }
  debounceTimer = setTimeout(() => {
        submission.comment = event.target.value
        wixData.update("Submissions", submission)
	        .then( (upitem) => {
            $w('#submissionsDataset').refresh();
  	      } )            
  }, 500);
      });
  $w("#repeater").onItemReady( ($item, itemData, index) => {
    let setitefield = 'maxScore' + Number(index).toString();
    $item('#maxScoreText').text = setite[setitefield].toString();
  });
  $w("#repeater").forEachItem( ($item, itemData, index) => {
	let cact = itemData;
  let submissionfield = 'data' + Number(cact.order - 1).toString();
	if (cact.type === 'text') {
		$item('#responsetext').html = submission[submissionfield];
		console.log(submission._id);
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
        if (cact.type === 'resource') {
          $item('#scoreinput').hide();
        } else {
          let submissionfield = 'score' + Number(cact.order - 1).toString();
          $item('#scoreinput').value = submission[submissionfield];
          $item('#scoreinput').onChange((event) => {
            let submissionfield = 'score' + Number(cact.order - 1).toString();
              submission[submissionfield] = Number(event.target.value),
              wixData.update("Submissions", submission)
	            .then( (upitem) => {
                $w('#submissionsDataset').refresh();
                /*
		            $item('#submissionsDataset').refresh();
                $item('#scoreinput').value = upitem[submissionfield];
                */
  	          } )
            });
      }
	});
  } );
  });
});
});
});


async function loaddropdown() {
    await $w('#classesDataset').getItems(0, 12)
    .then( (res) => {
    let options = [];
    options.push(...res.items.map(region =>{
      return {"value" : region._id, "label": region.title};
    }))
    
    console.log('options')
    $w('#classDropdown').options = options
    } )
    .catch( (err) => {
    let errorMsg = err;
    console.log(errorMsg);
    } );
}

export function classDropdown_change(event) {
  $w('#submissionsDataset').setFilter(
  wixData.filter()
  .eq('class', $w('#classDropdown').value)
  )
  .then( () => {
    $w('#ListStrip').expand();
    $w('#pagination, #studentdropdown').show();
  })
}
