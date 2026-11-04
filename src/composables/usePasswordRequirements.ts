import { computed } from 'vue'
import { useT } from '~/composables/useT'
import { PASSWORD_MIN_LENGTH } from '~/consts/auth.const'
import type { IPasswordRequirementRule } from '~/interfaces/account.interface'

/*********************************************************
 * usePasswordRequirements
 *
 * @description
 * La liste d'exigences affichée sous un champ de mot de passe (`requirement-rules` d'`origam-password-field`, présentée en liste
 * sous le champ). Une seule exigence : 15 caractères au moins (B-08, OWASP sans MFA), sans règle de composition. Les exigences
 * par défaut d'Origam (majuscule, chiffre, caractère spécial) ne sont pas les nôtres : elles ne doivent jamais s'afficher.
 ********************************************************/
export const usePasswordRequirements = () => {
  const { t } = useT()
  return computed((): IPasswordRequirementRule[] => [
    {
      id: 'min-length',
      label: t('account.password.requirement_min_length', 'Au moins {count} caractères', { count: PASSWORD_MIN_LENGTH }),
      test: value => value.length >= PASSWORD_MIN_LENGTH
    }
  ])
}
