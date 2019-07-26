import * as functions from 'firebase-functions';
import cleanupTaskListMoveAsync from './cleanupTaskListMoveAsync';
import completeJobAsync from './completeJobAsync';

async function dispatchJobAsync(snapshot: FirebaseFirestore.DocumentSnapshot, context: functions.EventContext):Promise<void> {
    const job = snapshot.data();

    if (job === undefined) {
        return;
    }

    // Payload
    const type = job.type;
    const payload = job.payload;
    const jobId = context.params.jobId;

    // Task List Move.
    if (type === 'CLEANUP_TASKLIST_MOVE') {
        try {
            await cleanupTaskListMoveAsync(payload);
            return;
        }

        catch (error) {
            await completeJobAsync(jobId, 'failure', error);
            return;
        }
    }

    else {
        throw new Error('Unrecognized Job Type');
    }

    return;
}

export default dispatchJobAsync;