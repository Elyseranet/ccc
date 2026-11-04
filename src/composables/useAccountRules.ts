import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '~/consts/auth.const'
import { ACCOUNT_EMAIL_PATTERN } from '~/consts/account.const'
import { useT } from '~/composables/useT'
import type { TAccountRule } from '~/types/account.type'

/*********************************************************
 * useAccountRules
 *
 * @description
 * Règles de validation des formulaires du compte, au format des `rules` d'Origam (`true` ou le message). Le mot de passe suit
 * le serveur (B-08) : 15 caractères au moins (OWASP, sans MFA), 128 au plus ; le serveur reste l'autorité. Un champ vide n'est
 * refusé que s'il est obligatoire, pour que le mot de passe facultatif du profil puisse rester vide.
 ********************************************************/
export const useAccountRules = () => {
  const { t } = useT()
  const isEmpty = (value: string | null | undefined): boolean => !value || value.trim() === ''

  const required: TAccountRule = value => !isEmpty(value) || t('account.rule.required', 'Ce champ est obligatoire.')

  const email: TAccountRule = value => isEmpty(value) || ACCOUNT_EMAIL_PATTERN.test(value!.trim()) || t('account.rule.email', 'Saisissez une adresse email valide.')

  const passwordLength: TAccountRule = (value) => {
    if (isEmpty(value)) {
      return true
    }
    if (value!.length < PASSWORD_MIN_LENGTH) {
      return t('account.rule.password_min', 'Le mot de passe doit contenir au moins {count} caractères.', { count: PASSWORD_MIN_LENGTH })
    }
    return value!.length <= PASSWORD_MAX_LENGTH || t('account.rule.password_max', 'Le mot de passe ne peut pas dépasser {count} caractères.', { count: PASSWORD_MAX_LENGTH })
  }

  const sameAs = (other: () => string | null | undefined): TAccountRule =>
    value => (value ?? '') === (other() ?? '') || t('account.rule.password_mismatch', 'Les deux mots de passe sont différents.')

  const requiredWhen = (condition: () => boolean, message: () => string): TAccountRule =>
    value => !condition() || !isEmpty(value) || message()

  const currentPasswordRequired = (newPassword: () => string | null | undefined): TAccountRule =>
    requiredWhen(() => !isEmpty(newPassword()), () => t('account.rule.current_required', 'Saisissez votre mot de passe actuel pour en choisir un nouveau.'))

  return { required, email, passwordLength, sameAs, currentPasswordRequired }
}
