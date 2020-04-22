import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import LinkingCode from './types/LinkingCode';
import Paths from './types/FirestorePaths';
import MemberModel from './types/Member';
//import * as needle from 'needle';

const sendAppAndProjectInvite = functions.https.onCall(async (data, context) => {
    if (context.auth === undefined) {
        return {
            status: 'error',
            message: 'User not authorised'
        }
    }

    // Payload
    const projectName: string = data.projectName;
    const projectId: string = data.projectId;
    const sourceDisplayName: string = data.sourceDisplayName;
    const targetEmail: string = data.targetEmail;


    // Linking Code.
    const linkingCode = generateLinkingCode();
    const dynamicLink = generateDynamicLink(linkingCode);

    console.log("Linking Code and Long Dynamic Link Created");
    

    // Dependencies.
    const pug = require('pug');
    const nodemailer = require('nodemailer');

    const pugTemplate = pug.compileFile('./lib/email_templates/InviteToApp.pug', { filename: 'InviteToApp.pug' });
    const html = pugTemplate({
        projectName: projectName,
        sourceDisplayName: sourceDisplayName,
        dynamicLink: dynamicLink,
    });

    console.log('Pug file Compiled');

    const transporter = nodemailer.createTransport({
        host: "smtp.office365.com",
        port: 587,
        secure: false,
        auth: {
            user: functions.config().nodemailer.username,
            pass: functions.config().nodemailer.pass
        }
    });

    console.log("Transport Created");

    try {
        const requests = [];

        requests.push(storeLinkingCode(linkingCode, projectId, projectName));
        requests.push(transporter.sendMail({
            from: '"Handball" <noreply@handballapp.io',
            to: targetEmail,
            subject: `Invite to join ${sourceDisplayName} on Handball`,
            html: html
        }))

        requests.push(setMemberDoc(linkingCode, projectId, targetEmail));

        console.log('Requests batched');

        await Promise.all(requests);

        console.log('Requests Resolved Succesfully');

        return {
            status: 'success'
        };

    } catch (error) {
        console.log("Requests returned an Error");
        console.log(error);
        console.log(error.message);
        return {
            status: 'error',
            message: error.message,
        };
    }
})

// const getShortLink = async (longLink: string): Promise<string> => {
//     const data = {
//         "longDynamicLink": longLink,
//     }

//     needle.post('https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=' + admin.credential.applicationDefault(), data).on('done', (err, resp) => {
//         if (err) {
//             console.log('Error occured');
//             console.log(err);
//             throw new Error('Failed');
//         } else {
//             console.log(resp);
//             return resp;
//         }
//     });
// } 

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

const setMemberDoc = async (linkingCode: string, projectId: string, email: string) => {
    const member = new MemberModel(
        linkingCode,
        email,
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
        return admin.firestore().collection(Paths.linkingCodes).doc(code).set({ ...linkingCode });
    }

    catch (error) {
        throw error;
    }
}



export default sendAppAndProjectInvite;