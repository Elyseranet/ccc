import { useT } from '~/composables/useT'
import { LEGAL_IDENTITY_FIELDS } from '~/consts/runtime-config.const'
import { legalFieldValue } from '~/utils/legal-identity.util'

/*********************************************************
 * useLegalIdentity
 *
 * @description
 * Identité légale de l'éditeur (F-70), lue dans `runtimeConfig.public.legal` : un paramètre `{…}` par variable serveur Coolify,
 * prêt à passer à `t()`. Une valeur vide devient le libellé traduit « à compléter » (marqueur mis en évidence par `LegalText`) ;
 * en production, la garde de démarrage garantit qu'aucune ne l'est.
 ********************************************************/
export const useLegalIdentity = () => {
  const { t } = useT()
  const legal = useRuntimeConfig().public.legal
  const toComplete = t('legal.common.to_complete', '[À COMPLÉTER]')
  const params: Record<string, string> = Object.fromEntries(
    LEGAL_IDENTITY_FIELDS.map(field => [field.param, legalFieldValue(legal, field) || toComplete])
  )
  return { params }
}
