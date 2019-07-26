declare module 'firestore-multibatch' {
    export class MultiBatch {
        constructor(firestore: FirebaseFirestore.Firestore);
        commit(): Promise<void>;
        delete(documentRef: FirebaseFirestore.DocumentReference): FirebaseFirestore.WriteBatch;
        set(documentRef: FirebaseFirestore.DocumentReference, data: FirebaseFirestore.DocumentData, options?: FirebaseFirestore.SetOptions): FirebaseFirestore.WriteBatch;
        update(documentRef: FirebaseFirestore.DocumentReference, data: FirebaseFirestore.UpdateData): FirebaseFirestore.WriteBatch;
    }

    export default MultiBatch;
}
