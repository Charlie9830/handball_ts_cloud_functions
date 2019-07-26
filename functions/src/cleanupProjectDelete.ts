import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import MultiBatch from 'firestore-multibatch';

var cleanupProjectDelete = functions.firestore.document('projects/{projectId}').onDelete(async (snapshot, context) => {
    var projectId: string = context.params.projectId;
    var batch = new MultiBatch(admin.firestore());

    // Remove Members, ProjectIds and Completed Tasks
    var requests: Promise<void>[] = [
        removeMembersAndProjectIds(batch, projectId),
        removeCompletedTasksAsync(batch, projectId)
    ];

    try {
        await Promise.all(requests);
        return;
    } catch (error) {
        throw error;
    }
});

async function removeMembersAndProjectIds(batch: MultiBatch, projectId: string): Promise<void> {
    var membersSnapshot = await admin.firestore().collection(Paths.projects).doc(projectId).collection(Paths.members).get();

    membersSnapshot.forEach(memberDoc => {
        batch.delete(admin.firestore().collection(Paths.users).doc(memberDoc.id).collection(Paths.projectIds).doc(projectId));
        batch.delete(admin.firestore().collection(Paths.projects).doc(projectId).collection(Paths.members).doc(memberDoc.id));
    })

    return;
}

async function removeCompletedTasksAsync(batch: MultiBatch, projectId: string): Promise<void> {
    var completedTasksSnapshot = await admin.firestore().collection(Paths.projects).doc(projectId).collection(Paths.tasks).where('isComplete', '==', true).get();
    completedTasksSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    })

    return;
}

export default cleanupProjectDelete;