import wixData from 'wix-data';
import { getMemberData } from 'public/memberFunctions.js';
import wixWindow from 'wix-window';

export async function addClass_click(event) {
    $w('#addClass').disable();
    const memberId = await getMemberData('_id');
    if ($w('#classNameInput').valid) {
        $w('#classNameInput').updateValidityIndication();
        let insertItem = {
            title: $w('#classNameInput').value,
            code: (Math.random() + 1).toString(36).substring(7),
            //color: `#${themecolors[Math.floor(Math.random()*themecolors.length)]._id}`,
            //coverImage: 'https://static.wixstatic.com/media/2dcc6c_720c72d402424c85984396e8bc7acaeb~mv2.jpg',
            //teacher: memberId,
        };
        return wixData.insert("Organizations", insertItem)
            .then((item) => {
                const parentOrganization = wixWindow.lightbox.getContext()?.parentOrganization;
                if (parentOrganization) {
                    wixData.insertReference("Organizations", "administrators", item._id, parentOrganization.instructorIds);
                    wixData.insertReference("Organizations", "subOrganizations", parentOrganization._id, item._id)
                } else {
                    wixData.insertReference("Organizations", "administrators", item._id, memberId);
                }
                item.role = "Administrator";
                wixWindow.lightbox.close({
                    "message": "Class successfully added",
                    "addedOrganization": item,
                    "status": true
                })
            })
    } else {
        $w('#classNameInput').updateValidityIndication();
    }
}

/*
$w.onReady(async function () {
    user = wixUsers.currentUser;
    let username = usernamemem.items[0].nickname
    wixData.query("Classes")
        .eq("_owner", user.id)
        .limit(1)
        .descending('_createdDate')
        .find()
        .then((results) => {
            if (results.items.length === 0) {
                const classcode = nanoid(8);
                $w('#classcodetxt').text = classcode
                let number = 1
                $w("#addclassbutton").onClick((event, $w) => {
                    insertClass(number, classcode)
                });
            } else {
                const lastItemInCollection = results.items[0];
                const number = `${Number(lastItemInCollection.number) + 1}`;
                const classcode = username + number.toLocaleString();
                const classname = $w('#input1').value
                $w('#classcodetxt').text = classcode
                $w("#addclassbutton").onClick((event, $w) => {
                    insertClass(number, classcode, classname);
                });
            }
        });
    wixData.query('Courses')
        .find()
        .then(res => {
            let options = [];
            options.push(...res.items.map(region => {
                return { 'value': region._id, 'label': region.title };
            }));
            $w('#dropdowncourse').options = options;
        })
});

function insertClass(number, classcode, classname) {
    let courseid = $w('#dropdowncourse').value
    wixData.queryReferenced("Courses", courseid, "assignments")
        .then((res) => {
            let lessonlist = [];
            lessonlist.push(...res.items.map(region => {
                return region._id;
            }));
            let insertItem = {
                title: classname,
                code: classcode,
                number: Number(number),
                teacher: user.id,
                course: courseid,
            };
            if ($w('#input1, #dropdowncourse').valid) {
                $w('#input1, #dropdowncourse').updateValidityIndication();
                wixData.insert("Classes", insertItem)
                    .then((results) => {
                        wixData.insertReference("Classes", "assignments", results._id, lessonlist)
                    })
                    .catch((err) => {
                        let errorMsg = err;
                        wixWindow.lightbox.close({
                            "lightBoxMessage": "Something went wrong. Please try again",
                            "color": "red"
                        })
                    });

                wixWindow.lightbox.close({
                    "lightBoxMessage": "Class succesfully added",
                    "color": "green"
                })
            } else {
                $w('#input1, #dropdowncourse').updateValidityIndication();
            }
        });
}
*/