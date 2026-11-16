/** Règle de validation d'un champ Origam : `true` si valide, sinon le message à afficher. */
export type TAccountRule = (value: string | null | undefined) => true | string
