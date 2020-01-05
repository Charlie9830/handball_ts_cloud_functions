import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Paths from './types/FirestorePaths';
import ProjectIdModel from './types/ProjectId';

const acceptProjectInvite = functions.https.onCall(async (data, context) => {
    if (context.auth === undefined) {
        return;
    }

    const projectId = data.projectId;
    const userId = context.auth.uid;
    const batch = admin.firestore().batch();

    // Check that the user still exists in the projects member collection.
    const memberRef = admin.firestore().collection(Paths.projects).doc(projectId).collection(Paths.members).doc(userId);
    const memberDocSnapshot = await memberRef.get();
    if (memberDocSnapshot.exists === false) {
        return {
            status: 'error',
            message: 'User has been removed from the project, or the project has been deleted'
        }
    }

    batch.update(memberRef, { status: 'added' });

    const remoteIdsRef = admin.firestore().collection(Paths.users).doc(userId).collection(Paths.projectIds).doc(projectId);
    batch.set(remoteIdsRef, { ...new ProjectIdModel(projectId) });

    try {
        await batch.commit();
        return {
            status: 'complete'
        }
    } catch (error) {
        return {
            status: 'error',
            message: 'An error occured whilst joining the project'
        }
    }
});

export default acceptProjectInvite;