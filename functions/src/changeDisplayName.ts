import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Paths from './types/FirestorePaths';

const changeDisplayName = functions.https.onCall(async (data, context) => {
    if (context.auth === undefined) {
        return {
            status: 'error',
            message: "User isn't logged in"
        }
    }

    const desiredDisplayName = data.desiredDisplayName;
    const email = data.email;
    const userId = context.auth.uid;

    // Collect associated ProjectIds.
    const projectIds = await collectProjectIds(userId);
    const requests: Promise<void>[] = [];

    // Update the member entity in each project.
    projectIds.forEach(projectId => requests.push(updateMemberDisplayName(projectId, userId, desiredDisplayName)));
    
    // Update the Auth UserProfile.
    requests.push(updateDisplayNameInAuth(userId, desiredDisplayName));

    // Update the Directory Listing.
    requests.push(updateDirectoryListing(email, desiredDisplayName));

    try {
        await Promise.all(requests);
        return {
            'status': 'complete',
        };
    } catch (error) {
        return {
            'status': 'error',
            'message': 'Something went wrong, please try again.'
        }
    }
});

async function updateDisplayNameInAuth(userId: string, desiredDisplayName: string) {
    await admin.auth().updateUser(userId, {
        'displayName': desiredDisplayName,
    });

    return;
}

async function collectProjectIds(userId: string): Promise<string[]> {
    const snapshot = await admin.firestore().collection(Paths.users).doc(userId).collection(Paths.projectIds).get();
    const projectIds: string[] = [];

    snapshot.forEach(doc => projectIds.push(doc.id));

    return projectIds;
}

async function updateMemberDisplayName(projectId: string, userId: string, newDisplayName: string) {
    await admin.firestore().collection(Paths.projects)
        .doc(projectId)
        .collection(Paths.members)
        .doc(userId)
        .update({
            'displayName': newDisplayName
        });

    return;
}

async function updateDirectoryListing(email: string, newDisplayName: string) {
    await admin.firestore()
        .collection(Paths.directory)
        .doc(email)
        .update({
            'displayName': newDisplayName,
        });

    return;
}

export default changeDisplayName;