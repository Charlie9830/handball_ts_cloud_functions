import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from '@google-cloud/firestore';

// TOOD: Look at the topic name, it is likely not working, you probably have to manually create a Subscription for Firebase Functions in the GCP console.
// It will ask for a destination URL. It gives you the URL when you deploy the functions.
var handlePlaySubcriptionUpdate = functions.pubsub.topic('playSubscriptionUpdate')
    .onPublish(async (message, context) => {
        var devNotif = new DeveloperNotification(message.toJSON());

        if (devNotif.testNotification != undefined) {
            console.log(`Received Test Notification - Payload.version: ${devNotif.testNotification.version}`);
            return;
        }

        var subNotif = devNotif.subscriptionNotification;
        var subNotifType = subNotif.notificationType;
        var purchaseToken = subNotif.purchaseToken;

        if (subNotifType == PlaySubscriptionNotificationType.SubscriptionCanceled ||
            subNotifType == PlaySubscriptionNotificationType.SubscriptionRevoked ||
            subNotifType == PlaySubscriptionNotificationType.SubscriptionExpired) {
            var snapshot = await admin.firestore().collection(Paths.users).where('playPurchaseId', '==', purchaseToken).get();
            if (snapshot.empty == false) {
                var userId = snapshot.docs[0].id;
                var cancelledReason = getPlayCancelledReason(subNotifType);

                if (userId === null || userId === undefined) {
                    return;
                }

                return admin.firestore().collection(Paths.users).doc(userId).update({
                    'purchaseId': FieldValue.delete(),
                    'productId': FieldValue.delete(),
                    'playCancelledReason': cancelledReason,
                })
            }
        }

        else if (subNotifType == PlaySubscriptionNotificationType.SubscriptionPurchased) {
            // We are handling this Client Side.
        }

        else if (subNotifType == PlaySubscriptionNotificationType.SubscriptionRenewed) {
            // Update subscription renewel date (If this isn't retreived from Google Play by the client anyway)
        }

        return;
    });

function getPlayCancelledReason(notifType: PlaySubscriptionNotificationType): String {
    if (notifType == PlaySubscriptionNotificationType.SubscriptionCanceled) {
        return 'cancelled';
    }

    if (notifType == PlaySubscriptionNotificationType.SubscriptionRevoked) {
        return 'revoked';
    }

    if (notifType == PlaySubscriptionNotificationType.SubscriptionExpired) {
        return 'expired';
    }

    return 'unknown';
}

export default handlePlaySubcriptionUpdate;