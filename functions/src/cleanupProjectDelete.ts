import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Paths from './types/FirestorePaths';
import MultiBatch from './MultiBatch';

const cleanupProjectDelete = functions.firestore.document('projects/{projectId}').onDelete(async (snapshot, context) => {
    const projectId: string = context.params.projectId;
    const batch = new MultiBatch(admin.firestore());

    // Remove Members, ProjectIds and Completed Tasks
    const requests: Promise<void>[] = [
        appendMemberAndProjectIdDeletesToBatchAsync(batch, projectId),
        appendCompletedTaskDeletesToBatchAsync(batch, projectId)
    ];

    try {
        await Promise.all(requests);
        await batch.commit();
        return;
    } catch (error) {
        throw error;
    }
});

async function appendMemberAndProjectIdDeletesToBatchAsync(batch: any, projectId: string): Promise<void> {
    const membersSnapshot = await admin.firestore().collection(Paths.projects).doc(projectId).collection(Paths.members).get();

    membersSnapshot.forEach(memberDoc => {
        batch.delete(admin.firestore().collection(Paths.users).doc(memberDoc.id).collection(Paths.projectIds).doc(projectId));
        batch.delete(admin.firestore().collection(Paths.projects).doc(projectId).collection(Paths.members).doc(memberDoc.id));
    })

    return;
}

async function appendCompletedTaskDeletesToBatchAsync(batch: any, projectId: string): Promise<void> {
    const completedTasksSnapshot = await admin.firestore().collection(Paths.projects).doc(projectId).collection(Paths.tasks).where('isComplete', '==', true).get();
    completedTasksSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    })

    return;
}

export default cleanupProjectDelete;