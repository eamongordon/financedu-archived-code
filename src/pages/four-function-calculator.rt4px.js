// API Reference: https://www.wix.com/velo/reference/api-overview/introduction
// “Hello, World!” Example: https://learn-code.wix.com/en/article/1-hello-world

let prevSelectedValue = null;

$w.onReady(function () {
	oneselectionTagLimit();
});

async function oneselectionTagLimit() {
    let tags = $w('#keypadtags');
    if (tags.value.length === 1) {
        prevSelectedValue = tags.value[0];
    } else if (tags.value.length > 1) {
        // If multiple tags are selected by default, deselect all of them (since there's no good reason to prefer one of them over the others).
        tags.value = [];
    }
    let tagse = $w('#equationtags');
    if (tagse.value.length === 1) {
        prevSelectedValue = tagse.value[0];
    } else if (tagse.value.length > 1) {
        // If multiple tags are selected by default, deselect all of them (since there's no good reason to prefer one of them over the others).
        tagse.value = [];
    }
};

export function keypadtags_change(event) {
    if (!event.target.value || event.target.value.length === 0) {
        // Re-apply the previously selected tag.
        event.target.value = [prevSelectedValue];
        // Replace the previously selected tag with the newly selected one.
    } else {
        // Note: Array.filter() was added in ES7. Only works in some browsers.
        event.target.value = event.target.value.filter(x => x !== prevSelectedValue);
        prevSelectedValue = event.target.value[0];
    }
	$w('#equationtags').selectedIndices = [];
	if ($w('#keypadtags').value[0] === 'clear'){
		$w('#principleInput').value = null;
	} else {
	let newvalue = $w('#principleInput').value.toString() + ($w('#keypadtags').value);
	$w('#principleInput').value = newvalue
	};
}

export function equationtags_change(event) {
    if (!event.target.value || event.target.value.length === 0) {
        // Re-apply the previously selected tag.
        event.target.value = [prevSelectedValue];
        // Replace the previously selected tag with the newly selected one.
    } else {
        // Note: Array.filter() was added in ES7. Only works in some browsers.
        event.target.value = event.target.value.filter(x => x !== prevSelectedValue);
        prevSelectedValue = event.target.value[0];
    }
	$w('#keypadtags').selectedIndices = [];
	if ($w('#equationtags').value[0] === 'equals'){
		let resultnum = eval($w('#principleInput').value)
        /*
        .catch(error => {
            $w('#principleInput').style.borderColor = 'red'
        } );
        */
		$w('#principleInput').value = resultnum;
	} else {
	let newvalue = $w('#principleInput').value.toString() + ($w('#equationtags').value);
	$w('#principleInput').value = newvalue
	}
}

export function principleInput_keyPress(event) {
  if(event.key === "Enter"){
	let resultnum = eval($w('#principleInput').value);
	$w('#principleInput').value = resultnum;  
  }
}