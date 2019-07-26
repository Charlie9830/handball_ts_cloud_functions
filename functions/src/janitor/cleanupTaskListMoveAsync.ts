import * as admin from 'firebase-admin';
import MultiBatch from 'firestore-multibatch';
import copyCompletedTasksToProjectAsync from './copyCompletedTasksToProjectAsync';

async function cleanupTaskListMoveAsync(payload: any) {
    /*
        -> Collect completedTasks related to the Task List and COPY them to the Target Project. Save an Array of TaskIds
        -> Concat the CompletedTaskIds array together with the taskIds array from the Payload.
        -> Iterate through the taskIds, Copy Task Comments to the targetProject then Delete the original Task.
        -> Another Cloud Function will Trigger on Task Delete and cleanup comments from Original Project.
    
    EXPECTED PAYLOAD
        sourceProjectId               string
        targetProjectId               string
        taskListWidgetId              string
        taskIds                       []                                    Id's of Tasks belonging to the Task List.
        targetTasksRefPath            string (Document Reference Path);
        targetTaskListRefPath         string (Document Reference Path);
        sourceTasksRefPath            string (Document Reference Path);
        sourceTaskListRefPath         string (Document Reference Path); 
    */

    let requests: Promise<void>[] = [];
    const batch = new MultiBatch(admin.firestore());

    const taskIds: string[] = payload.taskIds;
    const sourceProjectId = payload.sourceProjectId;
    const targetProjectId = payload.targetProjectId;
    const taskListId = payload.taskListId;
    const sourceTasksRef = admin.firestore().collection(payload.sourceTasksRefPath);
    const targetTasksRef = admin.firestore().collection(payload.targetTasksRefPath);
    const sourceTaskListRef = admin.firestore().doc(payload.sourceTaskListRefPath);

    const completedTaskIds = await copyCompletedTasksToProjectAsync(sourceProjectId, targetProjectId, taskListId, sourceTasksRef, targetTasksRef);
    // Combine the TaskIds from the Job Payload (Moved by the Client)
    // and the TaskIds returned from copyCompletedTasksToProjectAsync (Copied by Server).
    const mergedTaskIds = [...taskIds, ...completedTaskIds];

    requests = [...requests, ...mergedTaskIds.map(taskId => {
        return moveTaskCommentsAsync(targetTasksRef, sourceTasksRef, taskId, batch);
    })];

    // Delete the source Task List.
    batch.delete(sourceTaskListRef);

    await Promise.all(requests);
    await batch.commit();
    return;
}

async function moveTaskCommentsAsync(targetTasksRef: FirebaseFirestore.CollectionReference,
    sourceTasksRef: FirebaseFirestore.CollectionReference,
    taskId: string,
    batch: MultiBatch): Promise<void> {
    const snapshot = await sourceTasksRef.doc(taskId).collection(Paths.taskComments).get();
    if (!snapshot.empty) {
        // Iterate through Comments and add them to the new Location, then delete the Task from the old Location.
        // Another cloud Function will kick in and delete the Task comments from the source location.
        snapshot.forEach(doc => {
            batch.set(targetTasksRef.doc(taskId).collection(Paths.taskComments).doc(doc.id), doc.data());
            batch.delete(sourceTasksRef.doc(taskId));
        })
    }

    return;
}

export default cleanupTaskListMoveAsync;