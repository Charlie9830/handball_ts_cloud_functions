import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import MultiBatch from 'firestore-multibatch';

var removeTasksOrphanedFromTaskLists = functions.firestore.document('projects/{projectId}/taskLists/{taskListId}').onDelete(async (snapshot, context) => {
    var projectId = context.params.projectId;
    var taskListId = context.params.taskListId;

    var query = await admin.firestore().collection(Paths.projects).doc(projectId).collection(Paths.tasks).where('taskList', '==', taskListId).get();
    if (query.empty) {
        return;
    }

    var batch = new MultiBatch(admin.firestore());
    query.forEach( doc => batch.delete(doc.ref));

    try {
        await batch.commit();
        return;
    } catch (error) {
        throw error;
    }
})  

export default removeTasksOrphanedFromTaskLists;