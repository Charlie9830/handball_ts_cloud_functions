import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Paths from './types/FirestorePaths';

const kickUserFromProject = functions.https.onCall(async (data, context) => {
    // You have implemented very similiar Code as part of the deleteUser Authentication Trigger. Ensure you propagate any significant
    // changes made her to that function as well.
    const projectId: string = data.projectId;
    const userId: string = data.userId;

    const batch = admin.firestore().batch();
    batch.update(admin.firestore().collection(Paths.projects).doc(projectId).collection(Paths.members).doc(userId), { "status": "left" });
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