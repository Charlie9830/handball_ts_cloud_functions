import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

var denyProjectInvite = functions.https.onCall(async (data, context) => {
    if (context.auth == undefined) {
        return;
    }

    var projectId = data.projectId;
    var userId = context.auth.uid;

    var memberRef = admin.firestore().collection(Paths.projects).doc(projectId).collection(Paths.members).doc(userId);

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