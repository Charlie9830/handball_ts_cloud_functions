import * as functions from 'firebase-functions';
const stripe = require('stripe')(require('../private/keys').stripeSecretKey);
import * as admin from 'firebase-admin';

const upgradeToPro = functions.https.onCall(async (data, context) => {
    const ccToken: string = data.token;
    const userId: string = context.auth !== undefined ? context.auth.uid : '';
    const email: string = context.auth !== undefined ? context.auth.token.name : '';

    const customer = await stripe.customers.create({
        email: email,
        source: ccToken,
    });

    const ref = admin.firestore().collection('users').doc(userId);
    await ref.update({'stripeId': customer.id})

    return stripe.subscriptions.create({
        customer: customer.id,
        items: [{plan: require('../private/planIds').oneYearPlanId}]
    })
})

export default upgradeToPro;