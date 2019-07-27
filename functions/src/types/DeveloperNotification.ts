import SubscriptionNotification from "./SubscriptionNotification";
import TestNotification from "./TestNotification";

class DeveloperNotification {
    version: string;
    packageName: string;
    eventTimeMillis: number;
    subscriptionNotification: SubscriptionNotification;
    testNotification: TestNotification;

    constructor(json: any) {
        this.version = json['version'];
        this.packageName = json['packageName'];
        this.eventTimeMillis = json['eventTimeMillis'];
        this.subscriptionNotification = new SubscriptionNotification(json['subscriptionNotification']);
        this.testNotification = new TestNotification(json['testNotification'])
    }
}

export default DeveloperNotification;