export function assignmentAvailable(userId, assignment, submissions) {
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
    /*
    let maxAttempts;
    if (assignmentGroup.attempts.limitAttempts) {
        maxAttempts = assignmentGroup.attempts.maxAttempts;
    } else {
        maxAttempts = Number(Infinity);
    }
    */
    if (assignment.published) {
        if (assignmentGroup.availability.limitAvailability) {
            const startDate = new Date(assignmentGroup.availability.startDate);
            const endDate = new Date(assignmentGroup.availability.endDate);
            if (endDate.getTime() >= now.getTime() && startDate.getTime() <= now.getTime()) {
                if (assignmentGroup.dueDates.enabled) {
                    if (dueDate.getTime() >= now.getTime()) {
                        //if past due date
                        if (assignmentGroup.dueDates.allowLateSubmissions && !assignmentGroup.attempts.limitAttempts && submissonCount < assignmentGroup.attempts?.maxAttempts) {
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
                        if (assignmentGroup.attempts.limitAttempts && submissonCount >= assignmentGroup.attempts?.maxAttempts) {
                            return { status: false };
                        } else {
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
                        }
                    }
                } else {
                    if (assignmentGroup.attempts.limitAttempts && submissonCount >= assignmentGroup.attempts?.maxAttempts) {
                        return { status: false };
                    } else {
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
                    }
                }
            } else {
                return { status: false };
            }
        } else {
            if (assignmentGroup.dueDates.enabled) {
                const submissonCount = submissions.totalCount;
                if (dueDate.getTime() >= now.getTime()) {
                    //if past due date
                    if (assignmentGroup.dueDates.allowLateSubmissions && !assignmentGroup.attempts.limitAttempts && submissonCount < assignmentGroup.attempts?.maxAttempts) {
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
                    if (assignmentGroup.attempts.limitAttempts && submissonCount >= assignmentGroup.attempts?.maxAttempts) {
                        return { status: false }
                    } else {
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
                    }
                }
            } else {
                if (assignmentGroup.attempts.limitAttempts && submissonCount >= assignmentGroup.attempts?.maxAttempts) {
                    console.log('E-1');
                    return { status: false };
                } else {
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
                }
            }
        }
    } else {
        console.log('E-2');
        return { status: false };
    }
}