/*
import wixUsers from 'wix-users';

$w.onReady(function () {
  $w('#submit').onClick( () => {
    let emails = [];
    let labels = [];  
      
    emails.push($w('#email').value);
      
    const position = $w('#posdropdown').value;  

    // calculate the proper height label
    if(position ==== 'Educator'){
      labels.push("Educator");
    } else if (position ==== 'Parent') {
      labels.push("Parent");
    } else if (position ==== 'Student') {
      labels.push("Student");
	  } else if (position === 'Youth Program Staff') {
      labels.push(position ==== 'Youth Program Staff');
	  console.log('succesful')
    } else {
      labels.push("Other");
    }

    // register as member using form data
    wixUsers.register($w('#email').value, $w('#password').value, {
      "contactInfo": {
        "firstName": $w('#firstName').value,
        "lastName": $w('#lastName').value,
        "emails": emails,
        "labels": labels,
      }
    });
      
  });
});
*/