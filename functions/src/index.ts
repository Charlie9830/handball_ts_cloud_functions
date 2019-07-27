import * as admin from 'firebase-admin';
import handlePlaySubcriptionUpdate from './handlePlaySubscriptionUpdate';
import sendProjectInvite from './sendProjectInvite';
import performJob from './janitor/performJob';
import removeTasksOrphanedFromTaskLists from './removeTasksOrphanedFromTaskLists';
import kickUserFromProject from './kickUserFromProject';
import acceptProjectInvite from './acceptProjectInvite';
import denyProjectInvite from './denyProjectInvite';
import cleanupProjectDelete from './cleanupProjectDelete';
import getRemoteUserData from './getRemoteUserData';

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
});


// exports.stripeUpgradeToPro = require('./stripeUpgradeToPro');
exports.handlePlaySubcriptionUpdate = handlePlaySubcriptionUpdate;
exports.sendProjectInvite = sendProjectInvite;
exports.performJob = performJob;
exports.removeTasksOrphanedFromTaskLists = removeTasksOrphanedFromTaskLists;
exports.removeOrphanedTaskComments = removeTasksOrphanedFromTaskLists;
exports.kickUserFromProject = kickUserFromProject;
exports.acceptProjectInvite = acceptProjectInvite;
exports.denyProjectInvite = denyProjectInvite;
exports.cleanupProjectDelete = cleanupProjectDelete;
exports.getRemoteUserData = getRemoteUserData;
