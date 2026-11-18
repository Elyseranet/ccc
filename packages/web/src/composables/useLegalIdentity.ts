import { useT } from '~/composables/useT'
import { legalParams } from '~/utils/legal-identity.util'

/*********************************************************
 * useLegalIdentity
 *
 * @description
 * Identité légale de l'éditeur (F-70), lue dans `runtimeConfig.public.legal` : un paramètre `{…}` par variable serveur Coolify,
 * prêt à passer à `t()`. Une valeur obligatoire vide (ou `A_COMPLETER`) devient le libellé traduit « à compléter » (marqueur mis
 * en évidence par `LegalText`) ; en production, la garde de démarrage garantit qu'aucune ne l'est. Forme, capital, SIREN, RCS et
 * TVA sont facultatifs : vides, leur paramètre est vide et la ligne qui les porte est masquée (`useLegalPage`).
 * `registry` regroupe ceux de SIREN, RCS et TVA qui sont renseignés.
 ********************************************************/
export const useLegalIdentity = () => {
  const { t } = useT()
  const params = legalParams(useRuntimeConfig().public.legal, t('legal.common.to_complete', '[À COMPLÉTER]'))
  const registry = [
    params.siren ? t('legal.notice.registry_siren', 'SIREN {value}', { value: params.siren }) : '',
    params.rcs ? t('legal.notice.registry_rcs', 'RCS {value}', { value: params.rcs }) : '',
    params.vat ? t('legal.notice.registry_vat', 'TVA {value}', { value: params.vat }) : ''
  ].filter(part => part !== '').join(' · ')
  const all: Record<string, string> = { ...params, registry }
  return { params: all }
}
