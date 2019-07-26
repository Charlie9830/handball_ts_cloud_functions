import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

var kickUserFromProject = functions.https.onCall(async (data, context) => {
    var projectId: string = data.projectId;
    var userId: string = data.userId;

    var batch = admin.firestore().batch();
    batch.delete(admin.firestore().collection(Paths.projects).doc(projectId).collection(Paths.members).doc(userId));
    batch.delete(admin.firestore().collection(Paths.users).doc(userId).collection(Paths.projectIds).doc(projectId));
    batch.delete(admin.firestore().collection(Paths.users).doc(userId).collection(Paths.invites).doc(projectId));

    try {
        await batch.commit();
        return {
            status: 'complete',
        }
    }
    catch (error) {
        return {
            status: 'error',
            message: 'Error occured while kicking user:' + error.message,
        }
    } 

});

export default kickUserFromProject;