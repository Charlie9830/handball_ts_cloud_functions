import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Paths from './types/FirestorePaths';

const updateDisplayName = functions.https.onCall(async (data, context) => {
    if (context.auth === undefined || context.auth === null) {
        return;
    }

    const userId = context.auth.uid;

    // Payload
    const email = data.email;
    const desiredDisplayName = data.desiredDisplayName;

    const batch = admin.firestore().batch();

    // Update projects > members entites.
    const query = admin.firestore().collectionGroup(Paths.members).where('userId', '==', userId);
    const snapshot = await query.get();
    snapshot.forEach((doc) => {
        batch.update(
            doc.ref, {
                'displayName': desiredDisplayName
            });
    });

    // Update Directory.
    const directoryRef = admin.firestore().collection(Paths.directory).doc(email);
    batch.update(directoryRef, {
        'displayName': desiredDisplayName,
    })

    // Update Auth.
    try {
        await admin.auth().updateUser(userId, {
            'displayName': desiredDisplayName,
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

export default updateDisplayName;