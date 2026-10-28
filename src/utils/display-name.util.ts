/** Forme « Prénom Nom », celle de toutes les entrées de l'archive. */
export const buildDisplayName = (firstName: string, lastName: string): string => `${firstName.trim()} ${lastName.trim()}`.trim()
