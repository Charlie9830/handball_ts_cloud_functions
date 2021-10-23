import * as admin from 'firebase-admin';
import DirectoryListing from '../types/DirectoryListing';
import DirectoryLookupResult from '../types/DirectoryLookupResult';
import Paths from '../types/FirestorePaths';

const getUserFromDirectory = async (targetEmail: string): Promise<DirectoryLookupResult> => {
    const snapshot = await admin.firestore().collection(Paths.directory).doc(targetEmail).get();
    if (snapshot.exists) {
        return new DirectoryLookupResult(
            true,
            DirectoryListing.fromDoc(snapshot)
        )
    }

    else {
        return new DirectoryLookupResult(
            false,
            new DirectoryListing(
                '',
                '',
                ''
            )
        )
    }
}

export default getUserFromDirectory;