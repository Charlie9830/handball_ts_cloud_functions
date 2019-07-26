import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import parseMemberRole from './utilities/parseMemberRole';

var sendProjectInvite = functions.https.onCall(async (data, context) => {
    // Payload
    var projectName: string = data.projectName;
    var sourceEmail: string = data.sourceEmail;
    var sourceDisplayName: string = data.sourceDisplayName;
    var projectId: string = data.projectId;
    var targetUserId: string = data.targetUserId;
    var targetDisplayName: string = data.targetDisplayName;
    var targetEmail: string = data.targetEmail;
    var role: MemberRole = parseMemberRole(data.role);

    if (context.auth == undefined) {
        throw 'context.auth is undefined';
    }

    var sourceUserId: string = context.auth.uid;

    // Function.
    var projectInvite = new ProjectInviteModel(
        projectName,
        targetUserId,
        sourceUserId,
        sourceEmail,
        sourceDisplayName,
        projectId,
        role,
    );

    var inviteRef = admin.firestore().collection(Paths.users).doc(targetUserId).collection(Paths.invites).doc(projectId);
    try {
        await inviteRef.set({ ...projectInvite });
        var member = new MemberModel(
            targetUserId,
            targetDisplayName,
            targetEmail,
            MemberStatus.pending,
            role,
            []
        );

        var memberRef = admin.firestore().collection(Paths.projects).doc(projectId).collection(Paths.members).doc(targetUserId);

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