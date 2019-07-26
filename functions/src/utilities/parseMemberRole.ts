function parseMemberRole(role: String): MemberRole {
    if (role == 'member') {
        return MemberRole.member;
    }

    if (role == 'owner') {
        return MemberRole.owner;
    }

    throw 'Failed to parse memberRole';
}

export default parseMemberRole;