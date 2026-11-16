/** Forme canonique d'un email : sans espaces autour, en minuscules. */
export const normalizeEmail = (email: string): string => email.trim().toLowerCase()
