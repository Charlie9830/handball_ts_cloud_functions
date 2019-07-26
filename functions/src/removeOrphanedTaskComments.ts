import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import MultiBatch from 'firestore-multibatch';

var removeOrphanedTaskComments = functions.firestore.document('projects/{projectId}/tasks/{taskId}').onDelete(async (snapshot, context) => {
    var projectId: string = context.params.projectId;
    var taskId: string = context.params.taskId;

    var query = await admin.firestore().collection(Paths.projects).doc(projectId).collection(Paths.tasks).doc(taskId).collection(Paths.taskComments).get();
    
    if (query.empty) {
        return;
    }

    var batch = new MultiBatch(admin.firestore());
    query.forEach( doc => {
        batch.delete(doc.ref);
    });
    
    await batch.commit();
    return;
})

export default removeOrphanedTaskComments;