import { query } from 'wix-location';
import { openLightbox } from 'wix-window';
import { authentication } from 'wix-members';
import { to } from 'wix-location';
import wixData from 'wix-data';

$w.onReady(function () {
    /*
    if (authentication.loggedIn()) {
        to('/course-catalog');
    }    
   if (query.lightbox) {
       openLightbox(query.lightbox);
   } 
   if (Intl.DateTimeFormat().resolvedOptions().timeZone.includes('Europe')){
       console.log('inEurope');
   }
   */
});


export function updateass() {
	const itemtoUpdate = {
		"_id": "6ffb5164-5c7b-45b6-8678-c9944f390382",
		"timerEndDate": "Tue Apr 03 2023 18:20:34 GMT-0700 (Pacific Daylight Time)",
		"totalScore": '7'
	}
	return wixData.update("AssignmentSubmissions", itemtoUpdate)
}

export function tempCompNickName1586161667271_click(event) {
	updateass();
}