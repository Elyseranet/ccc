import type { IGoldenRule } from '~/interfaces/common-components.interface'

/*********************************************************
 * Les huit règles d'or (RG25 à RG32)
 *
 * @description
 * Règles de jeu, pas de calcul (Spec fonctionnelle, « Les huit règles d'or »). Textes du bandeau repris des maquettes.
 ********************************************************/
export const GOLDEN_RULES: IGoldenRule[] = [
  { number: 25, key: 'golden_rules.rule_25', label: 'Les bières sont servies pleines et fraîches' },
  { number: 26, key: 'golden_rules.rule_26', label: 'La partie débute par un shifumi' },
  { number: 27, key: 'golden_rules.rule_27', label: 'Poules en une bière, phase finale en deux' },
  { number: 28, key: 'golden_rules.rule_28', label: 'Le contre cap’s annule le point' },
  { number: 29, key: 'golden_rules.rule_29', label: 'Le cap’s back ne compte pas' },
  { number: 30, key: 'golden_rules.rule_30', label: 'Le bûcheron ne compte pas' },
  { number: 31, key: 'golden_rules.rule_31', label: 'Le rebond est homologué' },
  { number: 32, key: 'golden_rules.rule_32', label: 'Fair-play : le gagnant finit sa bière' }
]
