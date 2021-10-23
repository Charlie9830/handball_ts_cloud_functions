import DirectoryListing from "./DirectoryListing";

class DirectoryLookupResult {
    constructor(
        public userExists: boolean,
        public directoryListing: DirectoryListing) {
    }
}

export default DirectoryLookupResult;