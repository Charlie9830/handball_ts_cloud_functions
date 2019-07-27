import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Paths from './types/FirestorePaths';
import MultiBatch from './MultiBatch';

const removeTasksOrphanedFromTaskLists = functions.firestore.document('projects/{projectId}/taskLists/{taskListId}').onDelete(async (snapshot, context) => {
    const projectId = context.params.projectId;
    const taskListId = context.params.taskListId;

    const query = await admin.firestore().collection(Paths.projects).doc(projectId).collection(Paths.tasks).where('taskList', '==', taskListId).get();
    if (query.empty) {
        return;
    }

    const batch = new MultiBatch(admin.firestore());
    query.forEach( doc => batch.delete(doc.ref));

    try {
        await batch.commit();
        return;
    } catch (error) {
        throw error;
    }
})  

export default removeTasksOrphanedFromTaskLists;