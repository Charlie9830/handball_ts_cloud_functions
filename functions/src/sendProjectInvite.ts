import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Paths from './types/FirestorePaths';
import ProjectInviteModel from './types/ProjectInvite';
import MemberModel from './types/Member';
import LinkingCode from './types/LinkingCode';
import getUserFromDirectory from './utilities/getUserFromDirectory';
import extractTempDisplayName from './utilities/extractTempDisplayName';

// Config Values
const nodeMailerTransportConfig = {
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    auth: {
        user: functions.config().nodemailer.username,
        pass: functions.config().nodemailer.pass
    }
};

const originEmailAddress = '"Handball" <noreply@handballapp.io>';


// Function.
const sendProjectInvite = functions.https.onCall(async (data, context) => {
    // Payload
    const projectName: string = data.projectName;
    const sourceEmail: string = data.sourceEmail;
    const sourceDisplayName: string = data.sourceDisplayName;
    const projectId: string = data.projectId;
    const targetEmail: string = data.targetEmail;

    if (context.auth === undefined) {
        return {
            status: 'error',
            message: 'Unauthorised'
        }
    }

    const sourceUserId: string = context.auth.uid;

    const targetUserListing = await getUserFromDirectory(targetEmail);
    if (targetUserListing.userExists) {
        const directoryListing = targetUserListing.directoryListing;
        try {
            await sendJoinedUserProjectInvite(
                projectName,
                sourceUserId,
                sourceEmail,
                sourceDisplayName,
                projectId,
                directoryListing.userId,
                directoryListing.displayName,
                targetEmail
            )

            return {
                status: 'complete',
                displayName: directoryListing.displayName
            }

        } catch (error) {
            return {
                status: 'error',
                message: 'An error occured whilst inviting the user.'
            }
        }
    }

    else {
        try {
            const tempDisplayName = extractTempDisplayName(targetEmail);

            await sendUnjoinedUserProjectInvite(
                projectName,
                projectId,
                sourceDisplayName,
                targetEmail,
                tempDisplayName
            );

            return {
                status: 'complete',
                displayName: tempDisplayName,
            }
        } catch (error) {
            return {
                status: 'error',
                message: 'An error occured whilst inviting the user.'
            }
        }
    }
})

const sendJoinedUserProjectInvite = async (
    projectName: string,
    sourceUserId: string,
    sourceEmail: string,
    sourceDisplayName: string,
    projectId: string,
    targetUserId: string,
    targetDisplayName: string,
    targetEmail: string): Promise<void> => {

    // Send the notification Email. We send this first so that this request resolves to the Client at the same time that the Members collection is modified.
    // In future it will be worth looking at triggering another function to send the email so the user isn't kept waiting for it.
    // Dependencies.
    const pug = require('pug');
    const nodemailer = require('nodemailer');

    const pugTemplate = pug.compileFile('./lib/email_templates/InviteToProject.pug', { filename: 'InviteToProject.pug' });
    const html = pugTemplate({
        projectName: projectName,
        sourceDisplayName: sourceDisplayName,
    });

    const transporter = nodemailer.createTransport(nodeMailerTransportConfig);

    await transporter.sendMail({
        from: originEmailAddress,
        to: targetEmail,
        subject: `Invite to join ${sourceDisplayName} on Handball`,
        html: html
    });

    const batch = admin.firestore().batch();
    const role = MemberRole.member;

    // Project Invite Doc.
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
    batch.set(inviteRef, { ...projectInvite });

    // Member Doc.
    const member = new MemberModel(
        targetUserId,
        targetDisplayName,
        targetEmail,
        MemberStatus.pending,
        role,
        []
    );
    const memberRef = admin.firestore().collection(Paths.projects).doc(projectId).collection(Paths.members).doc(targetUserId);
    batch.set(memberRef, { ...member });

    await batch.commit();

    return;

}

const sendUnjoinedUserProjectInvite = async (projectName: string, projectId: string, sourceDisplayName: string, targetEmail: string, tempDisplayName: string) => {
    // Linking Code.
    const linkingCode = generateLinkingCode();
    const dynamicLink = generateDynamicLink(linkingCode);

    // Dependencies.
    const pug = require('pug');
    const nodemailer = require('nodemailer');

    const pugTemplate = pug.compileFile('./lib/email_templates/InviteToApp.pug', { filename: 'InviteToApp.pug' });
    const html = pugTemplate({
        projectName: projectName,
        sourceDisplayName: sourceDisplayName,
        dynamicLink: dynamicLink,
    });

    // Send the email first and await it's result. This means that the Client will see the new Memebr appear at the same time that this request resolves.
    const transporter = nodemailer.createTransport(nodeMailerTransportConfig);
    await transporter.sendMail({
        from: originEmailAddress,
        to: targetEmail,
        subject: `Invite to join ${sourceDisplayName} on Handball`,
        html: html
    });

    // Set LinkingCode doc and MemberDoc.
    const requests = [];
    requests.push(storeLinkingCode(linkingCode, projectId, projectName));
    requests.push(setMemberDoc(linkingCode, projectId, targetEmail, tempDisplayName));

    await Promise.all(requests);
    return;
}

const generateDynamicLink = (linkingCode: string): string => {
    const buildUrl = require('build-url');
    const linksConfig = require('./dynamic_links_config/config.json');

    const payloadLink = buildUrl(linksConfig.link, {
        queryParams: {
            linkingCode: linkingCode,
            type: DynamicLinkType.projectInvite.toString(),
        }
    });

    return buildUrl(linksConfig.subdomain, {
        queryParams: {
            link: payloadLink,
            ofl: linksConfig.ofl,
            apn: linksConfig.apn,
            amv: linksConfig.amv,
        }
    });
}

const generateLinkingCode = (): string => {
    return admin.firestore().collection(Paths.linkingCodes).doc().id;
};

const setMemberDoc = async (linkingCode: string, projectId: string, email: string, tempDisplayName: string) => {
    const member = new MemberModel(
        linkingCode,
        tempDisplayName,
        email,
        MemberStatus.unjoined,
        MemberRole.member,
        [],
    )

    try {
        await admin.firestore().collection(Paths.projects).doc(projectId).collection(Paths.members).doc(linkingCode).set({ ...member });
        return;
    } catch (error) {
        throw error;
    }
}

const storeLinkingCode = async (code: string, projectId: string, projectName: string) => {
    const linkingCode = new LinkingCode(
        code,
        projectName,
        projectId,
        new Date(),
    );

    try {
        await admin.firestore().collection(Paths.linkingCodes).doc(code).set({ ...linkingCode });
        return;
    }

    catch (error) {
        throw error;
    }
}

export default sendProjectInvite;