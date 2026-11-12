/** Abréviations reconnues dans un texte affiché : « ACP » et les codes de règle de gestion « RG19 » (la capture garde le séparateur pour `split`). */
export const ABBREVIATION_TOKEN = /\b(ACP|RG\d+)\b/

/** Un code de règle de gestion seul : « RG19 » (le numéro est capturé). */
export const ABBREVIATION_RULE_CODE = /^RG(\d+)$/
