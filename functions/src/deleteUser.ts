import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Paths from './types/FirestorePaths';
import MemberModel from './types/Member';
import parseMemberStatus from './utilities/parseMemberStatus';
import parseMemberRole from './utilities/parseMemberRole';
import MultiBatch from './MultiBatch';

const deleteUser = functions.auth.user().onDelete(async (user, context) => {
    const userId = user.uid;
    const email = user.email || '';
    const requests: Promise<void>[] = [];

    // Collect ProjectIds.
    const projectIdRefs = await getProjectIdRefs(userId);

    // Leave or Delete projects found in projectIdRefs.
    projectIdRefs.forEach(ref => requests.push(leaveOrDeleteProject(userId, ref.id)));

    // Delete the userDocument.
    requests.push(deleteUserDocument(userId, projectIdRefs));

    // Delete the directoryListing.
    requests.push(deleteDirectoryListing(userId, email));

    try {
        await Promise.all(requests);
        return;
    } catch (error) {
        throw error; // Let this fall through to StackDriver.
    }
});

async function deleteUserDocument(userId: string, projectIdRefs: FirebaseFirestore.DocumentReference[]) {
    const requests: Promise<FirebaseFirestore.QuerySnapshot>[] = [];
    const inviteRefs: FirebaseFirestore.DocumentReference[] = [];
    const accountConfigRefs: FirebaseFirestore.DocumentReference[] = [];

    // Collect the Invite Refs.
    requests.push(admin.firestore().collection(Paths.users)
        .doc(userId)
        .collection(Paths.invites)
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => inviteRefs.push(doc.ref));
            return snapshot; // Keeps Typescript happy.
        }));

    // Collect the Account Config.
    requests.push(admin.firestore().collection(Paths.users)
        .doc(userId)
        .collection(Paths.accountConfig)
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => accountConfigRefs.push(doc.ref))
            return snapshot;
        }));

    await Promise.all(requests);
    const batch = new MultiBatch(admin.firestore());

    inviteRefs.forEach(ref => batch.delete(ref));
    accountConfigRefs.forEach(ref => batch.delete(ref));
    projectIdRefs.forEach(ref => batch.delete(ref));

    try {
        await batch.commit();
        return;

    } catch {
        throw new Error('deleteUserDocument failed. User may have data remaining in the follow collections: ' +
            'invites, projectIds, accountConfig. userId = ' + userId);
    }
}

async function leaveOrDeleteProject(userId: string, projectId: string): Promise<void> {
    // Active members are defined as Members whos statuses are NOT 'left' or 'denied'.
    const activeMembers: MemberModel[] = await getActiveMembers(projectId);

    // Delete the project if user is the only remaining active member, otherwise just Leave the project.
    if (activeMembers.length === 1 && activeMembers[0].userId === userId) {
        try {
            await deleteProject(projectId);
            return;
        } catch {
            throw new Error('deleteProject failed. The following project may not have been deleted entirely. projectId = ' + projectId);
        }
    }

    else {
        try {
            await leaveProject(userId, projectId);
            return;
        } catch {
            throw new Error('leaveProject failed, unable to cleanly exit the following project. ' +
                'projectId = ' + projectId +
                'userId = ' + userId);
        }
    }
};

async function leaveProject(userId: string, projectId: string) {
    const batch = new MultiBatch(admin.firestore());

    const allMembers = await collectMembers(projectId);

    // Check if another user needs to be promoted to owner status and if so, select a user then add it to the batch to Promote them.
    if (isOtherUserPromotionRequired(userId, allMembers)) {
        const promotableUserId = selectPromotableMember(userId, allMembers);
        if (promotableUserId === '-1') {
            throw new Error('Failed leaving Project. selectPomotableMember returned an id of "-1". projectId = ' + projectId);
        }

        batch.update(admin.firestore().collection(Paths.projects).doc(projectId).collection(Paths.members).doc(promotableUserId), { "role": "owner" });
    }

    // Set member to status: left.
    batch.update(
        admin.firestore().collection(Paths.projects).doc(projectId).collection(Paths.members).doc(userId),
        { "status": "left" });

    // projectId and Invites will be deleted by another function.
    await batch.commit();
    return;
}

async function collectMembers(projectId: string): Promise<MemberModel[]> {
    const membersSnapshot = await admin.firestore().collection(Paths.projects).doc(projectId).collection(Paths.members).get();
    const allMembers: MemberModel[] = [];

    membersSnapshot.forEach(doc => allMembers.push(new MemberModel(
        doc.data()['userId'],
        doc.data()['displayName'],
        doc.data()['email'],
        parseMemberStatus(doc.data()['status']),
        parseMemberRole(doc.data()['role']),
        doc.data()['listCustomSortOrder']
    )));
    return allMembers;
}

function selectPromotableMember(userId: string, allMembers: MemberModel[]): string {
    const member = allMembers.find(item => item.userId !== userId && item.role !== MemberRole.owner && item.status === MemberStatus.added);

    if (member !== undefined) {
        return member.userId;
    }

    return '-1';
}

function isOtherUserPromotionRequired(userId: string, allMembers: MemberModel[]): boolean {
    // Query the provided collection for Members who aren't the Leaving Member, are an Owner, haven't left and haven't denied.
    const queriedMembers = allMembers.filter(item => item.userId !== userId &&
        item.role === MemberRole.owner &&
        item.status !== MemberStatus.left &&
        item.status !== MemberStatus.denied)

    if (queriedMembers.length > 0) {
        return false;
    }

    else {
        return true;
    }
}

async function deleteProject(projectId: string) {
    const requests: Promise<admin.firestore.QuerySnapshot>[] = [];
    const taskRefs: admin.firestore.DocumentReference[] = [];
    const taskListRefs: admin.firestore.DocumentReference[] = [];
    const memberRefs: admin.firestore.DocumentReference[] = [];

    // Collect task Doc Refs.
    requests.push(admin.firestore().collection(Paths.projects)
        .doc(projectId)
        .collection(Paths.tasks)
        .where('isComplete', '==', false)
        .get()
        .then((snapshot) => {
            snapshot.forEach(doc => taskRefs.push(doc.ref))
            return snapshot; // Keeps Typescript happy.
        }));

    // Collect taskList Doc Refs.
    requests.push(admin.firestore().collection(Paths.projects)
        .doc(projectId)
        .collection(Paths.taskLists)
        .get()
        .then((snapshot) => {
            snapshot.forEach(doc => taskListRefs.push(doc.ref));
            return snapshot; // Keeps Typescript happy.
        }));

    // Collect member Doc Refs.
    requests.push(admin.firestore().collection(Paths.projects)
        .doc(projectId)
        .collection(Paths.members)
        .get()
        .then((snapshot) => {
            snapshot.forEach(doc => memberRefs.push(doc.ref));
            return snapshot; // Keeps Typescript happy.
        }));

    // Wait for collection requests to fullfill.
    await Promise.all(requests);

    // Build a Batch.
    const batch = new MultiBatch(admin.firestore());

    // Delete everything.
    taskRefs.forEach(ref => batch.delete(ref));
    taskListRefs.forEach(ref => batch.delete(ref));
    memberRefs.forEach(ref => batch.delete(ref));

    await batch.commit();

}

async function getActiveMembers(projectId: string): Promise<MemberModel[]> {
    const membersSnapshot = await admin.firestore().collection(Paths.projects).doc(projectId).collection(Paths.members).get();
    const members: MemberModel[] = membersSnapshot.docs.map(doc => {
        const data = doc.data();
        return new MemberModel(
            data['userId'],
            data['displayName'],
            data['email'],
            parseMemberStatus(data['status']),
            parseMemberRole(data['role']),
            data['listCustomSortOrder']
        )
    });

    return members.filter(item => item.status !== MemberStatus.left && item.status !== MemberStatus.denied);
}

async function deleteDirectoryListing(userId: string, email: string): Promise<void> {
    try {
        await admin.firestore().collection(Paths.directory).doc(email).delete();
        return;
    } catch {
        throw new Error('Failure to delete directory listing. email = ' + email + '. userId = ' + userId);
    }
}

async function getProjectIdRefs(userId: string): Promise<FirebaseFirestore.DocumentReference[]> {
    const snapshot = await admin.firestore().collection(Paths.users).doc(userId).collection(Paths.projectIds).get();
    const projectRefs: FirebaseFirestore.DocumentReference[] = [];

    snapshot.forEach(doc => projectRefs.push(doc.ref));

    return projectRefs;
}

export default deleteUser;