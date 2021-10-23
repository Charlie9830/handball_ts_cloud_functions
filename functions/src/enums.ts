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

// Serialized by Index. Don't screw around with it.
// Ensure changes here are propagated to Client side enum.
const enum ActivityFeedEventType {
    addTask,
    deleteTask,
    completeTask,
    editTask,
    moveTask,
    unCompleteTask,
    commentOnTask, // Not implemented. Has the potentional to greatly increase the ammount of Database Writes and Reads.
    prioritizeTask,
    unPrioritizeTask,
    changeDueDate,
    addDetails,
    addList,
    moveList,
    deleteList,
    renameList,
    addMember,
    removeMember, // Not implemented. Not sure how I feel about a user being removed from the Project being gazzeted in the Activity Feed.
    addProject,
    renameProject,
    renewChecklist,
    assignmentUpdate,
    reColorList,
}