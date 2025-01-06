import wixLocation from 'wix-location';

$w.onReady(function () {
	let section = wixLocation.query.section;
	if (section){
		$w(`#${section}`).scrollTo();
	}
});