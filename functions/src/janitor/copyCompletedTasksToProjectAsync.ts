import { CollectionReference } from "@google-cloud/firestore";
import * as admin from 'firebase-admin';
import MultiBatch from "firestore-multibatch";

async function copyCompletedTasksToProjectAsync(
    sourceProjectId: string,
    targetProjectId: string,
    taskListId: string,
    sourceTasksRef: CollectionReference,
    targetTasksRef: CollectionReference): Promise<string[]> {

    var completedTaskIds: string[] = [];
    var batch = new MultiBatch(admin.firestore())

    var snapshot = await sourceTasksRef.where('taskList', '==', taskListId).where('isComplete', "==", true).get();
    if (!snapshot.empty) {
        snapshot.forEach(doc => {
            completedTaskIds.push(doc.id);
            batch.set(targetTasksRef.doc(doc.id), { ...doc.data(), project: targetProjectId });
        })

        await batch.commit();
    }

    return completedTaskIds;
}

export default copyCompletedTasksToProjectAsync;