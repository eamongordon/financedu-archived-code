import { currentMember, members } from 'wix-members-backend';
import { assignmentAvailable } from 'public/assignmentFunctions.js';
import { notifications } from 'wix-crm-backend';
import wixData from 'wix-data';

const suppressHooksandAuth = { suppressAuth: true, suppressHooks: true };
const suppressAuth = { suppressAuth: true };

export async function People_beforeInsert(item, context) {
    /*
    const member = await currentMember.getMember();
    item.firstName = member.contactDetails.firstName;
    item.lastName = member.contactDetails.lastName;
    */
    item.name = item.firstName + ' ' + item.lastName;
    if (item._id === context.userId) {
        return item;
    } else {
        throw new Error('forbidden');
    }
}

/*
export async function AssignmentSubmissions_beforeUpdate(item, context) {
    const currentItem = await wixData.get("AssignmentSubmissions", item._id);
    item.timerEndDate = currentItem.timerEndDate;
    item.totalScore = currentItem.totalScore;
    return Promise.resolve(item);
}
*/

export async function AssignmentSubmissions_beforeUpdate(item, context) {
    try {
        if (item.submitted && !item.scoringData) {
            let hasText = false;
            let otherSubmissionsQuery = await wixData.query("AssignmentSubmissions").eq("assignment", item.assigment).ne("_id", item._id).find({ suppressAuth: true });
            otherSubmissionsQuery.items.forEach((obj) => {
                obj.retained = false
            });
            const assignment = await wixData.get("Assignments", item.assignment, suppressHooksandAuth);
            const bulkSaveResult = await wixData.bulkSave("AssignmentSubmissions", otherSubmissionsQuery.items, { suppressAuth: true, suppressHooks: true });
            const activitiesQuery = await wixData.queryReferenced("Assignments", item.assignment, "Activities", { suppressAuth: true });
            let scoringData = [];
            item.gradingComplete = true;
            let totalAccuracy = 0;
            activitiesQuery.items.forEach((activity, activityIndex) => {
                scoringData.push({
                    "_id": activity._id
                });
                let activityGradingComplete = true;
                if (activity.type === 'Quiz') {
                    scoringData[activityIndex].questions = [];
                    let questionGradingComplete = true;
                    let totalActivityScore = 0;
                    console.log("ACTIVITYQUESTIONLENGTH - " + activity.data.length);
                    activity.data.forEach((question) => {
                        let questionScore = 0;
                        const activitySubmissionDataIndex = item.data.findIndex(obj => obj._id === activity._id);
                        const activityResponseData = item.data[activitySubmissionDataIndex].questions.find(obj => obj._id === question._id);
                        console.log("activityResponseData");
                        console.log(activityResponseData);
                        console.log("questions");
                        console.log(item.data[activitySubmissionDataIndex].questions)
                        console.log(question.type);
                        if (activityResponseData && activityResponseData?.response) {
                            console.log("Has Response")
                            if (question.type === 'multiselect') {
                                /*
                                if (JSON.stringify(activityResponseData.response) === JSON.stringify(question.answer)) {
                                    questionScore++;
                                }*/
                                let multiselectCorrectCount = 0;
                                question.options.forEach((option) => {
                                    const optionIsCorrect = question.answer.includes(option.value);
                                    const optionIsSelected = activityResponseData.response.includes(option.value);
                                    if (optionIsCorrect === optionIsSelected) {
                                        multiselectCorrectCount += 1;
                                    } else {
                                        multiselectCorrectCount -= 1;
                                    }
                                });
                                if (multiselectCorrectCount > 0) {
                                    console.log("question.options.length");
                                    console.log(question.options.length);
                                    console.log("hasMultiselectlength -" + question.options.length);
                                    questionScore += Math.round((multiselectCorrectCount / question.options.length) * 100) / 100;
                                }
                            } else if (question.type === 'matching') {
                                let matchingScore = 0;
                                
                                question.questions.forEach((matchingQuestion, matchingIndex) => {
                                    const matchingresponse = activityResponseData.response.find((obj) => obj._id === matchingQuestion.value);
                                    if (matchingQuestion.answer === matchingresponse?.response) {
                                        matchingScore++;
                                    }
                                    
                                    console.log("MATCHINGQ")
                                    console.log("JJJJJ" + JSON.stringify(matchingQuestion) + "A");
                                    console.log("s");
                                    
                                    if (matchingIndex + 1 === question.questions.length) {
                                        questionScore += Math.round((matchingScore / question.questions.length) * 100) / 100;
                                        matchingScore = 0;
                                    }
                                });
                                
                            } else if (question.type === 'number') {
                                const roundedResponse = round(Number(activityResponseData.response), question.precision);
                                const roundedAnswer = round(Number(question.answer), question.precision);
                                if (question.allowTolerance) {
                                    if (roundedResponse === roundedAnswer) {
                                        questionScore++;
                                    }
                                } else {
                                    if (activityResponseData.response === question.answer) {
                                        questionScore++;
                                    }
                                }
                            } else if (question.type === 'info') {
                                questionScore++;
                            } else if (question.type === 'text') {
                                let assignmentGroup;
                                if (assignment.assignData.some((obj) => obj.students.includes(item._owner))) {
                                    assignmentGroup = assignment.assignData.find((obj) => obj.students.includes(item._owner));
                                } else {
                                    assignmentGroup = assignment.assignData[0];
                                }
                                if (assignmentGroup.grading.manualGrading) {
                                    questionGradingComplete = false;
                                    activityGradingComplete = false;
                                    item.gradingComplete = false;
                                    questionScore++;
                                } else {
                                    if (activityResponseData.response) {
                                        questionScore++;
                                    }
                                }
                            } else {
                                if (activityResponseData.response === question.answer) {
                                    questionScore++;
                                }
                            }
                            totalActivityScore += questionScore;
                        }
                        let questionPushItem = {
                            _id: question._id
                        };
                        if (questionGradingComplete) {
                            questionPushItem.accuracy = questionScore;
                        }
                        console.log("questipnPushItem" + " " + question.type)
                        console.log(questionPushItem);
                        scoringData[activityIndex].questions.push(questionPushItem);
                    });
                    if (activityGradingComplete === true) {
                        console.log("hasScoringDataLength -" + activity.data.length);
                        scoringData[activityIndex].accuracy = totalActivityScore / activity.data.length;
                        totalAccuracy += (totalActivityScore / activity.data.length) / activitiesQuery.items.length;
                    }
                } else {
                    scoringData[activityIndex].accuracy = 1;
                    console.log("Has total accuracy length")
                    totalAccuracy += 1 / activitiesQuery.items.length;
                }
            });
            if (item.gradingComplete) {
                item.accuracy = totalAccuracy
            }
            item.scoringData = scoringData;
            if (bulkSaveResult) {
                return Promise.resolve(item);
            }
        } else {
            return Promise.resolve(item);
        }
    } catch (error) {
        throw new Error(error);
    }
}

function round(value, precision) {
    if (precision > 0) {
        return Math.round(value / Math.pow(10, precision)) * Math.pow(10, precision);
    } else if (precision < 0) {
        const decimals = Math.abs(precision);
        return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
    } else {
        return Math.round(value);
    }
}

export async function Assignments_beforeUpdate(item, context) {
    const isAuthorized = await wixData.isReferenced("Classes", "instructors", item['class'], context.userId, { suppressAuth: true });
    if (context.userId === item._owner || context.userRole === 'siteOwner' || isAuthorized) {
        return item;
    } else {
        throw new Error("forbidden");
    }
}

export async function Assignments_beforeRemove(itemId, context) {
    const isAuthorized = await wixData.isReferenced("Classes", "instructors", itemId, context.userId, { suppressAuth: true });
    if (context.userId === context.currentItem._owner || context.userRole === 'siteOwner' || isAuthorized) {
        const submissionsQuery = await wixData.query("AssignmentSubmissions").eq("assignment", itemId).find(suppressHooksandAuth);
        const submissionsIdList = submissionsQuery.items.map((obj) => obj._id);
        wixData.bulkRemove("AssignmentSubmissions", submissionsIdList, suppressHooksandAuth);
        return itemId;
    } else {
        throw new Error("forbidden");
    }
}

export async function Classes_beforeUpdate(item, context) {
    const isAuthorized = await wixData.isReferenced("Classes", "instructors", item._id, context.userId, { suppressAuth: true });
    if (context.userId === item._owner || context.userRole === 'siteOwner' || isAuthorized) {
        return item;
    } else {
        throw new Error("forbidden");
    }
}

export async function Classes_beforeRemove(itemId, context) {
    const isAuthorized = await wixData.isReferenced("Classes", "instructors", itemId, context.userId, suppressHooksandAuth);
    if (context.userRole === 'siteOwner' || isAuthorized) {
        let assignments = await wixData.query("Assignments").eq("class", itemId).limit(1000).find(suppressHooksandAuth);
        let assignmentsItems = assignments.items;
        while (assignments.hasNext()) {
            assignments = await assignments.next();
            assignmentsItems.push(assignments.items);
        }
        const assignmentsIdList = assignmentsItems.map((obj) => obj._id);
        let assignmentSubmissions = await wixData.query("AssignmentSubmissions").hasSome("assignment", assignmentsIdList).limit(1000).find(suppressHooksandAuth);
        let assignmentSubmissionsItems = assignmentSubmissions.items;
        while (assignmentSubmissions.hasNext()) {
            assignmentSubmissions = await assignmentSubmissions.next();
            assignmentSubmissionsItems.push(assignmentSubmissions.items);
        }
        assignmentsItems.forEach((array) => {
            const idList = array.map((obj) => obj._id);
            wixData.bulkRemove("Assignments", idList, suppressHooksandAuth);
        });
        assignmentSubmissionsItems.forEach((array) => {
            const idList = array.map((obj) => obj._id);
            wixData.bulkRemove("AssignmentSubmissions", idList, suppressHooksandAuth);
        });
        return itemId;
    } else {
        throw new Error("forbidden");
    }
}

export async function Organizations_beforeRemove(itemId, context) {
    const isAuthorized = await wixData.isReferenced("Organizations", "administrators", itemId, context.userId, suppressHooksandAuth);
    if (context.userRole === 'siteOwner' || isAuthorized) {
        let suborganizations = await wixData.queryReferenced("Organizations", itemId, "subOrganizations", suppressHooksandAuth);
        let suborganizationItems = suborganizations.items;
        while (suborganizations.hasNext()) {
            suborganizations = await suborganizations.next();
            suborganizationItems.push(suborganizations.items);
        }
        suborganizationItems.forEach((array) => {
            const idList = array.map((obj) => obj._id);
            wixData.bulkRemove("Organizations", idList, suppressHooksandAuth);
        });
        let classes = await wixData.query("Classes").eq("organization", itemId).find(suppressHooksandAuth);
        let classItems = [classes.items];
        while (classes.hasNext()) {
            classes = await classes.next();
            classItems.push(classes.items);
        }
        classItems.forEach((array) => {
            const idList = array.map((obj) => obj._id);
            wixData.bulkRemove("Classes", idList, suppressHooksandAuth);
        });
        return itemId;
    } else {
        throw new Error("forbidden");
    }
}

export async function AssignmentSubmissions_beforeRemove(itemId, context) {
    const assignmentSub = await wixData.get("AssignmentSubmissions", itemId, suppressHooksandAuth);
    const assignment = await wixData.get("Assignments", assignmentSub.assignment);
    const submissions = (await wixData.query("AssignmentSubmissions").eq("_owner", context.userId).find(suppressHooksandAuth)).items;
    const result = assignmentAvailable(context.userId, assignment, submissions);
    if (result.status === true || context.userRole === 'siteOwner') {
        return itemId;
    } else {
        throw new Error('forbidden');
    }
}

export async function AssignmentSubmissions_afterGet(item, context) {
    const assignmentSubmission = item;
    const assignment = await wixData.get("Assignments", assignmentSubmission.assignment, suppressHooksandAuth);
    const classesReferenced = await wixData.isReferenced("Classes", "instructors", assignment['class'], context.userId);
    if (context.userId === assignmentSubmission._owner || context.userRole === 'siteOwner' || classesReferenced) {
        return item;
    } else {
        throw new Error("forbidden");
    }
}

export async function AssignmentSubmissions_beforeQuery(query, context) {
    if (context.userRole !== 'siteOwner') {
        const authorizedClassesList = await wixData.query("Classes").hasSome("instructors", context.userId).find({ suppressAuth: true });
        let authorizedClassIds = authorizedClassesList.items.map((obj) => obj._id);
        const authorizedAssignmentsQuery = await wixData.query("Assignments").hasSome('class', authorizedClassIds).find({ suppressAuth: true });
        const authorizedAssignmentIds = authorizedAssignmentsQuery.items.map((obj) => obj._id);
        query = query.hasSome("assignment", authorizedAssignmentIds)
    }
    return query;
}

export async function AssignmentSubmissions_beforeInsert(item, context) {
    const assignment = await wixData.get("Assignments", item.assignment, suppressHooksandAuth);
    const submissions = (await wixData.query("AssignmentSubmissions").eq("_owner", context.userId).find(suppressHooksandAuth)).items;
    const result = assignmentAvailable(context.userId, assignment, submissions);
    if (result.status === true || context.userRole === 'siteOwner') {
        return item;
    } else {
        throw new Error('forbidden');
    }
}

export function TestingSessions_beforeUpdate(item, context) {
    if (item.startDate) {
        item.startDate = new Date(item.startDate);
    }
    if (item.endDate) {
        item.endDate = new Date(item.endDate);
    }
    return item;
}

export function TestingSessions_beforeInsert(item, context) {
    if (item.startDate) {
        item.startDate = new Date(item.startDate);
    }
    if (item.endDate) {
        item.endDate = new Date(item.endDate);
    }
    return item;
}

export function Feedback_afterInsert(item, context) {
    notifications.notify(
        `${item.category} Feedback from ${item.firstName} ${item.lastName}`,
        ["Dashboard", "Mobile"], {
            "title": `${item.category} Feedback from ${item.firstName} ${item.lastName}`,
            "actionTitle": "View Details",
            "actionTarget": { "url": `https://manage.wix.com/dashboard/1818ef34-f9d1-493d-b2a9-53e206bd7117/database/data/Feedback/${item._id}` },
            "recipients": { "role": "Owner" }
        }
    );
    return item;
}

export async function TestingSessionRedeems_afterInsert(item, context) {
    const totalSessionMinutes = Math.floor(item.totalTime / 60);
    const totalSessionHours = Math.floor(totalSessionMinutes / 60);
    const sessionMinutes = totalSessionMinutes - ((60) * totalSessionHours);
    const member = await members.getMember(context.userId, { fieldsets: ["FULL"] });
    notifications.notify(
        `New Redeem Request from ${member.contactDetails.firstName} ${member.contactDetails.lastName} for ${totalSessionHours} ${totalSessionHours === 1 ? 'hr' : 'hrs'} ${sessionMinutes} ${sessionMinutes === 1 ? 'min' : 'mins'}`,
        ["Dashboard", "Mobile"], {
            "title": `New Redeem Request`,
            "actionTitle": "View Details",
            "actionTarget": { "url": `https://manage.wix.com/dashboard/1818ef34-f9d1-493d-b2a9-53e206bd7117/database/data/TestingSessionRedeems/${item._id}` },
            "recipients": { "role": "Owner" }
        }
    );
    return item;
}

export function Lessons_afterUpdate(item, context) {
    return wixData.queryReferenced("Lessons", item._id, "Activities")
        .then((res) => {
            const activityIdArray = res.items.map((obj) => obj._id);
            activityIdArray.forEach((activityId) => {
                if (!item.activityOrder.includes(activityId)) {
                    item.activityOrder.push(activityId)
                }
            });
            item.activityOrder = item.activityOrder.filter((activityOrderItem) => activityIdArray.includes(activityOrderItem));
            return item;
        })
}

export async function Activities_afterUpdate(item, context) {
    if (item.type === 'Quiz') {
        /*
        let questionQuery = await wixData.query("Questions");
        item.data.forEach((question) => {
            questionQuery = questionQuery.or(wixData.query("Questions").eq("_id", question._id).or(wixData.query("Questions").eq("type", question.type).eq("instructions", question.instructions)));
        });
        const questionResults = await questionQuery.fields("_id").find(suppressHooksandAuth);
        const questionResultsExistingIds = questionResults.items.map((obj) => obj._id);
        const nonExistingQuestions = item.data.filter((obj) => !questionResultsExistingIds.includes(obj._id));
        */
        const insertItems = item.data.map((obj) => {
            return {
                "instructions": obj.instructions,
                "type": obj.type,
                "data": obj,
                "difficulty": obj?.difficulty,
                "topics": obj?.topics,
                "_id": obj._id
            }
        })
        wixData.bulkSave("Questions", insertItems, suppressHooksandAuth).then((res) => {
            const referenceIdArray = res.insertedItemIds.concat(res.updatedItemIds);
            referenceIdArray.forEach((questionId) => {
                wixData.insertReference("Questions", "activities", questionId, item._id)
            })
        })
    }
    return item;
}

export function LearnerSubmissionData_beforeQuery(query, context) {
    //if (context.userRole !== 'siteOwner') {
    query = query.eq('_owner', context.userId);
    //}
    return query;
}

export async function Questions_beforeUpdate(item, context) {
    item.data.instructions = item.instructions;
    item.data.topics = item.topics;
    return item;
}

export async function Questions_afterUpdate(item, context) {
    let referencedActivities = await wixData.queryReferenced("Questions", item._id, "activities");
    referencedActivities.items.forEach((activity, index) => {
        let questionInActivityIndex = activity.data.findIndex((a) => a._id === item._id);
        activity.data[questionInActivityIndex] = item.data;
    });
    wixData.bulkUpdate("Activities", referencedActivities.items, { suppressHooks: true });
    return item;
}