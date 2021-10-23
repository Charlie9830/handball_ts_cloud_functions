class ActivityFeedEventModel {
    constructor(
        public uid: string,
        public originUserId: string,
        public projectId: string,
        public projectName: string,
        public title: string,
        public selfTitle: string,
        public details: string,
        public type: ActivityFeedEventType,
        public timestamp: Date,

    ) {}

    toMap(): any {
        return { 
            ...this,
            type: this.type.valueOf(),
            timestamp: FirebaseFirestore.Timestamp.fromDate(this.timestamp)
        }
    }
}

export default ActivityFeedEventModel;