import * as functions from 'firebase-functions';
const stripe = require('stripe')(require('../private/keys').stripeSecretKey);
import * as admin from 'firebase-admin';

var upgradeToPro = functions.https.onCall(async (data, context) => {
    let ccToken: string = data.token;
    let userId: string = context.auth !== undefined ? context.auth.uid : '';
    let email: string = context.auth !== undefined ? context.auth.token.name : '';

    const customer = await stripe.customers.create({
        email: email,
        source: ccToken,
    });

    var ref = admin.firestore().collection('users').doc(userId);
    await ref.update({'stripeId': customer.id})

    return stripe.subscriptions.create({
        customer: customer.id,
        items: [{plan: require('../private/planIds').oneYearPlanId}]
    })
})

export default upgradeToPro;