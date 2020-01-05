class MultiBatch {
    private currentEntryCount: number = 0;
    private currentBatchIndex: number = 0;
    private batches: FirebaseFirestore.WriteBatch[] = [];


    constructor(private firestore: FirebaseFirestore.Firestore) {

        if (firestore === undefined || firestore === null) {
            throw Error('An instance of Firestore must be provided to the MultiBatch constructor');
        }

        this.batches.push(this.firestore.batch());
    }

    create(documentRef: FirebaseFirestore.DocumentReference, data: FirebaseFirestore.DocumentData): FirebaseFirestore.WriteBatch {
        if (this.isBatchFull()) {
            this.createNewBatch();
        }

        this.currentEntryCount++;

        return this.batches[this.currentBatchIndex].create(documentRef, data);
    }

    delete(documentRef: FirebaseFirestore.DocumentReference, precondition?: FirebaseFirestore.Precondition): FirebaseFirestore.WriteBatch {
        if (this.isBatchFull()) {
            this.createNewBatch();
        }

        this.currentEntryCount++;

        if (precondition !== undefined) {
            return this.batches[this.currentBatchIndex].delete(documentRef, precondition);
        }

        else {
            return this.batches[this.currentBatchIndex].delete(documentRef);
        }


    }

    set(documentRef: FirebaseFirestore.DocumentReference, data: FirebaseFirestore.DocumentData, options?: FirebaseFirestore.SetOptions): FirebaseFirestore.WriteBatch {
        if (this.isBatchFull()) {
            this.createNewBatch();
        }

        this.currentEntryCount++;

        return this.batches[this.currentBatchIndex].set(documentRef, data, options);
    }

    update(documentRef: FirebaseFirestore.DocumentReference, data: FirebaseFirestore.UpdateData, precondition?: FirebaseFirestore.Precondition): FirebaseFirestore.WriteBatch {
        if (this.isBatchFull()) {
            this.createNewBatch();
        }

        this.currentEntryCount++;

        if (precondition !== undefined) {
            return this.batches[this.currentBatchIndex].update(documentRef, data, precondition);
        }

        else {
            return this.batches[this.currentBatchIndex].update(documentRef, data);
        }

    }

    async commit(): Promise<void> {
        const requests: Promise<FirebaseFirestore.WriteResult[]>[] = [];
        this.batches.forEach(item => {
            requests.push(item.commit());
        })

        try {
            await Promise.all(requests);
            return;
        } catch (error) {
            throw error;
        }
    }

    private createNewBatch() {
        const newIndex = this.batches.push(this.firestore.batch()) - 1;
        this.currentBatchIndex = newIndex;
        this.currentEntryCount = 0;
    }

    private isBatchFull() {
        return this.currentEntryCount >= 500;
    }
}

export default MultiBatch;