class ProjectInviteModel {
    constructor(
        public projectName: string,
        public targetUserId: string,
        public sourceUserId: string,
        public sourceEmail: string, 
        public sourceDisplayName: string, 
        public projectId: string,
        public role: MemberRole) {}
}

export default ProjectInviteModel;