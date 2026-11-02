import { computed } from 'vue'
import type { Ref } from 'vue'
import { ACCOUNT_ERROR_MESSAGES } from '~/consts/account.const'
import { useT } from '~/composables/useT'
import type { ACCOUNT_ERROR } from '~/enums/account.enum'

/*********************************************************
 * useAccountError
 *
 * @description
 * La phrase traduite d'une cause d'échec du compte, ou `null` quand il n'y en a pas.
 ********************************************************/
export const useAccountError = (error: Ref<ACCOUNT_ERROR | null | undefined>) => {
  const { t } = useT()
  return computed((): string | null => {
    if (!error.value) {
      return null
    }
    const message = ACCOUNT_ERROR_MESSAGES[error.value]
    return t(message.key, message.label)
  })
}
