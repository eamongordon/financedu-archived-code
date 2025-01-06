import { fetchStatistics, fetchPeople } from 'backend/organizations.jsw';
import { getRouterData, copyToClipboard, openLightbox, formFactor } from 'wix-window';
import { generateError, generateSuccess } from 'public/statusbox.js';
import { getMemberData } from 'public/memberFunctions.js';
import wixData from 'wix-data';
import wixLocation from 'wix-location';
import wixAnimations from 'wix-animations';

let organization;

$w.onReady(function () {
    const routerData = getRouterData();
    organization = routerData.organization;
    $w('#title').text = organization.title;
    //Load Settings
    loadSettings();
    //
    $w('#tabsBox').onChange((event) => {
        if (event.target.currentTab.label === 'Statistics') {
            loadStatistics();
        } else if (event.target.currentTab.label === 'People') {
            loadPeople();
        } else if (event.target.currentTab.label === 'Suborganizations') {
            loadOrganizations();
        }
    });
});

function loadSettings() {
    $w('#districtNameInput').value = organization.title;
    $w('#codetxt').text = organization.code;
    $w('#coverImg').src = organization.coverImage;
    $w('#createdtxt').text = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(organization._createdDate['$date']));
    $w('#settingstatebox').changeState('Settings');
}

function loadStatistics() {
    fetchStatistics(organization._id).then((res) => {
        $w('#instructorCount').text = res.instructorCount.toString();
        $w('#studentCount').text = res.studentCount.toString();
        $w('#classCount').text = res.classCount.toString();
        $w('#statisticsStatebox').changeState('statistics');
    });
}

function loadPeople() {
    fetchPeople(organization._id).then((res) => {
        $w('#peopleStatebox').changeState('people');
        const students = res.students;
        const instructors = res.instructors;
        const admins = res.administrators;
        if (admins.length === 1) {
            $w('#adminCountTxt').text = admins.length + '  Administrators';
        } else {
            $w('#adminCountTxt').text = admins.length + '  Administrators';
        }
        if (students.length === 1) {
            $w('#studentsCountTxt').text = students.length + '  Student';
        } else {
            $w('#studentsCountTxt').text = students.length + '  Students';
        }
        if (instructors.length === 1) {
            $w('#instructorsCountTxt').text = instructors.length + '  Instructor';
        } else {
            $w('#instructorsCountTxt').text = instructors.length + '  Instructors';
        }
        let studentDataArr = [];
        let instructorDataArr = [];
        while (students.length) {
            studentDataArr.push(students.splice(0, 2));
        }
        while (instructors.length) {
            instructorDataArr.push(instructors.splice(0, 2));
        }
        $w('#repeaterAdmin').data = admins || [];
        $w('#repeaterInstructors').data = instructorDataArr[0] || [];
        $w('#repeaterStudents').data = studentDataArr[0] || [];
        let segmentedFilteredInstructorData = [];

        function filterInstructorData() {
            const filteredCourseData = instructorDataArr.flat().filter((obj) => obj.name.toLowerCase().includes($w('#instructorSearch').value.toLowerCase()) || obj.email.toLowerCase().includes($w('#instructorSearch').value.toLowerCase()));
            segmentedFilteredInstructorData = [];
            while (filteredCourseData.length) {
                segmentedFilteredInstructorData.push(filteredCourseData.splice(0, 2));
            }
            $w('#instructorPagination').currentPage = 1;
            $w('#instructorPagination').totalPages = (segmentedFilteredInstructorData.length === 0) ? 1 : segmentedFilteredInstructorData.length;
            $w('#repeaterInstructors').data = segmentedFilteredInstructorData[0] || [];
        }
        let segmentedFilteredStudentData = [];

        function filterStudentData() {
            const filteredCourseData = studentDataArr.flat().filter((obj) => obj.name.toLowerCase().includes($w('#studentSearch').value.toLowerCase()) || obj.email.toLowerCase().includes($w('#studentSearch').value.toLowerCase()));
            segmentedFilteredStudentData = [];
            while (filteredCourseData.length) {
                segmentedFilteredStudentData.push(filteredCourseData.splice(0, 2));
            }
            $w('#studentPagination').currentPage = 1;
            $w('#studentPagination').totalPages = (segmentedFilteredStudentData.length === 0) ? 1 : segmentedFilteredStudentData.length;
            $w('#repeaterStudents').data = segmentedFilteredStudentData[0] || [];
        }
        $w('#instructorPagination').onChange((event) => {
            if ($w('#instructorSearch').value.length > 0) {
                $w('#repeaterInstructors').data = segmentedFilteredInstructorData[event.target.currentPage - 1];
            } else {
                $w('#repeaterInstructors').data = segmentedFilteredInstructorData[event.target.currentPage - 1];
            }
            $w('#repeaterInstructors').data = segmentedFilteredInstructorData[event.target.currentPage - 1];
        });
        $w('#studentPagination').onChange((event) => {
            if ($w('#studentSearch').value.length > 0) {
                $w('#repeaterStudents').data = segmentedFilteredInstructorData[event.target.currentPage - 1];
            } else {
                $w('#repeaterStudents').data = segmentedFilteredInstructorData[event.target.currentPage - 1];
            }
            $w('#repeaterStudents').data = segmentedFilteredInstructorData[event.target.currentPage - 1];
        });
        $w('#studentPagination').currentPage = 1;
        $w('#studentPagination').totalPages = (studentDataArr.length === 0) ? 1 : studentDataArr.length;
        $w('#instructorPagination').currentPage = 1;
        $w('#instructorPagination').totalPages = (instructorDataArr.length === 0) ? 1 : instructorDataArr.length;
        let debounceTimer;
        $w('#instructorSearch').onInput((event) => {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
                debounceTimer = undefined;
            }
            debounceTimer = setTimeout(() => {
                filterInstructorData();
            }, 500);
        });
        $w('#studentSearch').onInput((event) => {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
                debounceTimer = undefined;
            }
            debounceTimer = setTimeout(() => {
                filterStudentData();
            }, 500);
        });
    });
}
/*
async function queryCourses() {
    $w('#statebox').changeState('Loading');
    let dropdownOptions = $w('#courseSeriesDropdown').options;
    if (dropdownOptions.length < 2) { dropdownOptions.unshift({ 'label': 'All', 'value': null }) };
    $w('#courseSeriesDropdown').options = dropdownOptions;
    if (!coursesDataArr.length) {
        coursesDataArr = [];
        const res = (await wixData.query("Courses").find());
        while (res.items.length) {
            coursesDataArr.push(res.items.splice(0, 2));
        }
    }
    $w('#coursePagination').onChange((event) => {
        if ($w('#courseSearch').value.length > 0 || $w('#courseSeriesDropdown').value) {
            $w('#courseRepeater').data = segmentedFilteredCoursesData[event.target.currentPage - 1];
        } else {
            $w('#courseRepeater').data = coursesDataArr[event.target.currentPage - 1];
        }
        $w('#courseRepeater').data = coursesDataArr[event.target.currentPage - 1];
    });
    let segmentedFilteredCoursesData = [];
    $w('#courseSearch').onInput((event) => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = undefined;
        }
        debounceTimer = setTimeout(() => {
            filterCourseData();
        }, 500);
    });
    $w('#courseSeriesDropdown').onChange((event) => {
        filterCourseData();
    });

    function filterCourseData() {
        const filteredCourseData = coursesDataArr.flat().filter((obj) => obj.title.toLowerCase().includes($w('#courseSearch').value.toLowerCase()) && obj.series.includes($w('#courseSeriesDropdown').value));
        segmentedFilteredCoursesData = [];
        while (filteredCourseData.length) {
            segmentedFilteredCoursesData.push(filteredCourseData.splice(0, 2));
        }
        $w('#coursePagination').currentPage = 1;
        $w('#coursePagination').totalPages = (segmentedFilteredCoursesData.length === 0) ? 1 : segmentedFilteredCoursesData.length;
        $w('#courseRepeater').data = segmentedFilteredCoursesData[0] || [];
    }
    $w('#coursePagination').currentPage = 1;
    $w('#coursePagination').totalPages = (coursesDataArr.length === 0) ? 1 : coursesDataArr.length;
    $w('#courseRepeater').data = coursesDataArr[0] || [];
    $w('#statebox').changeState('Courses');
}
*/

export function showStudents_click(event) {
    if ($w('#repeaterStudents').collapsed) {
        $w('#repeaterStudents, #studentSearchGroup, #studentPagination').expand();
        $w('#showStudents').label = "- Hide";
    } else {
        $w('#repeaterStudents, #studentSearchGroup, #studentPagination').collapse();
        $w('#showStudents').label = "+ Show";
    }
}

export function showInstructors_click(event) {
    if ($w('#repeaterInstructors').collapsed) {
        $w('#repeaterInstructors, #instructorSearchGroup, #instructorPagination').expand();
        $w('#showInstructors').label = "- Hide";
    } else {
        $w('#repeaterInstructors, #instructorSearchGroup, #instructorPagination').collapse();
        $w('#showInstructors').label = "+ Show";
    }
}

export function repeaterAdmin_itemReady($item, itemData) {
    $item('#adminName').text = `${itemData.firstName} ${itemData.lastName}`;
    $item('#adminEmail').text = itemData.email;
    if (itemData.profilePhoto) {
        $item('#adminPhoto').src = itemData.profilePhoto;
    }
}

export function repeaterStudents_itemReady($item, itemData) {
    $item('#studentName').text = `${itemData.firstName} ${itemData.lastName}`;
    $item('#studentEmail').text = itemData.email;
    if (itemData.profilePhoto) {
        $item('#studentProfilePhoto').src = itemData.profilePhoto;
    }
}

export function repeaterInstructors_itemReady($item, itemData) {
    $item('#instructorName').text = `${itemData.firstName} ${itemData.lastName}`;
    $item('#instructorEmail').text = itemData.email;
    if (itemData.profilePhoto) {
        $item('#instructorProfilePhoto').src = itemData.profilePhoto;
    }
}

export function uploadButtonCoverImage_change(event) {
    $w("#uploadButtonCoverImage").uploadFiles()
        .then((uploadedFiles) => {
            organization.coverImage = uploadedFiles[0].fileUrl;
        })
        .catch((uploadError) => {
            generateError("There was an error uploading this file.", uploadError)
            let errCode = uploadError.errorCode; // 7751
            let errDesc = uploadError.errorDescription; // "Error description"
        });
}

let debounceTimer;

export function districtNameInput_keyPress(event) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        organization.title = event.target.value;
    }, 500);
}

export function saveSettingsButton_click(event) {
    $w('#saveSettingsButton').disable();
    return wixData.update("Organizations", organization).then(() => {
        $w('#title').text = organization.title;
        generateSuccess('Settings successfully updated');
    }).catch((error) => {
        generateError('Something went wrong. Try again.', error);
        console.log(error);
    }).finally(() => {
        $w('#saveSettingsButton').enable();
    })
}
export function discardSettingsButton_click(event) {
    organization = getRouterData().organization;
    loadSettings();
}
export function copyInviteLinkTxt_click(event) {
    copyToClipboard(`https://www.learn.financedu.org/classinvite?code=${$w('#codetxt').text}`).then(() => {
        generateSuccess('Invite Link Copied!');
    }).catch((error) => {
        generateError('Unable to Copy Link. Try again.');
    })
}

export function deleteOrganization_click(event) {
    openLightbox("Delete Confirmation", { confirmText: `Are you sure you want to delete "${organization.title}"`, infoMessage: "All associated sub-organizations and classes will be deleted." }).then((data) => {
        if (data.confirmed) {
            return wixData.remove("Organization", organization._id).then(() => {
                wixLocation.to('/account/organization');
            });
        }
    });
}

export async function leaveOrganization_click(event) {
    openLightbox("Delete Confirmation", { confirmText: `Are you sure you want to leave "${organization.title}"`, infoMessage: "You can rejoin this organization later.", confirmButtonLabel: "Leave" }).then(async (data) => {
        if (data.confirmed) {
            const memberId = await getMemberData('_id');
            return wixData.removeReference("Organizations", "administrators", organization._id, memberId).then(() => {
                wixLocation.to('/account/organization');
            });
        }
    });
}

async function loadOrganizations() {
    let organizations = await wixData.queryReferenced("Organizations", organization._id, 'subOrganizations');
    let organizationsItems = organizations.items;
    while (organizations.hasNext()) {
        organizations = await organizations.next();
        organizationsItems = organizationsItems.concat(organizations.items);
    }
    organizationsItems = organizationsItems.map((item) => {
        return { ...item, role: 'Administrator' }
    });
    $w('#organizationRepeater').data = organizationsItems;
    if (organizationsItems.length > 0) {
        $w('#organizationStatebox').changeState('Organizations');
        if ($w('#organizationRepeater').data.length === 1) {
            $w('#organizationCountText').text = `1 Organization`;
        } else {
            $w('#organizationCountText').text = `${$w('#organizationRepeater').data.length} Organizations`;
        }
    } else {
        $w('#organizationStatebox').changeState('NoOrganizations')
    }
}

/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/

let contextIndex;

export function threeDotsMenu_click(event) {
    const repeaterIndex = $w('#organizationRepeater').data.findIndex(obj => obj._id === event.context.itemId);
    contextIndex = repeaterIndex;
    const timeline = wixAnimations.timeline();
    let yOffset;
    if (formFactor === 'Mobile') {
        yOffset = 186 * repeaterIndex;
    } else {
        yOffset = 115 * repeaterIndex;
    }
    const currentOrganizationItem = $w('#organizationRepeater').data[repeaterIndex];
    if (currentOrganizationItem.role === 'Staff') {
        $w('#deleteOrganization').label = "Leave";
        $w('#schoolSettingsButton').collapse();
    }
    timeline.add($w('#contextMenu'), [{ "y": yOffset, "duration": 10 }]).play().onComplete(async () => {
        await $w('#contextMenu').show();
    });
}

/*
export function schoolSettingsButton_click(event) {
	leaveClassInstructor
}
*/

/**
*	Sets the function that runs when a new repeated item is created.
	[Read more](https://www.wix.com/corvid/reference/$w.Repeater.html#onItemReady)
*	 @param {$w.$w} $item
*/
export function organizationRepeater_itemReady($item, itemData, index) {
    if (itemData.coverImage) {
        $item('#organizationProfileImage').src = itemData.coverImage;
    }
    $item('#organizationName').text = itemData.title;
    $item('#organizationRole').text = itemData.role;
    $item('#schoolSettingsButton').link = `/organization/${itemData._id}/admin`;
    if (itemData.role === 'Administrator') {
        $w('#organizationName, #organizationRole, #organizationProfileImage').onClick(() => {
            wixLocation.to(`/organization/${itemData._id}/admin`);
        });
    }
}

export function removeButton_click(event) {
    const classObj = $w('#organizationRepeater').data.find((obj) => obj._id === $w('#organizationRepeater').data[contextIndex]._id);
    openLightbox("Delete Confirmation", { confirmText: `Are you sure you want to delete "${classObj.title}?"`, infoMessage: "You can rejoin later." }).then((data) => {
        if (data.confirmed) {
            return wixData.remove("Organizations", $w('#organizationRepeater').data[contextIndex]._id).then(() => {
                const itemToDeleteIndex = $w('#organizationRepeater').data.findIndex((obj) => obj._id === $w('#organizationRepeater').data[contextIndex]._id);
                let repeaterData = $w('#organizationRepeater').data;
                repeaterData.splice(itemToDeleteIndex, 1);
                $w('#organizationRepeater').data = repeaterData;
                $w('#contextMenu').hide();
                if (repeaterData.length === 0) {
                    $w('#organizationStatebox').changeState('NoOrganizations');
                }
                generateSuccess("Suborganization Deleted.");
            });
        }
    });

}

export async function addOrganizationButton_click(event) {
    const instructorIdsQuery = await wixData.queryReferenced("Organizations", organization._id, "administrators");
    const instructorIdList = instructorIdsQuery.items.map((obj) => obj._id);
    openLightbox("Add Organization", {
        "parentOrganization": {
            "instructorIds": instructorIdList,
            "_id": organization._id
        }
    }).then((res) => {
        let organizationRepeaterData = $w('#organizationRepeater').data;
        organizationRepeaterData.push(res.addedOrganization);
        $w('#organizationRepeater').data = organizationRepeaterData;
        if ($w('#organizationRepeater').data.length === 1) {
            $w('#organizationCountText').text = `1 Organization`;
        } else {
            $w('#organizationCountText').text = `${$w('#organizationRepeater').data.length} Organizations`;
        }
        $w('#organizationStatebox').changeState('Organizations');
    });
}

export function noOrganizationsAdd_click(event) {
    addOrganizationButton_click();
}

export function addAdminBtn_click(event) {
    openLightbox("Add Administrator", { classId: organization._id });
}