import { authentication, currentMember } from 'wix-members';
import wixData from 'wix-data';
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { session } from 'wix-storage';
import { prefetchPageResources } from 'wix-site';
import { getRoles } from 'public/memberFunctions.js';
import { checkSession } from 'public/testing.js';

const prefetch = prefetchPageResources({
    "lightboxes": ["Login Form"],
});

if (prefetch.errors) {
    console.warn("Unable to Prefetch Login Lightbox");
}

$w.onReady(async function () {
    /*
    if (wixWindow.referrer === "https://www.gstatic.com/") {
        wixLocation.to('https://www.fin-teens.com/curriculum')
    }
    */
    $w('#testingStrip').delete();
    if (authentication.loggedIn()) {
        checkSession();
        loadMemberMenu();
        logoClick();
        if (wixWindow.formFactor === "Mobile") {
            $w('#mobileAccountButton').label = 'Account';
            loadMemberMobile();
        } else {
            loadMemberBox();
            $w("#loginHeaderButton, #signupHeaderButton").hide();
        }
        const memberprefetch = prefetchPageResources({
            "lightboxes": ["Member Lightbox"],
        });
        if (memberprefetch.errors) {
            console.warn("Unable to Prefetch Login Lightbox");
        }
    } else {
        $w('#financeduVector').link = '/';
        if (wixWindow.formFactor === "Mobile") {
            $w('#mobileAccountButton').label = 'Log In';
        } else {
            $w("#membersLoginBox").hide();
            $w("#loginHeaderButton, #signupHeaderButton").show();
        }
    }
    const screenData = await wixWindow.getBoundingRect();
    if (screenData.window.width < 1020) {
        $w('#searchicon, #horizontalMenu1').hide();
        $w('#tabletMenuButton').show();
    }
    $w('#copyrightTxt').html = `<p style="font-size:16px; line-height:normal;"><span style="letter-spacing:normal;"><span style="font-size:16px;"><span class="color_31">© ${new Date().getFullYear()} by Financedu, Inc.</span></span></span></p>`;
    authentication.onLogin(async (member) => {
        loadMemberMenu();
        const loggedInMember = await member.getMember();
        const memberId = loggedInMember._id;
        if (wixWindow.formFactor === "Mobile") {
            $w('#mobileAccountButton').label = 'Account';
            loadMemberMobile();
        } else {
            loadMemberBox();
            $w("#loginHeaderButton, #signupHeaderButton").hide();
            $w("#membersLoginBox").show();
        }
        checkDeactivationAccounts(memberId);
        logoClick();
        /*
        if (wixLocation.path.length > 0) {
            wixLocation.to(wixLocation.url);
        }
        */
    });
    authentication.onLogout(async () => {
        $w('#financeduVector').link = '/';
        if (wixWindow.formFactor === "Mobile") {
            $w('#mobileAccountButton').label = 'Log In';
            $w("#memberProfileImgMobile").hide();
        } else {
            $w("#membersLoginBox").hide();
            $w("#loginHeaderButton, #signupHeaderButton").show();
        }
    });
    /*
    if (!wixLocation.query.key || wixLocation.query.key !== "t") {
        $w('#searchicon').hide();
    }
    */
    async function logoClick() {
        let link;
        const member = await currentMember.getMember();
        const homepage = member.contactDetails.customFields['custom.default-homepage']?.value;
        if (homepage) {
            if (homepage === 'home') {
                link = '/';
            } else {
                link = `/account/${homepage}`
            }
        } else {
            link = `/`
        }
        $w('#financeduVector').link = link;
    }

    async function loadMemberMobile() {
        const member = await currentMember.getMember();
        if (member.profile.profilePhoto) {
            $w('#memberProfileImgMobile').src = member.profile.profilePhoto.url;
            $w('#memberProfileImgMobile').show();
            $w('#mobileMemberButton').hide();
            let link;
            const defaultHomepage = member.contactDetails.customFields['custom.default-homepage']?.value;
            if (defaultHomepage && defaultHomepage !== 'home') {
                link = `/account/${defaultHomepage}`;
            } else if (defaultHomepage === 'home') {
                link = '/account/learner-dashboard';
            } else {
                link = '/account/learner-dashboard';
            }
            $w('#memberProfileImgMobile').link = link;
        }
    }

    async function loadMemberBox() {
        const member = await currentMember.getMember();
        if (member.profile.nickname) {
            $w('#memberBoxProfileTxt').text = truncateTxt(member.profile.nickname);
        } else {
            $w('#memberBoxProfileTxt').text = truncateTxt(member.contactDetails.firstName);
        }
        if (member.profile.profilePhoto) {
            $w('#memberBoxProfileImg').src = member.profile.profilePhoto.url;
        }
        /*
        $w('#memberBoxProfileTxt').text = "Eamon Gordon";
        $w('#memberBoxProfileImg').src = 'https://static.wixstatic.com/media/2dcc6c_d746f44b3516479784602d3f1246d7af~mv2.jpg';
        */
        $w("#membersLoginBox").show();
    }

    function truncateTxt(input) {
        if (input.length > 10) {
            return input.substring(0, 10) + '...';
        } else {
            return input;
        }
    }

});

async function loadMemberMenu() {
    const roles = await getRoles();
    let menuItems = [];
    if (roles.includes('Learner')) {
        menuItems.push({
            "link": "/account/learner-dashboard",
            "target": "_self",
            "label": "Learner Dashboard",
            "menuItems": []
        });
    }
    if (roles.includes('Parent')) {
        menuItems.push({
            "link": "/account/parent-dashboard",
            "target": "_self",
            "label": "Parent Dashboard",
            "menuItems": []
        });
    }
    if (roles.includes('Teacher') || roles.includes('Student')) {
        menuItems.push({
            "link": "/account/classes",
            "target": "_self",
            "label": "Classes",
            "menuItems": []
        });
    }
    if (roles.includes('Administrator')) {
        menuItems.push({
            "link": "/account/organizations",
            "target": "_self",
            "label": "Organizations",
            "menuItems": []
        });
    }
    if (roles.includes('Donor')) {
        menuItems.push({
            "link": "/account/recurring-donations",
            "target": "_self",
            "label": "Recurring Donations",
            "menuItems": [{
                "link": "/account/payment-info",
                "target": "_self",
                "label": "Payment Info",
                "menuItems": []
            }]
        });
    }
    if (roles.includes('Tester')) {
        menuItems.push({
            "link": "/account/testing",
            "target": "_self",
            "label": "Testing",
            "menuItems": []
        })
    }
    menuItems.push({
        "link": "/account/settings",
        "target": "_self",
        "label": "Settings",
        "menuItems": []
    }, {
        "selected": false,
        "target": "_self",
        "label": "Log Out",
        "menuItems": []
    });
    if (wixWindow.formFactor === 'Mobile') {
        $w('#mobileMemberDropdown').options = menuItems.map((obj) => { return { label: obj.label, value: obj.link } });
        $w('#mobileMemberDropdown').options.forEach((obj, index) => {
            let currentUrlPath = wixLocation.url.split('/').reverse();
            currentUrlPath.length = 2
            let menuUrlPath = obj.value.split('/').reverse();
            menuUrlPath.length = 2;
            if (menuUrlPath.toString() === currentUrlPath.toString()) {
                $w('#mobileMemberDropdown').value = obj.value;
            }
        });
        $w('#mobileMemberDropdown').onChange((event) => {
            if (event.target.value === "/") {
                Promise.all([authentication.logout(), wixLocation.to('/')]);
            } else {
                wixLocation.to(event.target.value);
            }
        });
    } else {
        $w("#headerMemberMenu").menuItems = menuItems;
        $w('#headerMemberMenu, #verticalMenu2').onItemClick((event) => {
            if (event.item.label === "Log Out") {
                Promise.all([authentication.logout(), wixLocation.to('/')]);
            }
        });
    }
    if (authentication.loggedIn()) {
        $w('#verticalMenu2').menuItems = menuItems;
    }
    //const firstPath = null ?? wixLocation.path[0];
    //if (firstPath === 'account') {
    //setTimeout(() => {
    //}, 100);
    //}
}

function checkDeactivationAccounts(userId) {
    wixData.query("DeactivationAccounts")
        .eq("title", userId)
        .find()
        .then((results) => {
            if (results.items.length > 0) {
                wixWindow.openLightbox("Deactivate Account", { "message": "reactivate" });
            }
        });
}

export function searchIcon_click(event) {
    wixWindow.openLightbox("Search (Header)", { "page": wixLocation.path[0] })
}

export function mobileMemberButton_click(event) {
    mobileAccountButton_click();
}

export function membersLoginBox_click(event) {
    if ($w('#memberMenuBox').isVisible) {
        $w('#memberMenuBox').hide();
    } else {
        $w('#memberMenuBox').show();
    }
}

export function memberMenuBox_mouseOut(event) {
    $w('#memberMenuBox').hide('fade', { duration: 100 });
}

export function memberBoxProfileTxt_mouseIn(event) {
    $w('#memberBoxProfileTxt').html = `<h5 style="font-size:20px;"><span style="font-weight:normal;"><span style="color:#13c402; font-family:avenir-lt-w01_35-light1475496,avenir-lt-w05_35-light,sans-serif;"><span style="font-size:18px;">${$w('#memberBoxProfileTxt').text}</span></span></span></h5>`;
}

export function memberBoxProfileTxt_mouseOut(event) {
    $w('#memberBoxProfileTxt').html = `<h5 style="font-size:20px;"><span style="font-weight:normal;"><span style="color:#3bde2c; font-family:avenir-lt-w01_35-light1475496,avenir-lt-w05_35-light,sans-serif;"><span style="font-size:18px;">${$w('#memberBoxProfileTxt').text}</span></span></span></h5>`;
}

export function columnStripHeader_viewportLeave(event) {
    if ($w('#memberMenuBox').isVisible) {
        $w('#memberMenuBox').hide('fade', { duration: 100 });
    }
}

export async function mobileAccountButton_click(event) {
    if (authentication.loggedIn()) {
        const member = await currentMember.getMember();
        const defaultHomepage = member.contactDetails.customFields['custom.default-homepage']?.value;
        if (defaultHomepage && defaultHomepage !== 'home') {
            wixLocation.to(`/account/${defaultHomepage}`);
        } else if (defaultHomepage === 'home') {
            wixLocation.to('/account/learner-dashboard');
        } else {
            wixLocation.to('/account/learner-dashboard');
        }
    } else {
        wixWindow.openLightbox("Login Form", { successUrl: '/' });
    }
}

export function searchicon_click(event) {
    wixWindow.openLightbox("Search (Header)", { "page": wixLocation.path[0] });
}