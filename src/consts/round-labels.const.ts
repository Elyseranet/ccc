import { ROUND_KIND } from '../enums/round.enum.js'

/*********************************************************
 * Libellés des tours (A9)
 *
 * @description
 * Table ROUND_KIND -> clé i18n, partagée par l'édition, la fiche joueur, le tableau de bord et la file admin.
 * Le tour avant les huitièmes s'appelle « Barrages » (A9). `match` est la forme au singulier, pour désigner le tour
 * d'UN match (« Huitième de finale »).
 ********************************************************/
export const ROUND_LABELS: Record<ROUND_KIND, { key: string, label: string, match: { key: string, label: string } }> = {
  [ROUND_KIND.POOLS]: { key: 'round.pools', label: 'Poules', match: { key: 'round.match_pools', label: 'Poule' } },
  [ROUND_KIND.PLAYOFF]: { key: 'round.playoff', label: 'Barrages', match: { key: 'round.match_playoff', label: 'Barrage' } },
  [ROUND_KIND.ROUND_OF_16]: { key: 'round.round_of_16', label: 'Huitièmes', match: { key: 'round.match_round_of_sixteen', label: 'Huitième de finale' } },
  [ROUND_KIND.QUARTER]: { key: 'round.quarter', label: 'Quarts', match: { key: 'round.match_quarter', label: 'Quart de finale' } },
  [ROUND_KIND.SEMI]: { key: 'round.semi', label: 'Demi-finales', match: { key: 'round.match_semi', label: 'Demi-finale' } },
  [ROUND_KIND.FINAL]: { key: 'round.final', label: 'Finale', match: { key: 'round.match_final', label: 'Finale' } }
}
