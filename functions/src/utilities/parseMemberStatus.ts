function parseMemberStatus(status: String): MemberStatus {
    if (status === 'pending') {
        return MemberStatus.pending;
    }

    if (status === 'added') {
        return MemberStatus.added;
    }

    if (status === 'denied') {
        return MemberStatus.denied;
    }

    if (status === 'left') {
        return MemberStatus.left;
    }

    if (status === 'unjoined') {
        return MemberStatus.unjoined;
    }

    throw new Error('Failed to parse memberStatus. Provided value was ' + status || 'null or undefined');
}

export default parseMemberStatus;