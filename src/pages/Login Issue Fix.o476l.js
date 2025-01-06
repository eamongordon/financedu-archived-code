import {authentication} from 'wix-members-frontend';

$w.onReady(function () {
authentication.promptLogin();
});