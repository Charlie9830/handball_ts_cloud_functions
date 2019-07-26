import * as admin from 'firebase-admin';

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
});


// exports.stripeUpgradeToPro = require('./stripeUpgradeToPro');
exports.handlePlaySubcriptionUpdate = require('./handlePlaySubscriptionUpdate');
exports.sendProjectInvite = require('./sendProjectInvite');
exports.performJob = require('./janitor/performJob');
exports.removeTasksOrphanedFromTaskLists = require('./removeTasksOrphanedFromTaskLists');
exports.removeOrphanedTaskComments = require('./removeOrphanedTaskComments');
exports.kickUserFromProject = require('./kickUserFromProject');
exports.acceptProjectInvite = require('./acceptProjectInvite');
exports.denyProjectInvite = require('./denyProjectInvite');
exports.cleanupProjectDelete = require('./cleanupProjectDelete');
