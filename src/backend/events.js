import wixData from 'wix-data';
import { authorization } from 'wix-members-backend'
//import { assignRoles } from 'backend/memberFunctions/extraFunctions.jsw';

export async function wixMembers_onMemberCreated(event) {
    const learnerRoleId = "bebb3f7d-a508-4aeb-a786-62b5e0a1b85c";
    const testerRoleId = "ba955865-f94c-4004-9ad0-a743d13feede";
    //const personQuery = await wixData.query("MemberData").eq("_id", event.entity._id).find();
    let memberData = /*personQuery.items.length > 0 ? personQuery.items[0] : */ { "_id": event.entity._id };
    return wixData.save("MemberData", memberData).then(() => {
        return authorization.assignRole(learnerRoleId, event.entity._id).then(() => {
            return { status: true };
            /*
            return authorization.assignRole(testerRoleId, event.entity._id).then(() => {
                return { status: true };
            }).catch((err) => {
                throw new Error(err);
            });
            //if (role === "Teacher")
            */
        }).catch((err) => {
            throw new Error(err);
        })
    });
    //const creationEventId = event.metadata.id;
}