import { computed, onBeforeUnmount, ref } from 'vue'
import { useAuthStore } from '~/composables/useAuthStore'
import { useAvatarUpload } from '~/composables/useAvatarUpload'
import { INVITATION_STATE_KEY } from '~/consts/auth-session.const'
import { ROUTES } from '~/consts/routes.const'
import { ACCOUNT_ERROR, INVITATION_STATE } from '~/enums/account.enum'
import type { IAcceptInvitationRequest } from '~/interfaces/invitation.interface'
import type { IInvitationLoaderState } from '~/interfaces/account.interface'
import { AuthService } from '~/services/auth.service'
import { toAccountError } from '~/utils/account-error.util'

/*********************************************************
 * useInvitation
 *
 * @description
 * Première connexion par invitation (B-09, A14). Le lien est vérifié avant d'afficher le formulaire : `GET /auth/invitation/{jeton}`
 * renvoie de quoi pré-remplir, 410 si le lien est expiré ou consommé, 404 s'il est inconnu. L'activation (`POST`) fixe le mot
 * de passe, consomme le jeton et ouvre la session ; l'avatar part ensuite par `PUT /moi/avatar`, car l'invitation ne le porte
 * pas. La clé du `useAsyncData` est fixe, jamais construite avec le jeton : il ne se retrouve ni dans les clés ni dans le payload ; le cache est vidé
 * en quittant la page, et la navigation vers le profil remplace l'entrée d'historique (pas de retour vers un lien consommé). Si l'avatar échoue, le compte est déjà actif et le jeton consommé : on reste sur la page, qui l'explique et mène au
 * profil, au lieu de laisser croire que l'activation a échoué.
 ********************************************************/
export const useInvitation = async (token: string) => {
  const auth = useAuthStore()
  const service = new AuthService({ fetcher: useRequestFetch() })
  const avatar = useAvatarUpload()
  const pending = ref(false)
  const error = ref<ACCOUNT_ERROR | null>(null)
  const activated = ref(false)

  const loaded = await useAsyncData(INVITATION_STATE_KEY, async (): Promise<IInvitationLoaderState> => {
    try {
      return { state: INVITATION_STATE.READY, preview: await service.previewInvitation(token) }
    } catch (cause) {
      const reason = toAccountError(cause)
      const state = reason === ACCOUNT_ERROR.LINK_GONE
        ? INVITATION_STATE.GONE
        : reason === ACCOUNT_ERROR.LINK_UNKNOWN ? INVITATION_STATE.UNKNOWN : INVITATION_STATE.FAILED
      return { state, preview: null }
    }
  })

  const state = computed((): INVITATION_STATE => {
    if (error.value === ACCOUNT_ERROR.LINK_GONE) {
      return INVITATION_STATE.GONE
    }
    if (error.value === ACCOUNT_ERROR.LINK_UNKNOWN) {
      return INVITATION_STATE.UNKNOWN
    }
    return loaded.data.value?.state ?? INVITATION_STATE.FAILED
  })
  const preview = computed(() => loaded.data.value?.preview ?? null)

  const activate = async (values: { password: string, phone: string | null, avatar: File | null }) => {
    pending.value = true
    error.value = null
    const body: IAcceptInvitationRequest = { password: values.password, ...(values.phone ? { phone: values.phone } : {}) }
    try {
      auth.setMe(await service.acceptInvitation(token, body))
    } catch (cause) {
      error.value = toAccountError(cause)
      pending.value = false
      return
    }
    activated.value = true
    if (values.avatar && !(await avatar.upload(values.avatar))) {
      pending.value = false
      return
    }
    pending.value = false
    await navigateTo(ROUTES.PROFILE, { replace: true })
  }

  onBeforeUnmount(() => clearNuxtData(INVITATION_STATE_KEY))

  const retry = () => loaded.refresh()

  return { state, preview, pending, error, activated, avatarError: avatar.error, activate, retry }
}
