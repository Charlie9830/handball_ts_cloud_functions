const extractTempDisplayName = (email: string): string => {
    const atIndex = email.indexOf('@');
    return email.substring(0, atIndex);
}

export default extractTempDisplayName;