import { getJSON } from 'wix-fetch';
import { generateToken } from '@prospectorminerals/memberfunctions-backend';
import { ok, next, notFound, redirect, sendStatus, forbidden, WixRouterSitemapEntry } from "wix-router";
import { fbLoginLogin, fbLoginSignup, enableFacebookLoginRouter } from '@prospectorminerals/facebookoauth-backend';
import { enableGoogleLoginRouter } from '@prospectorminerals/google-oauth-sso-backend';
import { sortArray } from 'public/util.js';
import wixData from 'wix-data';
//import {ok, notFound, WixRouterSitemapEntry} from "wix-router"; 
const suppressHooksandAuth = { suppressAuth: true, suppressHooks: true };
const suppressAuth = { suppressAuth: true };

export async function ssologin_reciever_Router(request) {
    //if (request.env === 'browser'){
    let memberdata = await getJSON(`https://prospectorminerals.wixsite.com/financedu/_functions/userinfo?${request.query.token}`);
    let tokenitem = await generateToken(memberdata.userData.email, { firstName: memberdata.userData.name.first, lastName: memberdata.userData.name.last });
    let sessionToken = tokenitem.sessionToken;
    return redirect(`https://prospectorminerals.wixsite.com/learn/social-login?ssotoken=${sessionToken}`);
    //}
}

/*
export function ssologin_reciever_SiteMap(request) { 
 //Add your code for this event here: 
 }
 */
export async function invite_beforeRouter(request) {
    if (request.path[0]) {
        const pageList = ["instructor", "admin"];
        if (pageList.includes(request.path[0])) {
            return next();
        } else {
            return notFound();
        }
    } else {
        return notFound();
    }
}

export async function invite_Router(request) {
    if (request.path[0] === 'instructor') {
        const inviteInfo = await wixData.get("ClassInvitations", request.query.inviteId, suppressHooksandAuth)
        const classInfo = await wixData.get("Classes", inviteInfo['class'], suppressHooksandAuth);
        const data = {
            classInfo: classInfo
        }
        const seoData = {
            title: 'Join Class | Financedu',
            noIndex: true,
        };
        if (inviteInfo) {
            return ok("classinvite-instructor", data, seoData);
        } else {
            return notFound();
        }
    } else if (request.path[0] === 'admin') {
        const inviteInfo = await wixData.get("OrganizationInvitations", request.query.inviteId, suppressHooksandAuth);
        const classInfo = await wixData.get("Organizations", inviteInfo['class'], suppressHooksandAuth);
        const data = {
            organization: classInfo
        }
        const seoData = {
            title: 'Join Organization | Financedu',
            noIndex: true,
        };
        if (inviteInfo) {
            return ok("admininvite-page", data, seoData);
        } else {
            return notFound();
        }
    }
    /*
    if (request.user.role === 'Visitor') {
        const seoData = {
            title: 'Financedu Login',
            noIndex: true,
        };
        const data = {
            email: request.query.email,
        };
        return ok("classinvite-page", data, seoData);
    } else {
        return redirect("https://financedu.org/join-class");
    }
    */
}

export async function fblogin_Router(request) {
    //if (request.env === 'backend') {
    if (request.query.v === 'login') {
        return fbLoginLogin(request);
    } else if (request.query.v === 'signup') {
        return fbLoginSignup(request);
    } else if (request.query.v === 'enable') {
        return enableFacebookLoginRouter(request).catch((error) => {
            sendStatus("500", error);
        });
    }
    //}
}

export async function enableGoogleLogin_Router(request) {
    return enableGoogleLoginRouter(request).catch((error) => {
        sendStatus("500", error);
    });
}

export function invite_SiteMap(request) {
    //Add your code for this event here: 
}

export function landing_Router(request) {
    const user = request.user;
    if (user.role === 'Visitor') {
        return ok('landing-page');
    } else {
        return redirect('/course-catalog');
    }
}

export function landing_SiteMap(request) {
    //Add your code for this event here: 
}

export async function parentinvite_Router(request) {
    if (request.query.inviteId) {
        try {
            const seoData = {
                title: 'Grant Parent Access | Financedu',
                noIndex: true,
            };
            const queryResults = await wixData.query("ParentInvitations").eq("_id", request.query.inviteId).descending("_createdDate").find(suppressAuth);
            if (queryResults.items.length > 0) {
                if (request.user.id) {
                    if (queryResults.items[0].childMemberId === request.user.id) {
                        const requestDateFormatted = queryResults.items[0]._createdDate.toLocaleDateString('en-us', { year: "numeric", month: "long", day: "numeric" });
                        const routerData = {
                            "parentName": queryResults.items[0].parentName,
                            "parentEmail": queryResults.items[0].parentEmail,
                            "requestDateFormatted": requestDateFormatted,
                            "childMemberId": queryResults.items[0].childMemberId,
                            "parentMemberId": queryResults.items[0].parentMemberId,
                            "inviteId": queryResults.items[0]._id
                        }
                        return ok("parentinvite-page", routerData, seoData);
                    } else {
                        return forbidden();
                    }
                } else {
                    const routerData = {
                        "inviteId": queryResults.items[0]._id
                    }
                    return ok("parentinvite-page", routerData);
                }
            } else {
                return notFound("The invitation you've provided does not exist or is expired");
            }
        } catch (error) {
            return sendStatus("500");
        }
    } else {
        return sendStatus("400", "No Invite ID provided");
    }
}

export function parentinvite_SiteMap(request) {
    //Add your code for this event here: 
}

export async function childprogress_Router(request) {
    try {
        const parents = await wixData.queryReferenced("MemberData", request.path[0], "parents");
        if (parents.totalCount > 0) {
            if (parents.items.some((parent) => parent._id === request.user.id)) {
                const childSubmissionDataQuery = await wixData.query("LearnerSubmissionData").eq("_owner", request.path[0]).include("course").find(suppressHooksandAuth);
                const childMemberData = (await wixData.query("Members/PrivateMembersData").eq("_id", request.path[0]).find({ "suppressAuth": true })).items[0]
                const childInfoRouterData = {
                    "firstName": childMemberData.firstName,
                    "lastName": childMemberData.lastName,
                    "_id": childMemberData._id
                }
                const childSubmissionRouterData = {
                    totalCount: childSubmissionDataQuery.totalCount,
                    items: childSubmissionDataQuery.items
                };
                const routerData = { childSubmissionData: childSubmissionRouterData, childInfo: childInfoRouterData };
                const seoData = {
                    title: `Progress Report for ${childInfoRouterData.firstName}`,
                    description: `Progress Report for ${childInfoRouterData.firstName}`,
                    noIndex: true,
                    metaTags: {
                        "og:title": `Progress Report for ${childInfoRouterData.firstName}`
                    }
                };
                return ok("childprogress-page", routerData, seoData);
            } else {
                return forbidden("You don't have access to the specified child.");
            }
        } else {
            return notFound("The child you've requested does not exist");
        }
    } catch (error) {
        return sendStatus("500", error);
    }
}

export async function lesson_Router(request) {
    try {
        console.log('rp - ' + request.path[0]);
        const activities = await wixData.queryReferenced("Lessons", request.path[0], "Activities");
        console.log(activities)
        const lesson = await wixData.get("Lessons", request.path[0]);
        if (lesson && activities && activities.totalCount > 0) {
            //const revisedActivities = activities.items.map((obj) => {return {items: obj.items}})
            //activities.items.sort((a, b) => { return a.order - b.order });
            const activityItemsSorted = sortArray(activities.items, lesson.activityOrder);
            const sendActivityData = {
                totalCount: activities.totalCount,
                items: activityItemsSorted
            }
            const routerData = { lesson: lesson, activities: sendActivityData };
            const seoData = {
                title: `${lesson.title} - Financedu`,
                description: `Financial Education for Free - Get started with ${lesson.title}`,
                noIndex: true,
                metaTags: {
                    "og:title": `${lesson.title} - Financedu`,
                }
            };
            return ok("lesson-page", routerData, seoData);
        } else {
            return notFound();
        }
    } catch (error) {
        console.log(error)
        return sendStatus("500", error);
    }
}

export async function lesson_SiteMap(request) {
    let siteMapEntries = [];
    let results = await wixData.query("Lessons")
        .limit(1000)
        .find(suppressHooksandAuth);
    let allItems = results.items;
    while (results.hasNext()) {
        results = await results.next();
        allItems = allItems.concat(results.items);
    }
    allItems.forEach((lesson) => {
        let entry = new WixRouterSitemapEntry();
        entry.pageName = `${lesson?.title} | Financedu`;
        entry.url = `/lesson/${lesson._id}`;
        entry.title = lesson?.title;
        siteMapEntries.push(entry);
    });
    return siteMapEntries;
}

export async function assignment_beforeRouter(request) {
    if (request.path[0]) {
        const pageList = ["instructor", "preview", "take"];
        if (pageList.includes(request.path[1])) {
            return next();
        } else {
            return notFound();
        }
    } else {
        return notFound();
    }
}

export async function assignment_Router(request) {
    const assignment = await wixData.get("Assignments", request.path[0]);
    if (assignment) {
        if (request.path[1] === "instructor") {
            const isAuthorized = await wixData.isReferenced("Classes", "instructors", assignment['class'], request.user.id, suppressHooksandAuth);
            if (isAuthorized) {
                const routerData = { assignment: assignment };
                const seoData = {
                    title: `${assignment.title} - Financedu`,
                    noIndex: true,
                    metaTags: {
                        "og:title": `${assignment.title} - Financedu`,
                    }
                };
                return ok("assignment-instructor", routerData, seoData);
            } else {
                return forbidden("You don't have access to this class.")
            }
        } else if (request.path[1] === "preview") {
            const isAuthorized = await wixData.isReferenced("Classes", "students", assignment['class'], request.user.id, suppressHooksandAuth);
            const submissions = await wixData.query("AssignmentSubmissions").eq("_owner", request.user.id).eq("assignment", request.path[0]).descending("_createdDate").find(suppressHooksandAuth);
            if (isAuthorized && assignment.published) {
                const submissionsSend = { totalCount: submissions.totalCount, items: submissions.items }
                const routerData = { assignment: assignment, submissions: submissionsSend };
                const seoData = {
                    title: `${assignment.title} - Financedu`,
                    noIndex: true,
                    metaTags: {
                        "og:title": `${assignment.title} - Financedu`,
                    }
                };
                return ok("assignment-preview", routerData, seoData);
            } else {
                return forbidden("You don't have access to this class or assignment.");
            }
        } else if (request.path[1] === "take") {
            const isAuthorized = await wixData.isReferenced("Classes", "students", assignment['class'], request.user.id, suppressHooksandAuth);
            const submissions = await wixData.query("AssignmentSubmissions").eq("_owner", request.user.id).eq("assignment", request.path[0]).descending("_createdDate").find(suppressHooksandAuth);
            if (isAuthorized) {
                const result = assignmentAvailable(request.user.id, assignment, submissions);
                if (result.status === true) {
                    const seoData = {
                        title: `${assignment.title} - Financedu`,
                        noIndex: true,
                        metaTags: {
                            "og:title": `${assignment.title} - Financedu`,
                        }
                    };
                    let activities = await wixData.queryReferenced("Assignments", assignment._id, "Activities");
                    activities.items.forEach((activity) => {
                        if (activity.data) {
                            activity.data = activity.data.map(({ answer, ...object }) => object);
                        }
                    });
                    const activitiesDataSorted = (array, sortArray) => {
                        return [...array].sort(
                            (a, b) => sortArray.indexOf(a._id) - sortArray.indexOf(b._id)
                        )
                    }
                    let activityItems = activities.items;
                    activityItems = activitiesDataSorted(activityItems, assignment.activityOrder);
                    if (result.newSubmission === true) {
                        const newSubmission = {
                            "assignment": assignment._id,
                            "data": []
                        }
                        return wixData.insert("AssignmentSubmissions", newSubmission, suppressAuth).then((submission) => {
                            const routerData = { submission: submission, assignment: assignment, activities: { items: activityItems, totalCount: activities.totalCount } };
                            return ok("assignment-take", routerData, seoData);
                        }).catch((error) => {
                            return redirect(`/assignment/${request.path[0]}/preview`);
                        })
                    } else {
                        const submission = submissions.items[0];
                        const routerData = { submission: submission, assignment: assignment, activities: { items: activityItems, totalCount: activities.totalCount } };
                        return ok("assignment-take", routerData, seoData);
                    }
                } else {
                    return redirect(`/assignment/${request.path[0]}/preview`);
                }
            } else {
                return forbidden("You don't have access to this class.");
            }
        }
    } else {
        return notFound("This assignment doesn't exist.");
    }
}

export function assignment_SiteMap(request) {

}

export async function class_beforeRouter(request) {
    if (request.path[0]) {
        const classId = request.path[0];
        if (request.path[1]) {
            if (request.path[1] === 'student') {
                return next();
            }
            /*else if (request.path[1] === 'assignments') {
                           const isAuthorized = await wixData.isReferenced("Classes", "instructors", classId, request.user.id, authOptions);
                           if (isAuthorized) {
                               return next();
                           } else {
                               return forbidden("You don't have access to this class.");
                           }
                       } else if (request.path[1] === 'people') {
                           return next();
                       } else */
            else if (request.path[1] === 'instructor') {
                return next();
            } else {
                return notFound();
            }
        } else {
            return notFound();
        }
    } else {
        return notFound();
    }
}

export async function class_Router(request) {
    const classId = request.path[0];
    const classInfo = await wixData.get("Classes", classId, suppressHooksandAuth);
    if (classInfo) {
        if (request.path[1] === 'student') {
            const students = await wixData.queryReferenced("Classes", classId, "students", suppressHooksandAuth);
            //const instructors = await wixData.queryReferenced("Classes", classId, "instructors", suppressHooksandAuth);
            if (students.items.some((obj) => obj._id === request.user.id)) {
                const assignments = await wixData.query("Assignments").eq("class", classId).eq("published", true).limit(100).find(suppressHooksandAuth);
                const filteredAssignments = assignments.items.filter((obj) => obj.assignToSelectedStudents === false || obj.selectedStudents.includes(request.user.id));
                const routerData = { classInfo: classInfo, assignments: { items: assignments.items, totalCount: assignments.totalCount }, people: { students: { items: students.items, totalCount: students.totalCount } } };
                const seoData = {
                    title: `${classInfo.title} | Financedu`,
                    description: `Assignments for ${classInfo.title}`,
                    noIndex: true,
                    metaTags: {
                        "og:title": `${classInfo.title} - Financedu`,
                    }
                };
                return ok("class-student", routerData, seoData);
            } else {
                return forbidden("You don't have access to this class.");
            }
        }
        /*else if (request.path[1] === 'assignments') {
                   const assignments = await wixData.query("Assignments").eq("class", classId).find(authOptions);
                   const routerData = { classInfo: classInfo, assignments: { items: assignments.items, totalCount: assignments.totalCount } };
                   const seoData = {
                       title: `${classInfo.title} - Financedu`,
                       description: `Assignments for ${classInfo.title}`,
                       noIndex: true,
                       metaTags: {
                           "og:title": `${classInfo.title} - Financedu`,
                       }
                   };
                   return ok("class-page", routerData, seoData);
               } else if (request.path[1] === 'gradebook') {

               } else if (request.path[1] === 'people') {
                   const instructors = await wixData.queryReferenced("Classes", classId, "instructors", authOptions);
                   const students = await wixData.queryReferenced("Classes", classId, "students", authOptions);
                   if (instructors.items.some((obj) => obj._id === request.user.id)) {
                       const routerData = { classInfo: classInfo, instructors: { items: instructors.items, totalCount: instructors.totalCount }, students: { items: students.items, totalCount: students.totalCount } };
                       const seoData = {
                           title: `${classInfo.title} - Financedu`,
                           description: `People in ${classInfo.title}`,
                           noIndex: true,
                           metaTags: {
                               "og:title": `${classInfo.title} - Financedu`,
                           }
                       };
                       return ok("class-people", routerData, seoData);
                   } else {
                       return forbidden("You don't have access to this class.");
                   }
               }
           } */
        else if (request.path[1] === 'instructor') {
            const instructors = await wixData.queryReferenced("Classes", classId, "instructors", suppressHooksandAuth);
            const students = await wixData.queryReferenced("Classes", classId, "students", suppressHooksandAuth);
            /*
            const instructorIdList = instructors.items.map((obj) => obj._id);
            const studentIdList = students.items.map((obj) => obj._id);
            const peopleIdList = instructorIdList.concat(studentIdList);
            const emailQuery = await wixData.query("Members/PrivateMembersData").hasSome("_id", peopleIdList).find();
            const instructorItems = instructors.items.map((obj) => {
                const matchingMemberItem = emailQuery.items.find((item) => item._id === obj._id);
                return {...obj, email: matchingMemberItem.loginEmail}
            })
            const studentItems = students.items.map((obj) => {
                const matchingMemberItem = emailQuery.items.find((item) => item._id === obj._id);
                return {...obj, email: matchingMemberItem.loginEmail}
            })
            */
            const assignments = await wixData.query("Assignments").eq("class", classId).limit(100).find(suppressHooksandAuth);
            if (instructors.items.some((obj) => obj._id === request.user.id)) {
                const routerData = { classInfo: classInfo, assignments: { items: assignments.items, totalCount: assignments.totalCount }, people: { instructors: { items: instructors.items, totalCount: instructors.totalCount }, students: { items: students.items, totalCount: students.totalCount } } };
                const seoData = {
                    title: `${classInfo.title} | Financedu`,
                    description: `People in ${classInfo.title}`,
                    noIndex: true,
                    metaTags: {
                        "og:title": `${classInfo.title} - Financedu`,
                    }
                };
                return ok("class-instructor", routerData, seoData);
            } else {
                return forbidden("You don't have access to this class.");
            }
        } else {
            return notFound();
        }
    } else {
        return notFound();
    }
}

export function class_SiteMap(request) {
    //Add your code for this event here: 
}

export async function activity_Router(request) {
    const activity = await wixData.get("Activities", request.path[0]);
    const routerData = { activity: activity };
    const seoData = {
        title: `${activity.title} - Financedu`,
        description: `Preview ${activity.title}`,
        noIndex: true,
        metaTags: {
            "og:title": `${activity.title} - Financedu`,
        }
    };
    return ok("activity-page", routerData, seoData);
}

export async function activity_SiteMap(request) {
    let siteMapEntries = [];
    let results = await wixData.query("Activities")
        .limit(1000)
        .find(suppressHooksandAuth);
    let allItems = results.items;
    while (results.hasNext()) {
        results = await results.next();
        allItems = allItems.concat(results.items);
    }
    allItems.forEach((activity) => {
        let entry = new WixRouterSitemapEntry();
        entry.pageName = `${activity?.title} | Financedu`;
        entry.url = `/activity/${activity._id}`;
        entry.title = activity?.title;
        siteMapEntries.push(entry);
    });
    return siteMapEntries;
}

function assignmentAvailable(userId, assignment, submissions) {
    let assignmentGroup;
    if (assignment.assignData.some((obj) => obj.students.includes(userId))) {
        assignmentGroup = assignment.assignData.find((obj) => obj.students.includes(userId));
    } else {
        assignmentGroup = assignment.assignData[0];
    }
    const now = new Date();
    let dueDate;
    if (assignmentGroup.dueDates.enabled) {
        dueDate = new Date(assignmentGroup.dueDates.dueDate);
    }
    const submissonCount = submissions.totalCount;
    let maxAttempts;
    if (assignmentGroup.attempts.limitAttempts) {
        maxAttempts = assignmentGroup.attempts.maxAttempts;
    } else {
        maxAttempts = Number(Infinity);
    }
    if (assignment.published) {
        if (!assignmentGroup.availability.limitAvailability) {
            if (assignmentGroup.dueDates.enabled) {
                let maxAttempts;
                if (assignmentGroup.attempts.limitAttempts) {
                    maxAttempts = assignmentGroup.attempts.maxAttempts;
                } else {
                    maxAttempts = Number(Infinity);
                }
                const submissonCount = submissions.totalCount;
                if (dueDate.getTime() >= now.getTime()) {
                    //if past due date
                    if (assignmentGroup.dueDates.allowLateSubmissions && submissonCount < maxAttempts) {
                        //if late submissions allowed and submissionCount is below max attempts allowed.
                        if (submissions.totalCount > 0 && !submissions.items[0]?.submitted) {
                            //Continue
                            return { status: true, newSubmission: false };
                        } else {
                            if (submissions.totalCount > 0) {
                                //Retry
                                return { status: true, newSubmission: true };
                            } else {
                                //Start
                                return { status: true, newSubmission: true };
                            }
                        }
                    } else {
                        return { status: false, newSubmission: false };
                    }
                } else {
                    if (submissonCount < maxAttempts) {
                        //if submissionCount is below max attempts allowed.
                        if (submissions.totalCount > 0 && !submissions.items[0]?.submitted) {
                            //Continue
                            return { status: true, newSubmission: false };
                        } else {
                            if (submissions.totalCount > 0) {
                                //Retry
                                return { status: true, newSubmission: true };
                            } else {
                                //Start
                                return { status: true, newSubmission: true };
                            }
                        }
                    } else {
                        return { status: false }
                    }
                }
            } else {
                if (submissonCount < maxAttempts) {
                    //if submissionCount is below max attempts allowed.
                    if (submissions.totalCount > 0 && !submissions.items[0]?.submitted) {
                        //Continue
                        return { status: true, newSubmission: false };
                    } else {
                        if (submissions.totalCount > 0) {
                            //Retry
                            return { status: true, newSubmission: true };
                        } else {
                            //Start
                            return { status: true, newSubmission: true };
                        }
                    }
                } else {
                    return { status: false };
                }
            }
        } else {
            const startDate = new Date(assignmentGroup.availability.startDate);
            const endDate = new Date(assignmentGroup.availability.endDate);
            if (endDate.getTime() >= now.getTime() && startDate.getTime() <= now.getTime()) {
                if (assignmentGroup.dueDates.enabled) {
                    if (dueDate.getTime() >= now.getTime()) {
                        //if past due date
                        if (assignmentGroup.dueDates.allowLateSubmissions && submissonCount < maxAttempts) {
                            //if late submissions allowed and submissionCount is below max attempts allowed.
                            if (submissions.totalCount > 0 && !submissions.items[0]?.submitted) {
                                //Continue
                                return { status: true, newSubmission: false };
                            } else {
                                if (submissions.totalCount > 0) {
                                    //Retry
                                    return { status: true, newSubmission: true };
                                } else {
                                    //Start
                                    return { status: true, newSubmission: true };
                                }
                            }
                        } else {
                            return { status: false };
                        }
                    } else {
                        if (submissonCount < maxAttempts) {
                            //if submissionCount is below max attempts allowed.
                            if (submissions.totalCount > 0 && !submissions.items[0]?.submitted) {
                                //Continue
                                return { status: true, newSubmission: false };
                            } else {
                                if (submissions.totalCount > 0) {
                                    //Retry
                                    return { status: true, newSubmission: true };
                                } else {
                                    //Start
                                    return { status: true, newSubmission: true };
                                }
                            }
                        } else {
                            return { status: false };
                        }
                    }
                } else {
                    if (submissonCount < maxAttempts) {
                        //if submissionCount is below max attempts allowed.
                        if (submissions.totalCount > 0 && !submissions.items[0]?.submitted) {
                            //Continue
                            return { status: true, newSubmission: false };
                        } else {
                            if (submissions.totalCount > 0) {
                                //Retry
                                return { status: true, newSubmission: true };
                            } else {
                                //Start
                                return { status: true, newSubmission: true };
                            }
                        }
                    } else {
                        return { status: false };
                    }
                }
            } else {
                return { status: false };
            }
        }
    } else {
        return { status: false };
    }
}

export function tools_Router(request) {
    const pageList = request.pages;
    if (pageList.includes(request.path[0])) {
        const name = Object.keys(toolsList).find((name) => name === request.path[0]);
        const seoData = {
            title: `${toolsList[name].title} | Financedu`,
            description: `CalculateValue`,
            noIndex: true
        };
        return ok(request.path[0], null, seoData);
    } else {
        return notFound();
    }
}

const toolsList = {
    "compound-interest-calculator": {
        title: "Compound Interest Calculator",
        imageSite: "https://static.wixstatic.com/media/",
        image: "2dcc6c_9a6c54fb35484d9baa40fe8d469f6de5~mv2.png/v1/fill/w_738,h_392,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/Image-empty-state.png"
    },
    "four-function-calculator": {
        title: "Four Function Calculator",
        imageSite: "https://static.wixstatic.com/media/",
        image: "/2dcc6c_76cbbbe77b9348c48ef7b08cade5f7c7~mv2.png/v1/fill/w_738,h_392,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/Image-empty-state.png"
    },
    "simple-interest-calculator": {
        title: "Simple Interest Calculator",
        imageSite: "https://static.wixstatic.com/media/",
        image: "/2dcc6c_76cbbbe77b9348c48ef7b08cade5f7c7~mv2.png/v1/fill/w_738,h_392,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/Image-empty-state.png"
    },
    "budgeting-tool": {
        title: "Budgeting Tool",
        imageSite: "https://static.wixstatic.com/media/",
        image: "/2dcc6c_44d68b4bc21447c68fa6c319911bc9c9~mv2.png"
    },
    "savings-calculator": {
        title: "Savings Calculator",
        imageSite: "https://static.wixstatic.com/media/",
        image: "/2dcc6c_7b0d878a10d3439dacf6fda40e402a03~mv2.png"
    }
};

export function tools_SiteMap(request) {
    //Convert the data to sitemap entries
    const siteMapEntries = Object.keys(toolsList).map((name) => {
        const data = toolsList[name];
        const entry = new WixRouterSitemapEntry(name);
        entry.pageName = name;
        entry.url = `/tools/${name}`;
        entry.title = data.title;
        return entry;
    });

    // Return the sitemap entries
    return siteMapEntries;
}

export function enableGoogleLogin_SiteMap(request) {
    //Add your code for this event here: 
}

export function fblogin_SiteMap(request) {
    //Add your code for this event here: 
}

export async function organization_beforeRouter(request) {
    if (request.path[0]) {
        const pageList = ["admin"];
        if (pageList.includes(request.path[1])) {
            return next();
        } else {
            return notFound();
        }
    } else {
        return notFound();
    }
}

export async function organization_Router(request) {
    if (request.path[1] === "admin") {
        const organization = await wixData.get("Organizations", request.path[0], suppressHooksandAuth);
        const isAuthorized = await wixData.isReferenced("Organizations", "administrators", request.path[0], request.user.id, suppressHooksandAuth);
        if (isAuthorized) {
            const routerData = { organization: organization };
            const seoData = {
                title: `${organization.title} - Financedu`,
                noIndex: true,
                metaTags: {
                    "og:title": `${organization.title} - Financedu`,
                }
            };
            return ok("organization-admin", routerData, seoData);
        } else {
            return forbidden();
        }
    } else {
        return notFound();
    }
}

export async function topic_Router(request) {
    if (request.path.length > 0) {
        const capitalizedPath = request.path[0].charAt(0).toUpperCase() + request.path[0].slice(1);
        const topicsResult = await wixData.query("Topics").eq("title", capitalizedPath).find();
        const activitiesResult = await wixData.query("Activities").hasSome("topics", capitalizedPath).find();
        const articles = activitiesResult.items.filter((obj) => obj.type === 'Article');
        const quizzes = activitiesResult.items.filter((obj) => obj.type === 'Quiz');
        if (topicsResult.totalCount > 0) {
            const routerData = { topic: topicsResult.items[0], activities: activitiesResult.items, articles: articles, quizzes: quizzes };
            const seoData = {
                title: `${topicsResult.items[0].title} - Financedu`,
                noIndex: false,
                metaTags: {
                    "og:title": `${topicsResult.items[0].title} - Financedu`,
                }
            };
            return ok("topics-page", routerData, seoData);
        } else {
            return notFound();
        }
    } else {
        return notFound();
    }
}

export function topic_SiteMap(request) {
    //Add your code for this event here: 
}