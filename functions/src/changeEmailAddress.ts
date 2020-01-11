import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Paths from './types/FirestorePaths';
import { collectProjectIds } from './utilities/collectProjectIds';
import DirectoryListing from './types/DirectoryListing';

const changeEmailAddress = functions.https.onCall(async (data, context) => {
    if (context.auth === undefined) {
        return {
            status: 'error',
            message: "User isn't logged in"
        }
    }

    let newEmailAddress: string = data.newEmailAddress;
    let oldEmailAddress: string = data.oldEmailAddress;
    const userId = context.auth.uid;

    newEmailAddress = newEmailAddress.trim();
    oldEmailAddress = oldEmailAddress.trim();

    try {
        // Update Email
        await admin.auth().updateUser(userId, { email: newEmailAddress });
    } catch (error) {
        // TODO: Log the actual error in detail for Stackdriver.
        if (error.code === 'auth/email-already-exists') {
            return {
                status: 'error',
                message: 'That email address is unavailable.'
            }

        }

        return {
            status: 'error',
            message: 'Something went wrong. Please try again.'
        }
    }

    // Collect associated ProjectIds.
    const projectIds = await collectProjectIds(userId);
    const requests: Promise<void>[] = [];

    // Update Associated projects Members.
    projectIds.forEach(id => requests.push(updateMemberEmail(id, userId, newEmailAddress)));

    // Update Email in Directory.
    requests.push(updateDirectoryEmail(oldEmailAddress, newEmailAddress));

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

async function updateDirectoryEmail(oldEmail: string, newEmail: string) {
    const batch = admin.firestore().batch();
    const snapshot = await admin.firestore().collection(Paths.directory).doc(oldEmail).get();

    if (snapshot.exists && snapshot.data() !== undefined) {
        const data = snapshot.data() || {}; // Keeps TS Happy. We won't ever hit {} because we are checking for undefined above.

        const directoryListing = new DirectoryListing(
            data['userId'],
            data['displayName'],
            newEmail,
        );

        // Delete Original Listing.
        batch.delete(snapshot.ref);

        // Set new Listing at newEmail.
        batch.set(admin.firestore().collection(Paths.directory).doc(newEmail), { ...directoryListing });

        await batch.commit();
        return;
    }

    throw Error('Failed to find a directory listing to update. Email: ' + oldEmail);

}

async function updateMemberEmail(projectId: string, userId: string, newEmail: string) {
    await admin.firestore().collection(Paths.projects)
        .doc(projectId)
        .collection(Paths.members)
        .doc(userId)
        .update({
            'email': newEmail
        });

    return;
}

export default changeEmailAddress;