import * as admin from 'firebase-admin';
import Paths from '../types/FirestorePaths';

async function completeJobAsync(jobId: string, result: string, error: any):Promise<FirebaseFirestore.WriteResult> {
    if (result === 'success') {
        return admin.firestore().collection(Paths.jobsQueue).doc(jobId).delete();
    }

    else {
        return admin.firestore().collection(Paths.jobsQueue).doc(jobId).update({ error: convertErrorToString(error)})
    }
}

function convertErrorToString(error:any) {
    if (typeof(error) === "string") {
        return error;
    }

    if (typeof(error) === "object") {
        if (error["message"] !== undefined) {
            return error.message;
        }

        else {
            return "Could not convert Error to String."
        }
    }

    return "convertErrorToString failed to convert the error."
}

export default completeJobAsync;