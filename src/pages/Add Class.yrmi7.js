import wixData from 'wix-data';
import { getMemberData } from 'public/memberFunctions.js';
import wixWindow from 'wix-window';

const themecolors = [{ _id: 'FEC178' }, { _id: '13C402' }, { _id: '00B5EA' }, { _id: '00799C' }, { _id: 'ac59d9' }, { _id: '1ee8af' }, { _id: 'e8471e' }];

export async function addClass_click(event) {
    $w('#addClass').disable();
    const memberId = await getMemberData('_id');
    if ($w('#classNameInput').valid) {
        $w('#classNameInput').updateValidityIndication();
        let insertItem = {
            title: $w('#classNameInput').value,
            code: (Math.random() + 1).toString(36).substring(7),
            color: `#${themecolors[Math.floor(Math.random()*themecolors.length)]._id}`,
            coverImage: 'https://static.wixstatic.com/media/2dcc6c_23884012a0a043bdbdc51dcab124b8e6~mv2.jpg',
            teacher: memberId,
        };
        return wixData.insert("Classes", insertItem)
            .then((item) => {
                return wixData.insertReference("Classes", "instructors", item._id, memberId).then(() => {
                    wixWindow.lightbox.close({
                        "message": "Class successfully added",
                        "addedClass": item,
                        "status": true
                    })
                })
            })
            .catch((err) => {
                let errorMsg = err;
                wixWindow.lightbox.close({
                    "message": "Something went wrong. Please try again",
                    "status": false
                })
            });

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