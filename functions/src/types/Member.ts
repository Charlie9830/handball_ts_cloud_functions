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
}
