import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Paths from './types/FirestorePaths';
import ProjectIdModel from './types/ProjectId';
import MemberModel from './types/Member';

const linkAccountToProject = functions.https.onCall(async (data, context) => {
    if (context.auth === undefined) {
        return;
    }

    const userId = context.auth.uid;

    // Payload
    const linkingCode = data.linkingCode;
    const displayName = data.displayName;
    const email = data.email;

    // Pre Validate Linking Code
    if (preValidateLinkingCode(linkingCode) === false) {
        console.log('Prevalidation Failed');
        return {
            status: 'error',
            message: 'Invalid linking code'
        }
    }

    // Collect projectId from LinkingCode doc.
    const linkingCodeDoc: FirebaseFirestore.DocumentSnapshot = await fetchLinkingCodeDoc(linkingCode);

    if (linkingCodeDoc.exists === false || linkingCodeDoc.data() === undefined) {
        console.log("Could not locate LinkingcodeDoc");
        return {
            status: 'error',
            message: 'Could not locate linkingCodeDoc'
        }
    }

    const docData = linkingCodeDoc.data() || {}; // Keeps TS happy until the null coalescing operator is available.
    const projectId = docData.projectId;

    if (projectId === undefined || projectId === null) {
        console.log("Could not Locate ProjectId in linkingCodeDoc");
        return {
            status: 'error',
            message: 'Could not locate projectId in linkingCodeDoc'
        }
    }

    console.log('Linking Code validation Complete')

    // Validate Project.
    const isProjectValid = await validateProject(linkingCode, projectId);

    if (isProjectValid === false) {
        console.log("Project no Longer Exists, or Invite was revoked.");
        return {
            status: 'error',
            message: 'Project no longer exists, or user invite was revoked'
        }
    }

    console.log("Validation Complete");

    // Swap the members in the Project Members collection. Do this first so that security rules don't block project accesss once 
    // they receive the projectId into their own collection.
    const newMember = new MemberModel(
        userId,
        displayName,
        email,
        MemberStatus.added,
        MemberRole.member,
        [],
    )

    try {
        await swapMembers(newMember, linkingCode, projectId);
        console.log("Member Swap Complete");
    } catch (error) {
        return {
            status: 'error',
            message: 'An error occured whilst linking the user to the project'
        }
    }


    try {
        // Set projectIdModel into users projectId collection.
        await admin.firestore().collection(Paths.users).doc(userId).collection(Paths.projectIds).doc(projectId).set({ ...new ProjectIdModel(projectId) });

        console.log("ProjectId Set complete");

        // Once all that is complete. We can clear delete the LinkingCode doc thus expiring that linkingCode.
        await admin.firestore().collection(Paths.linkingCodes).doc(linkingCode).delete();
        console.log("linkingCode Doc Deleted");
        console.log('Overall Sucess');

        return {
            status: 'complete'
        }
    } catch (error) {
        return {
            status: 'error',
            message: 'An error occured whilst adding the projectId into the users projectId collection'
        }
    }

});

const swapMembers = async (incomingMemberModel: MemberModel, outgoingMemberId: string, projectId: string) => {
    const requests = [];

    requests.push(admin.firestore().collection(Paths.projects).doc(projectId).collection(Paths.members).doc(outgoingMemberId).delete());
    requests.push(admin.firestore().collection(Paths.projects).doc(projectId).collection(Paths.members).doc(incomingMemberModel.userId).set({ ...incomingMemberModel }));

    await Promise.all(requests);
}

const preValidateLinkingCode = (linkingCode: string): boolean => {
    if (linkingCode === null || linkingCode === undefined || linkingCode === '') {
        return false;
    }

    return true;
}

const fetchLinkingCodeDoc = async (linkingCode: string): Promise<FirebaseFirestore.DocumentSnapshot> => {
    try {
        const doc = await admin.firestore().collection(Paths.linkingCodes).doc(linkingCode).get();
        return doc;
    } catch (error) {
        throw error;
    }
}

const validateProject = async (linkingCode: string, projectId: string): Promise<boolean> => {
    let projectExists: boolean = false;
    let stillAMember: boolean = false;

    // Check that the project still exists.
    const projectSnapshot = await admin.firestore().collection(Paths.projects).doc(projectId).get();
    const data = projectSnapshot.data() || {};
    if (projectSnapshot.exists && (data.isDeleted === undefined || data.isDeleted === false)) {
        projectExists = true;
    }

    // Check that the invitation hasn't been revoked.
    const membersSnapshot = await admin.firestore().collection(Paths.projects).doc(projectId).collection(Paths.members).get();
    if (membersSnapshot.empty !== true) {
        const members: MemberModel[] = [];
        membersSnapshot.docs.forEach(doc => {
            if (doc.exists) {
                members.push(MemberModel.fromDoc(doc));
            }
        })

        if (members.findIndex(item => item.userId === linkingCode) !== -1) {
            stillAMember = true;
        }
    }

    return projectExists && stillAMember;
}

export default linkAccountToProject