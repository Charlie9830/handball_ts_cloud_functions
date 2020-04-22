import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Paths from './types/FirestorePaths';

// When a project is deleted a flag is set on the related projectIdModel. However the projectIdModel is unique to every user. Therefore the user that deleted the project
// will only set the flag on their own projectIdModel. As a result we need this Cloud Function to trigger and propagate the change to the other users projectIdModels.
const propagateProjectDeletedFlag = functions.firestore.document('users/{userId}/projectIds/{projectId}').onUpdate(async (change, context) => {
    const userId: string = context.params.userId;
    const projectId: string = context.params.projectId;
    const oldData = change.before.data() || {};
    const newData = change.after.data() || {};
    const oldIsDeleted = oldData.isDeleted;
    const newIsDeleted = oldData.isDeleted;
    const batch = admin.firestore().batch();

    if (oldIsDeleted === newIsDeleted) {
        return;
    }

    const newDeletedOn = newData.deletedOn;

    const targetMemberIds = await getTargetMemberIds(projectId, userId);

    if (targetMemberIds.length === 0) {
        return;
    }

    // Propagate to members projectId Models.
    targetMemberIds.forEach(id => {
        batch.update(
            admin.firestore().collection(Paths.users).doc(id).collection(Paths.projectIds).doc(projectId),
            {
                'isDeleted': newIsDeleted,
                'deletedOn': newDeletedOn || null,
            }
        )
    })

    // Propagate to projectDoc. This helps the linkAccountToProject cloud Function determine if the project has been deleted.


    try {
        await batch.commit();
        return;
    } catch (error) {
        throw error;
    }

});

const getTargetMemberIds = async (projectId: string, userId: string): Promise<string[]> => {
    const snapshot = await admin.firestore().collection(Paths.projects).doc(projectId).collection(Paths.members).get();
    const ids: string[] = [];

    snapshot.forEach(docSnap => {
        if (docSnap.id !== userId) {
            ids.push(docSnap.id);
        }
    })

    return ids;
}

export default propagateProjectDeletedFlag;