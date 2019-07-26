class SubscriptionNotification {
    version: string;
    notificationType: PlaySubscriptionNotificationType;
    purchaseToken: string;
    subscriptionId: string;

    constructor(json: any) {
        this.version = json['version'];
        this.notificationType = this.parseNotificationType(json['notificationType']);
        this.purchaseToken = json['purchaseToken'];
        this.subscriptionId = json['subscriptionId'];
    }
    
    parseNotificationType(notificationType: number) : PlaySubscriptionNotificationType {
        switch(notificationType) {
            case 1:
                return PlaySubscriptionNotificationType.SubscriptionRecovered;
            case 2: 
                return PlaySubscriptionNotificationType.SubscriptionRenewed;
            case 3:
                return PlaySubscriptionNotificationType.SubscriptionCanceled;
            case 4:
                return PlaySubscriptionNotificationType.SubscriptionPurchased;
            case 5:
                return PlaySubscriptionNotificationType.SubscriptionOnHold;
            case 6:
                return PlaySubscriptionNotificationType.SubscriptionInGracePeriod;
            case 7:
                return PlaySubscriptionNotificationType.SubscriptionRestarted;
            case 8:
                return PlaySubscriptionNotificationType.SubscriptionPriceChangeConfirmed;
            case 9:
                return PlaySubscriptionNotificationType.SubscriptionDeffered;
            case 12:
                return PlaySubscriptionNotificationType.SubscriptionRevoked;
            case 13:
                return PlaySubscriptionNotificationType.SubscriptionExpired;
            default:
                return PlaySubscriptionNotificationType.Unknown;
        }
    }
}