import * as functions from 'firebase-functions';

const sendAppAndProjectInvite = functions.https.onCall(async (data, context) => {
    // if (context.auth === undefined) {
    //     throw new Error('context.auth is undefined');
    // }

    // Payload
    const projectName: string = data.projectName;
    const sourceDisplayName: string = data.sourceDisplayName;
    const targetEmail: string = data.targetEmail;

    // Dependencies.
    const pug = require('pug');
    const nodemailer = require('nodemailer');

    const pugTemplate = pug.compileFile('./lib/email_templates/InviteToApp.pug', {filename: 'InviteToApp.pug'});
    const html = pugTemplate({
        projectName: projectName,
        sourceDisplayName: sourceDisplayName,
    });

    const transporter = nodemailer.createTransport({
        host: "smtp.office365.com",
        port: 587,
        secure: false,
        auth: {
            user: functions.config().nodemailer.username,
            pass: functions.config().nodemailer.pass
        }
    });

    try {
        await transporter.sendMail({
            from: '"Handball" <noreply@handballapp.io',
            to: targetEmail,
            subject: `Invite to join ${sourceDisplayName} on Handball`,
            html: html
        })

        return {
            status: 'success'
        };

    } catch(error) {
        return {
            status: 'error',
            message: error.message,
        };
    }
})

export default sendAppAndProjectInvite;