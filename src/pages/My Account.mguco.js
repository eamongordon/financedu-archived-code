import wixUsers from 'wix-users';
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';

$w.onReady(function () {
	setTitle();
});

function setTitle() {
	wixSeo.setTitle("My Account | Financedu")
}

$w("#logoutButton").onClick( (event) => {
    Promise.all( [ wixLocation.to('/'), wixUsers.logout() ] );
} );