import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Paths from './types/FirestorePaths';

const denyProjectInvite = functions.https.onCall(async (data, context) => {
    if (context.auth === undefined) {
        return;
    }

    const projectId = data.projectId;
    const userId = context.auth.uid;

    const memberRef = admin.firestore().collection(Paths.projects).doc(projectId).collection(Paths.members).doc(userId);

    try {
        await memberRef.update({
            status: 'rejected invite'
        });

        return {
            status: 'complete'
        }
    } catch (error) {
        return {
            status: 'error',
            message: 'Error occured whilst denying project invite.' + error.message
        }
    }
});

export default denyProjectInvite;