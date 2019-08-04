import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Paths from './types/FirestorePaths';

const updateEmailAddress = functions.https.onCall(async (data, context) => {
    if (context.auth === undefined || context.auth === null) {
        return;
    }

    const userId = context.auth.uid;

    // Payload
    const currentEmail = data.currentEmail;
    const newEmail = data.newEmail;

    const batch = admin.firestore().batch();

    // Update projects > members entites.
    const query = admin.firestore().collectionGroup(Paths.members).where('userId', '==', userId);
    const snapshot = await query.get();
    snapshot.forEach((doc) => {
        batch.update(
            doc.ref, {
                'email': newEmail,
            });
    });

    // Update Directory.
    const existingDirectoryRef = admin.firestore().collection(Paths.directory).doc(currentEmail);
    const existingDirectoryDoc = await existingDirectoryRef.get();
    if (existingDirectoryDoc.data() !== undefined) {
        // Set new Directory Ref with updated Email Address
        batch.set(
            admin.firestore().collection(Paths.directory).doc(newEmail),
            { ...existingDirectoryDoc.data(), email: newEmail }
        )

        // Delete old Directory Listing.
        batch.delete(existingDirectoryRef);
    } 

    else {
        return {
            'status': 'error'
        }
    }


    // Update Auth.
    try {
        await admin.auth().updateUser(userId, {
            'email': newEmail,
        })

        await batch.commit();

        return {
            'status': 'complete'
        }
    } catch (error) {
        return {
            'status': 'error'
        }
    }
});

export default updateEmailAddress;