import * as admin from 'firebase-admin';
import Paths from "../types/FirestorePaths";

export async function collectProjectIds(userId: string): Promise<string[]> {
    const snapshot = await admin.firestore().collection(Paths.users).doc(userId).collection(Paths.projectIds).get();
    const projectIds: string[] = [];

    snapshot.forEach(doc => projectIds.push(doc.id));

    return projectIds;
}