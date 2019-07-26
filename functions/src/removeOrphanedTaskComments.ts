import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import MultiBatch from 'firestore-multibatch';

const removeOrphanedTaskComments = functions.firestore.document('projects/{projectId}/tasks/{taskId}').onDelete(async (snapshot, context) => {
    const projectId: string = context.params.projectId;
    const taskId: string = context.params.taskId;

    const query = await admin.firestore().collection(Paths.projects).doc(projectId).collection(Paths.tasks).doc(taskId).collection(Paths.taskComments).get();
    
    if (query.empty) {
        return;
    }

    const batch = new MultiBatch(admin.firestore());
    query.forEach( doc => {
        batch.delete(doc.ref);
    });
    
    await batch.commit();
    return;
})

export default removeOrphanedTaskComments;