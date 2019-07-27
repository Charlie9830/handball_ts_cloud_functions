import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Paths from './types/FirestorePaths';

const getRemoteUserData = functions.https.onCall(async (data, context) => {
    const targetEmail = data.targetEmail;

    // Check if the user Exists.
    const snapshot = await admin.firestore().collection(Paths.directory).doc(targetEmail).get();
    if (snapshot.exists) {
        return {
            status: 'user found',
            userData: snapshot.data(),
        }
    }

    else {
        return {
            status: 'user not found',
            userData: {},
        }
    }
})

export default getRemoteUserData;