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
import removeOrphanedTaskComments from './removeOrphanedTaskComments';
import deleteUser from './deleteUser';
import changeDisplayName from './changeDisplayName';
import changeEmailAddress from './changeEmailAddress';
import sendAppAndProjectInvite from './sendAppAndProjectInvite';
import linkAccountToProject from './linkAccountToProject';
import propagateProjectDeletedFlag from './propagateProjectDeletedFlag';

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
});

// Authentication Triggers
exports.deleteUser = deleteUser;

// Firestore Triggers
exports.performJob = performJob;
exports.removeTasksOrphanedFromTaskLists = removeTasksOrphanedFromTaskLists;
exports.removeOrphanedTaskComments = removeOrphanedTaskComments;
exports.cleanupProjectDelete = cleanupProjectDelete;
exports.propagateProjectDeletedFlag = propagateProjectDeletedFlag;

// Callables
exports.sendProjectInvite = sendProjectInvite;
exports.sendAppAndProjectInvite = sendAppAndProjectInvite;
exports.kickUserFromProject = kickUserFromProject;
exports.acceptProjectInvite = acceptProjectInvite;
exports.denyProjectInvite = denyProjectInvite;
exports.getRemoteUserData = getRemoteUserData;
exports.changeDisplayName = changeDisplayName;
exports.changeEmailAddress = changeEmailAddress;
exports.linkAccountToProject = linkAccountToProject;
// exports.stripeUpgradeToPro = require('./stripeUpgradeToPro');

// PubSub Triggers
exports.handlePlaySubcriptionUpdate = handlePlaySubcriptionUpdate;

