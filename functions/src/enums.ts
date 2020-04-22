const enum PlaySubscriptionNotificationType {
    Unknown = 0,
    SubscriptionRecovered = 1,
    SubscriptionRenewed = 2,
    SubscriptionCanceled = 3,
    SubscriptionPurchased = 4,
    SubscriptionOnHold = 5,
    SubscriptionInGracePeriod = 6,
    SubscriptionRestarted = 7,
    SubscriptionPriceChangeConfirmed = 8,
    SubscriptionDeffered = 9,
    SubscriptionRevoked = 12,
    SubscriptionExpired = 13
}

const enum MemberRole {
    member = 'member',
    owner = 'owner',
}

const enum MemberStatus {
    pending = 'pending',
    added = 'added',
    denied = 'denied',
    left = 'left',
    unjoined = 'unjoined',
}

const enum DynamicLinkType {
    invalid = "invalid",
    projectInvite = "projectInvite"
}