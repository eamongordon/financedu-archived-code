import wixSeo from 'wix-seo';
import wixLocation from 'wix-location';
import wixUsers from 'wix-users';
import wixData from 'wix-data';
import { generateError } from 'public/statusbox.js';

$w.onReady(function () {
	wixSeo.setTitle("Bookmarks | Financedu")
	//return loadfavcoursesrepeater();
});

async function loadfavcoursesrepeater(){
  $w('#dataset1').setFilter(
 wixData.filter()
 .eq('userId', wixUsers.currentUser.id));
}

/*
$w("#logoutButton").onClick( (event) => {
    Promise.all( [ wixLocation.to('/'), wixUsers.logout() ] );
} );
*/

export function button1_click(event) {
	return wixData.insert("People", null).catch((error) => {
    generateError(null, error)
  })
}