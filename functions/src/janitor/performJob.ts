import * as functions from 'firebase-functions';
import dispatchJobAsync from './dispatchJobAsync';

const performJob = functions.firestore.document('jobsQueue/{jobId}').onCreate(async (snapshot, context) => {
    try {
        return dispatchJobAsync(snapshot, context);
    }
    catch (error) {
        throw error;
    }
})

export default performJob;