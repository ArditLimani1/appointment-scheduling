export function resolveClientIdentifierType(storedType, whatsappEnabled) {
    if (!whatsappEnabled) {
        return 'email';
    }

    return storedType === 'email' ? 'email' : 'phone';
}
