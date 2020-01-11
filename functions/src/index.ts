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

// Callables
exports.sendProjectInvite = sendProjectInvite;
exports.kickUserFromProject = kickUserFromProject;
exports.acceptProjectInvite = acceptProjectInvite;
exports.denyProjectInvite = denyProjectInvite;
exports.getRemoteUserData = getRemoteUserData;
exports.changeDisplayName = changeDisplayName;
exports.changeEmailAddress = changeEmailAddress;
// exports.stripeUpgradeToPro = require('./stripeUpgradeToPro');

// PubSub Triggers
exports.handlePlaySubcriptionUpdate = handlePlaySubcriptionUpdate;
