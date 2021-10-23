class DirectoryListing {
    constructor(
        public userId: string,
        public displayName: string, 
        public email: string,) {
    }

    static fromDoc(doc: FirebaseFirestore.DocumentSnapshot): DirectoryListing {
        const data = doc.data() || {}; // Keeps TS Happy until we have optional chaining.
        return new DirectoryListing(
            data['userId'],
            data['displayName'],
            data['email']
        )
    }
}

export default DirectoryListing;