import parseMemberStatus from "../utilities/parseMemberStatus";
import parseMemberRole from "../utilities/parseMemberRole";

class MemberModel {
    constructor(
        public userId: string,
        public displayName: string, 
        public email: string, 
        public status: MemberStatus,
        public role: MemberRole,
        public listCustomSortOrder: string[]) {
            this.listCustomSortOrder = listCustomSortOrder || [];
    }

    static fromDoc(doc: FirebaseFirestore.DocumentSnapshot):MemberModel {
        const data = doc.data() || {};
        return new MemberModel(
            doc.id,
            data['displayName'],
            data['email'],
            parseMemberStatus(data['status']),
            parseMemberRole(data['role']),
            data.listCustomSortOrder,
        )
    }
}

export default MemberModel;