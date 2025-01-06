import { ok, notFound, serverError, badRequest } from 'wix-http-functions';
import wixData from 'wix-data';
import { getGoogleAuthLogin, getGoogleAuthSignup, getGoogleAuthEnable } from '@prospectorminerals/google-oauth-sso-backend';

export function get_getAuth(request) {
    let errorOptions = {
        body: {
            "error": "internal server error",
        },
        headers: {
            "Content-Type": "application/json"
        }
    }
    if (request.query.v === 'login') {
        return getGoogleAuthLogin(request)
            .catch((error) => {
                errorOptions.body.error = error.toString();
                return serverError(errorOptions);
            });
    } else if (request.query.v === 'signup') {
        return getGoogleAuthSignup(request)
            .catch((error) => {
                errorOptions.body.error = error.toString();
                return serverError(errorOptions);
            });
    } else if (request.query.v === 'enable') {
        return getGoogleAuthEnable(request)
            .catch((error) => {
                errorOptions.body.error = error.toString();
                return serverError(errorOptions);
            });
    }
}

export async function get_courses(request) {
    let options = {
        "headers": {
            "Content-Type": "application/json"
        }
    };
    let coursesQuery = wixData.query("Courses").limit(1000);
    if (request.query._id) {
        coursesQuery = coursesQuery.eq("_id", request.query._id)
    }
    if (request.query.title) {
        coursesQuery = coursesQuery.contains("title", request.query.title)
    }
    if (request.query.series) {
        coursesQuery = coursesQuery.eq("series", request.query.series)
    }
    return coursesQuery.find()
        .then(async (results) => {
            let allItems = results.items;
            while (results.hasNext()) {
                results = await results.next();
                allItems = allItems.concat(results.items);
            }
            const modifiedItems = allItems.map((course) => {
                return {
                    title: course.title,
                    image: course.image,
                    series: course.series,
                    shortDescription: course.description,
                    longDescription: course.longDescription,
                    duration: course.courseDuration,
                    gradeLevels: course.gradeLevels,
                    topicsCovered: course.topicsCovered,
                    formats: course.courseFormats,
                    _id: course._id
                }
            })
            options.body = {
                "items": modifiedItems
            };
            return ok(options);
        })
        .catch((error) => {
            options.body = {
                "error": error
            };
            return serverError(options);
        });
}

export async function get_course(request) {
    // URL looks like: https://www.mysite.com/_functions/myFunction/John/Doe
    let options = {
        "headers": {
            "Content-Type": "application/json"
        }
    };
    let course = await wixData.get("Courses", request.path[0]);
    if (course) {
        const routerCourse = {
            title: course.title,
            image: course.image,
            series: course.series,
            shortDescription: course.description,
            longDescription: course.longDescription,
            duration: course.courseDuration,
            gradeLevels: course.gradeLevels,
            topicsCovered: course.topicsCovered,
            formats: course.courseFormats,
            _id: course._id
        }
        let moduleQuery = await wixData.queryReferenced("Courses", request.path[0], "Modules");
        let allItems = moduleQuery.items;
        while (moduleQuery.hasNext()) {
            moduleQuery = await moduleQuery.next();
            allItems = allItems.concat(moduleQuery.items);
        }
        const modifiedModules = allItems.map((obj) => {
            return {
                title: obj.title,
                shortName: obj.shortName,
                color: obj.color,
                skills: obj.skills,
                about: obj.about,
                order: obj.order,
                _id: obj._id
            }
        });
        modifiedModules.sort((a, b) => {
            return a.order - b.order;
        });
        options.body = {
            "course": routerCourse,
            "modules": modifiedModules
        };
        return ok(options);
    } else {
        return notFound(options);
    }
}

export async function get_modules(request) {
    // URL looks like: https://www.mysite.com/_functions/myFunction/John/Doe
    let options = {
        "headers": {
            "Content-Type": "application/json"
        }
    };
    let modulesQuery = await wixData.query("Modules").limit(1000);
    if (request.query.course) {
        modulesQuery.hasSome("courses", request.query.course);
    }
    if (request.query._id) {
        modulesQuery.eq("_id", request.query._id);
    }
    if (request.query.title) {
        modulesQuery.contains("title", request.query.title);
    }
    return modulesQuery.find().then(async (results) => {
        let allItems = results.items;
        while (results.hasNext()) {
            results = await results.next();
            allItems = allItems.concat(results.items);
        }
        const modifiedItems = allItems.map((module) => {
            return {
                title: module.title,
                shortName: module.shortName,
                color: module.color,
                skills: module.skills,
                about: module.about,
                _id: module._id
            }
        })
        options.body = {
            "items": modifiedItems
        };
        return ok(options);
    });
}

export async function get_lessons(request) {
    // URL looks like: https://www.mysite.com/_functions/myFunction/John/Doe
    let options = {
        "headers": {
            "Content-Type": "application/json"
        }
    };
    let lessonsQuery = await wixData.query("Lessons").limit(1000);
    if (request.query.module) {
        lessonsQuery.hasSome("Modules", request.query.course);
    }
    if (request.query._id) {
        lessonsQuery.eq("_id", request.query._id);
    }
    if (request.query.title) {
        lessonsQuery.contains("title", request.query.title);
    }
    return lessonsQuery.find().then(async (results) => {
        let allItems = results.items;
        while (results.hasNext()) {
            results = await results.next();
            allItems = allItems.concat(results.items);
        }
        const modifiedItems = allItems.map((lesson) => {
            return {
                title: lesson.title,
                order: lesson.order,
                _id: lesson._id
            }
        })
        options.body = {
            "items": modifiedItems
        };
        return ok(options);
    });
}

export async function get_lessonsbyModule(request) {
    // URL looks like: https://www.mysite.com/_functions/myFunction/John/Doe
    let options = {
        "headers": {
            "Content-Type": "application/json"
        }
    };
    return wixData.queryReferenced("Modules", request.path[0], "lessons").then(async (results) => {
        let allItems = results.items;
        while (results.hasNext()) {
            results = await results.next();
            allItems = allItems.concat(results.items);
        }
        const modifiedItems = allItems.map((lesson) => {
            return {
                title: lesson.title,
                order: lesson.order,
                _id: lesson._id
            }
        })
        options.body = {
            "items": modifiedItems
        };
        return ok(options);
    });

}

export function get_compoundInterest(request) {
    let options = {
        "headers": {
            "Content-Type": "application/json"
        }
    };
    const { principle, rate, time, compoundFrequency, contributionAmount, contributionFrequency } = request.query;
    const result = calculateInterest(principle, rate, time, compoundFrequency, contributionAmount, contributionFrequency);
    if (result) {
        options.body = result;
        return ok(options);
    } else {
        return badRequest();
    }
    function calculateInterest(principle, rate, time, compoundFrequency, contributionAmount, contributionFrequency) {
        console.log(principle + 'a' + rate + 'a' + time + 'a' + compoundFrequency + 'a' + contributionAmount + 'a' + contributionFrequency);
        principle = Number(principle);
        rate = Number(rate);
        contributionAmount = Number(contributionAmount);
        rate = rate / 100
        let intervals = [{ amount: principle, timePeriod: 0, year: "Now", interestTotal: 0, contributionTotal: 0 }];
        let compoundPeriodDayLength;
        switch (compoundFrequency) {
        case 'Yearly':
            compoundPeriodDayLength = 365;
            break;
        case 'Monthly':
            rate = rate / 12;
            compoundPeriodDayLength = 30;
            break;
        case 'Weekly':
            rate = rate / 52;
            compoundPeriodDayLength = 7;
            break;
        case 'Daily':
            rate = rate / 365;
            compoundPeriodDayLength = 1;
            break;
        }
        let contributionPeriodDayLength;
        switch (contributionFrequency) {
        case 'Yearly':
            contributionPeriodDayLength = 365;
            break;
        case 'Monthly':
            contributionPeriodDayLength = 30;
            break;
        case 'Weekly':
            contributionPeriodDayLength = 7;
            break;
        case 'Daily':
            contributionPeriodDayLength = 1;
            break;
        }
        const timeInDays = time * 365;
        let contributionTotal = 0;
        let interestTotal = 0;
        for (let i = 1; i <= timeInDays; i++) {
            if (i % compoundPeriodDayLength === 0) {
                interestTotal += (principle + interestTotal + contributionTotal) * rate;
            }
            if (i % contributionPeriodDayLength === 0) {
                contributionTotal += contributionAmount
            }
            if (i % 365 === 0) {
                intervals.push({ amount: principle, timePeriod: i, year: (i / 365).toString(), interestTotal: interestTotal, contributionTotal: contributionTotal })
            }
        }
        return {
            finalAmount: principle + interestTotal + contributionTotal,
            finalInterest: interestTotal,
            finalContributions: contributionTotal,
            intervals: intervals
        }
    }
}
