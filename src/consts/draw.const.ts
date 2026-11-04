/** Bornes de validation du tirage des poules (choix d'implémentation : la Spec ne fixe pas de plafond, RG16 va jusqu'à 70 participants). */
export const DRAW_POOL_COUNT_MAX = 20
export const DRAW_ASSIGNMENTS_MAX = 200

/** Relations nécessaires au DTO admin d'un tirage (`toAdminDraw`) : le tour, et l'auteur de la création et de la validation. */
export const ADMIN_DRAW_RELATIONS = { round: true, createdBy: { competitor: true }, validatedBy: { competitor: true } } as const

/** Relations d'une affectation pour son DTO : la participation avec son compétiteur, et la poule une fois créée. */
export const ASSIGNMENT_RELATIONS = { participation: { competitor: true }, pool: true } as const
