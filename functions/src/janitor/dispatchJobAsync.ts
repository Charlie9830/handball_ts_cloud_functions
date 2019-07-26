import * as functions from 'firebase-functions';
import cleanupTaskListMoveAsync from './cleanupTaskListMoveAsync';
import completeJobAsync from './completeJobAsync';

async function dispatchJobAsync(snapshot: FirebaseFirestore.DocumentSnapshot, context: functions.EventContext):Promise<void> {
    var job = snapshot.data();

    if (job == undefined) {
        return;
    }

    // Payload
    var type = job.type;
    var payload = job.payload;
    var jobId = context.params.jobId;

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
        throw 'Unrecognized Job Type';
    }

    return;
}

export default dispatchJobAsync;