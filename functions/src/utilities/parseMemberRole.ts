function parseMemberRole(role: String): MemberRole {
    if (role === 'member') {
        return MemberRole.member;
    }

    if (role === 'owner') {
        return MemberRole.owner;
    }

    throw new Error('Failed to parse memberRole');
}

export default parseMemberRole;