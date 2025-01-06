import {generateError, generateSuccess} from 'public/statusbox.js';

$w.onReady(function () {

	// Write your Javascript code here using the Velo framework API

	// Print hello world:
	// console.log("Hello world!");

	// Call functions on page elements, e.g.:
	// $w("#button1").label = "Click me!";

	// Click "Run", or Preview your site, to execute your code

});

export function savechangesButton_click(event) {
	$w('#savechangesButton').disable();
	$w('#dynamicDataset').save().then(() => {
		generateSuccess('Settings successfully saved.');
	}).catch(() => {
		generateError('An error occurred. Try again.');
	})
}