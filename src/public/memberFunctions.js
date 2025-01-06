import { currentMember } from 'wix-members';

export const getRole = () => {
    try {
        return currentMember.getRoles().then((roles) => {
            const roleArray = [
                'f9a99e39-98dc-4240-8e03-8bbbe3ff7362',
                'bebb3f7d-a508-4aeb-a786-62b5e0a1b85c',
                '19668055-4bde-43bb-b325-4fef013696a0', 
                'a0077cc9-0484-41f4-bf70-614f09240711',
                '2dd0a07a-79a5-4125-b2f8-10230cbffbf8'
            ];
            const filteredRoles = roles.filter(obj => roleArray.includes(obj._id));
            return filteredRoles[0].title;
        })
    } catch (err) {
        throw new Error(err);
    }
}

export const getRoles = () => {
    try {
        return currentMember.getRoles().then((roles) => {
            const roleArray = [
                'f9a99e39-98dc-4240-8e03-8bbbe3ff7362',
                'bebb3f7d-a508-4aeb-a786-62b5e0a1b85c',
                '19668055-4bde-43bb-b325-4fef013696a0', 
                'a0077cc9-0484-41f4-bf70-614f09240711',
                '2dd0a07a-79a5-4125-b2f8-10230cbffbf8',
                'ba955865-f94c-4004-9ad0-a743d13feede'
            ];
            const filteredRoles = roles.filter(obj => roleArray.includes(obj._id));
            const filteredRolesTitleArray = filteredRoles.map((obj) => obj.title);
            return filteredRolesTitleArray;
        })
    } catch (err) {
        throw new Error(err);
    }
}

export function getMemberData(request) {
    try {
        return currentMember.getMember(/*{fieldsets: ['FULL']}*/).then((member) => {
            if (request) {
                switch (request) {
                    case 'firstName':
                        return member.contactDetails.firstName;
                    break;
                    case '_id':
                        return member._id
                    break;
                }
            } else {
                return member;
            }
        })
    } catch (err) {
        throw new Error(err);
    }
}