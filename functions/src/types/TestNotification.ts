class TestNotification {
    version: string;

    constructor(json: any) {
        this.version = json['version'];
    }
}

export default TestNotification;