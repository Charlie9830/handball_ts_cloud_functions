import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import parseMemberRole from './utilities/parseMemberRole';
import Paths from './types/FirestorePaths';
import ProjectInviteModel from './types/ProjectInvite';
import MemberModel from './types/Member';

const sendProjectInvite = functions.https.onCall(async (data, context) => {
    // Payload
    const projectName: string = data.projectName;
    const sourceEmail: string = data.sourceEmail;
    const sourceDisplayName: string = data.sourceDisplayName;
    const projectId: string = data.projectId;
    const targetUserId: string = data.targetUserId;
    const targetDisplayName: string = data.targetDisplayName;
    const targetEmail: string = data.targetEmail;
    const role: MemberRole = parseMemberRole(data.role);

    if (context.auth === undefined) {
        throw new Error('context.auth is undefined');
    }

    const sourceUserId: string = context.auth.uid;

    // Function.
    const projectInvite = new ProjectInviteModel(
        projectName,
        targetUserId,
        sourceUserId,
        sourceEmail,
        sourceDisplayName,
        projectId,
        role,
    );

    const inviteRef = admin.firestore().collection(Paths.users).doc(targetUserId).collection(Paths.invites).doc(projectId);
    try {
        await inviteRef.set({ ...projectInvite });
        const member = new MemberModel(
            targetUserId,
            targetDisplayName,
            targetEmail,
            MemberStatus.pending,
            role,
            []
        );

        const memberRef = admin.firestore().collection(Paths.projects).doc(projectId).collection(Paths.members).doc(targetUserId);

        try {
            await memberRef.set({ ...member });
            return {
                status: 'complete'
            }
        } catch (error) {
            return {
                status: 'error',
                message: 'Error while setting user into members: ' + error.message
            }
        }

    } catch (error) {
        return {
            status: 'error',
            error: error.message
        }
    }
})

export default sendProjectInvite;