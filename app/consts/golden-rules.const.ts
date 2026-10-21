import type { IGoldenRule } from '~/interfaces/common-components.interface'

/*********************************************************
 * Les huit règles d'or (RG25 à RG32)
 *
 * @description
 * Règles de jeu, pas de calcul (Spec fonctionnelle, « Les huit règles d'or »). Textes du bandeau repris des maquettes.
 ********************************************************/
export const GOLDEN_RULES: IGoldenRule[] = [
  { number: 25, key: 'golden_rules.rule_25', label: 'Les bières sont servies pleines et fraîches', detail: { key: 'golden_rules.rule_25_detail', fallback: 'Les bières sont servies pleines et fraîches.' } },
  { number: 26, key: 'golden_rules.rule_26', label: 'La partie débute par un shifumi', detail: { key: 'golden_rules.rule_26_detail', fallback: 'La partie débute par un shifumi ; un second shifumi départage le choix du côté si l’un des deux joueurs le demande.' } },
  { number: 27, key: 'golden_rules.rule_27', label: 'Poules en une bière, phase finale en deux', detail: { key: 'golden_rules.rule_27_detail', fallback: 'Poules en une bière, phase finale en deux.' } },
  { number: 28, key: 'golden_rules.rule_28', label: 'Le contre cap’s annule le point', detail: { key: 'golden_rules.rule_28_detail', fallback: 'Le contre cap’s annule le point.' } },
  { number: 29, key: 'golden_rules.rule_29', label: 'Le cap’s back ne compte pas', detail: { key: 'golden_rules.rule_29_detail', fallback: 'Le cap’s back ne compte pas.' } },
  { number: 30, key: 'golden_rules.rule_30', label: 'Le bûcheron ne compte pas', detail: { key: 'golden_rules.rule_30_detail', fallback: 'Le bûcheron ne compte pas.' } },
  { number: 31, key: 'golden_rules.rule_31', label: 'Le rebond est homologué', detail: { key: 'golden_rules.rule_31_detail', fallback: 'Le rebond est homologué.' } },
  { number: 32, key: 'golden_rules.rule_32', label: 'Fair-play : le gagnant finit sa bière', detail: { key: 'golden_rules.rule_32_detail', fallback: 'Fair-play : le gagnant finit sa bière.' } }
]
