import { cleanMemberLoginTokens, deleteUsers } from '@prospectorminerals/memberfunctions-backend';
import wixData from 'wix-data';

export function cleanMemberLoginTokensHandler() {
    return cleanMemberLoginTokens();
}

export function deleteUsersHandler() {
    return deleteUsers();
}

export function deleteInvitations() {
    const now = new Date();
    wixData.query('ParentInvitations')
        .le('expiryDate', now)
        .find()
        .then(res => {
            const tokenArray = res.items.map(region => { return region._id });
            wixData.bulkRemove("ParentInvitations", tokenArray);
        }).catch((error) => {
            throw new Error(error);
        });
    wixData.query('ClassInvitations')
        .le('expiryDate', now)
        .find()
        .then(res => {
            const tokenArray = res.items.map(region => { return region._id });
            wixData.bulkRemove("ClassInvitations", tokenArray);
        }).catch((error) => {
            throw new Error(error);
        });
    wixData.query('OrganizationInvitations')
        .le('expiryDate', now)
        .find()
        .then(res => {
            const tokenArray = res.items.map(region => { return region._id });
            wixData.bulkRemove("OrganizationInvitations", tokenArray);
        }).catch((error) => {
            throw new Error(error);
        });

}