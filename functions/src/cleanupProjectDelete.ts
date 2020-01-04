import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Paths from './types/FirestorePaths';
import MultiBatch from './MultiBatch';

const cleanupProjectDelete = functions.firestore.document('projects/{projectId}').onDelete(async (snapshot, context) => {
    const projectId: string = context.params.projectId;
    const mainBatch = new MultiBatch(admin.firestore());
    const activityFeedBatch = new MultiBatch(admin.firestore());

    // Remove Members, ProjectIds and Completed Tasks
    const requests: Promise<void>[] = [
        appendMemberAndProjectIdDeletesToBatchAsync(mainBatch, projectId),
        appendCompletedTaskDeletesToBatchAsync(mainBatch, projectId),
        appendActivityFeedDeletesToBatchAsync(activityFeedBatch, projectId),
    ];

    try {
        await Promise.all(requests);
        await mainBatch.commit();
        await activityFeedBatch.commit(); // Batch these seperately as they could be extremely numerous in count.
        
        return;
    } catch (error) {
        throw error;
    }
});

async function appendActivityFeedDeletesToBatchAsync(batch: any, projectId: string): Promise<void> {
    const activityFeedSnapshot = await admin.firestore().collection(Paths.projects).doc(projectId).collection(Paths.activityFeed).get();
    const baseCollectionRef = admin.firestore().collection(Paths.projects).doc(projectId).collection(Paths.activityFeed);

    activityFeedSnapshot.forEach(eventDoc => {
        if (eventDoc.exists) {
            batch.delete(baseCollectionRef.doc(eventDoc.id));
        }
    });

    return;
}

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