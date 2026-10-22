import { ROUND_KIND } from '../enums/round.enum.js'

/*********************************************************
 * Libellés des tours (A9)
 *
 * @description
 * Table ROUND_KIND -> clé i18n, partagée par l'édition, la fiche joueur, le tableau de bord et la file admin.
 * Le tour avant les huitièmes s'appelle « Barrages » (A9).
 ********************************************************/
export const ROUND_LABELS: Record<ROUND_KIND, { key: string, label: string }> = {
  [ROUND_KIND.POOLS]: { key: 'round.pools', label: 'Poules' },
  [ROUND_KIND.PLAYOFF]: { key: 'round.playoff', label: 'Barrages' },
  [ROUND_KIND.ROUND_OF_16]: { key: 'round.round_of_16', label: 'Huitièmes' },
  [ROUND_KIND.QUARTER]: { key: 'round.quarter', label: 'Quarts' },
  [ROUND_KIND.SEMI]: { key: 'round.semi', label: 'Demi-finales' },
  [ROUND_KIND.FINAL]: { key: 'round.final', label: 'Finale' }
}
