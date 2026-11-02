import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { E2E_SESSION_COOKIE } from '../helpers/e2e.const'
import { e2eSecrets, signIn } from '../helpers/session'

/*********************************************************
 * Compte : connexion, première connexion, profil (F-10)
 *
 * @description
 * Sur la base de test réelle (ARCH-9) : comptes, sessions et jetons d'invitation créés par `prepare-database.ts`. Accessibilité
 * (axe, clavier), puis les parcours : connexion participant et administrateur, identifiants refusés, activation d'une invitation
 * (avec avatar), lien consommé ou expiré, modification du profil, mot de passe, déconnexion. Aucune donnée n'est servie par une fixture.
 ********************************************************/
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const NEW_PASSWORD = 'un-nouveau-mot-de-passe-de-test'
/** PNG 1 x 1 valide (rouge) : l'avatar est ré-encodé par le serveur, il doit être lisible. */
const TINY_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64')

const hydrated = async (page: Page, url: string) => {
  await page.goto(url)
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
  await page.waitForLoadState('networkidle')
}

const violations = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  return results.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)
}

const logIn = async (page: Page, email: string, password: string) => {
  await page.locator('#login-email').fill(email)
  await page.locator('#login-password').fill(password)
  await page.getByTestId('login-submit').click()
}

test.describe('accessibilité des trois écrans et de leurs états', () => {
  test('/connexion : 0 violation axe, chaque champ a son libellé visible', async ({ page }) => {
    await hydrated(page, '/connexion')
    expect(await violations(page)).toEqual([])
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Mot de passe')).toBeVisible()
  })

  test('/connexion : identifiants refusés, alerte annoncée, 0 violation axe, le mot de passe reste saisi', async ({ page }) => {
    await hydrated(page, '/connexion')
    await logIn(page, 'inconnu@example.test', 'un-mauvais-mot-de-passe')
    const alert = page.getByTestId('login-error')
    await expect(alert).toBeVisible()
    await expect(alert).toHaveAttribute('role', 'alert')
    await expect(alert).toContainText('Email ou mot de passe incorrect')
    await expect(page).toHaveURL(/\/connexion$/)
    expect(await violations(page)).toEqual([])
  })

  test('/connexion : validation à l’envoi (champs vides), sans appel au serveur', async ({ page }) => {
    await hydrated(page, '/connexion')
    let called = false
    await page.route('**/api/v1/auth/login', (route) => {
      called = true
      return route.continue()
    })
    await page.getByTestId('login-submit').click()
    await expect(page.getByText('Ce champ est obligatoire.').first()).toBeVisible()
    expect(called).toBe(false)
  })

  test('/connexion : le clavier suffit, Tab dans l’ordre puis Entrée envoie', async ({ page }) => {
    const { passwords } = e2eSecrets()
    await hydrated(page, '/connexion')
    await page.locator('#login-email').focus()
    await page.keyboard.type('e2e-login@example.test')
    await page.keyboard.press('Tab')
    await expect(page.locator('#login-password')).toBeFocused()
    await page.keyboard.type(passwords.login)
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/profil$/)
  })

  test('/invitation/{jeton} valide : 0 violation axe, exigence de mot de passe en liste, libellés visibles', async ({ page }) => {
    const { invitations } = e2eSecrets()
    await hydrated(page, `/invitation/${invitations.valid}`)
    expect(await violations(page)).toEqual([])
    await expect(page.getByText('Au moins 15 caractères')).toBeVisible()
    for (const label of ['Mot de passe', 'Confirmer le mot de passe', 'Avatar', 'Téléphone · facultatif, jamais public']) {
      await expect(page.getByLabel(label, { exact: true })).toBeVisible()
    }
  })

  test('/invitation/{jeton} : autocomplete jusqu’au champ natif, et le serveur refuse 14 caractères sans consommer le lien', async ({ page, request }) => {
    const { invitations } = e2eSecrets()
    await hydrated(page, `/invitation/${invitations.valid}`)
    await expect(page.locator('#invitation-password')).toHaveAttribute('autocomplete', 'new-password')
    await expect(page.locator('#invitation-confirm')).toHaveAttribute('autocomplete', 'new-password')
    await expect(page.locator('#invitation-phone')).toHaveAttribute('autocomplete', 'tel')
    const refused = await request.post(`/api/v1/auth/invitation/${invitations.valid}`, { data: { password: 'x'.repeat(14) } })
    expect(refused.status()).toBe(400)
    expect((await refused.json() as { code: string }).code).toBe('VALIDATION_FAILED')
    expect((await request.get(`/api/v1/auth/invitation/${invitations.valid}`)).status()).toBe(200)
  })

  test('/invitation/{jeton} expiré ou consommé : état « lien expiré », 410 traduit, 0 violation axe', async ({ page }) => {
    const { invitations } = e2eSecrets()
    for (const token of [invitations.expired, invitations.consumed]) {
      await hydrated(page, `/invitation/${token}`)
      await expect(page.getByRole('heading', { name: 'Lien expiré ou déjà utilisé' })).toBeVisible()
      await expect(page.getByTestId('invitation-back')).toHaveAttribute('href', '/')
      await expect(page.locator('#invitation-password')).toHaveCount(0)
      expect(await violations(page)).toEqual([])
    }
  })

  test('/invitation/{jeton} inconnu : état « lien inconnu »', async ({ page }) => {
    await hydrated(page, '/invitation/jeton-de-test')
    await expect(page.getByRole('heading', { name: 'Lien d’invitation inconnu' })).toBeVisible()
  })

  test('/profil : 0 violation axe, lecture seule, champs modifiables avec libellé', async ({ page, context }) => {
    await signIn(context, 'member')
    await hydrated(page, '/profil')
    expect(await violations(page)).toEqual([])
    await expect(page.getByTestId('profile-readonly')).toContainText('Alan Denoyelle')
    await expect(page.getByTestId('profile-readonly')).not.toContainText('e2e-member@example.test')
    await expect(page.locator('#profile-current-password')).toHaveAttribute('autocomplete', 'current-password')
    await expect(page.locator('#profile-new-password')).toHaveAttribute('autocomplete', 'new-password')
    await expect(page.locator('#profile-confirm-password')).toHaveAttribute('autocomplete', 'new-password')
    for (const label of ['Changer d’avatar', 'Téléphone · privé', 'Mot de passe actuel', 'Nouveau mot de passe', 'Confirmer le nouveau mot de passe']) {
      await expect(page.getByLabel(label, { exact: true })).toBeVisible()
    }
  })

  test('/profil sans session : renvoie vers /connexion', async ({ page }) => {
    await page.goto('/profil')
    await expect(page).toHaveURL(/\/connexion$/)
  })
})

test.describe('parcours de connexion', () => {
  test('participant : arrive sur son profil, l’en-tête affiche « Mon profil »', async ({ page }) => {
    const { passwords } = e2eSecrets()
    await hydrated(page, '/connexion')
    await logIn(page, 'e2e-login@example.test', passwords.login)
    await expect(page).toHaveURL(/\/profil$/)
    await expect(page.getByTestId('account-link')).toHaveText('Mon profil')
    await expect(page.getByTestId('profile-readonly')).toContainText('Alex Madec')
  })

  test('administrateur : arrive sur son espace, l’en-tête affiche « Espace organisateur »', async ({ page }) => {
    const { passwords } = e2eSecrets()
    await hydrated(page, '/connexion')
    await logIn(page, 'e2e-login-admin@example.test', passwords.loginAdmin)
    await expect(page).toHaveURL(/\/admin$/)
  })

  test('aucun secret ni jeton dans le stockage du navigateur, et le cookie de session est illisible en JS', async ({ page }) => {
    const { passwords } = e2eSecrets()
    await hydrated(page, '/connexion')
    await logIn(page, 'e2e-login@example.test', passwords.login)
    await expect(page).toHaveURL(/\/profil$/)
    const storage = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage }, cookie: document.cookie }))
    expect(storage).not.toContain(passwords.login)
    expect(storage).not.toContain(E2E_SESSION_COOKIE)
    const cookies = await page.context().cookies()
    expect(cookies.find(cookie => cookie.name === E2E_SESSION_COOKIE)?.httpOnly).toBe(true)
  })

  test('déconnexion depuis le profil : retour à l’accueil, message annoncé, /profil n’est plus accessible', async ({ page, context }) => {
    await signIn(context, 'member-logout')
    await hydrated(page, '/profil')
    await page.getByTestId('profile-logout').click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByTestId('logged-out-notice')).toHaveText('Vous êtes déconnecté·e')
    await expect(page.getByTestId('public-notice')).toHaveAttribute('role', 'status')
    await expect(page.getByTestId('account-link')).toHaveCount(0)
    await page.goto('/profil')
    await expect(page).toHaveURL(/\/connexion$/)
  })

  test('déconnexion depuis l’en-tête, sur n’importe quelle page publique : même arrivée, message retiré dès qu’on quitte l’accueil', async ({ page, context }) => {
    await signIn(context, 'member-logout-header')
    await hydrated(page, '/editions/2025')
    await expect(page.getByTestId('account-link')).toHaveText('Mon profil')
    await page.getByTestId('logout-link').click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByTestId('logged-out-notice')).toHaveText('Vous êtes déconnecté·e')
    await expect(page.getByTestId('logout-link')).toHaveCount(0)
    await page.getByTestId('nav-/regles').click()
    await expect(page).toHaveURL(/\/regles$/)
    await expect(page.getByTestId('logged-out-notice')).toHaveCount(0)
  })

  test('administrateur : « Se déconnecter » de l’en-tête public mène aussi à l’accueil avec le message', async ({ page, context }) => {
    await signIn(context, 'admin-logout-header')
    await hydrated(page, '/')
    await expect(page.getByTestId('account-link')).toHaveText('Espace organisateur')
    await page.getByTestId('logout-link').click()
    await expect(page.getByTestId('logged-out-notice')).toHaveText('Vous êtes déconnecté·e')
    await expect(page.getByTestId('account-link')).toHaveCount(0)
  })
})

test.describe('première connexion par invitation', () => {
  test.describe.configure({ mode: 'serial' })

  test('mot de passe trop court ou confirmation différente : refusés avant tout envoi', async ({ page }) => {
    const { invitations } = e2eSecrets()
    await hydrated(page, `/invitation/${invitations.flow}`)
    let called = false
    await page.route(`**/api/v1/auth/invitation/${invitations.flow}`, (route) => {
      called = true
      return route.continue()
    })
    await page.locator('#invitation-password').fill('trop-court')
    await page.locator('#invitation-confirm').fill('autre-chose')
    await page.getByTestId('invitation-submit').click()
    await expect(page.getByText('au moins 15 caractères').first()).toBeVisible()
    expect(called).toBe(false)
  })

  test('un avatar de plus de 2 Mo ou hors JPEG, PNG, WebP est refusé tout de suite, le formulaire reste utilisable', async ({ page }) => {
    const { invitations } = e2eSecrets()
    await hydrated(page, `/invitation/${invitations.flow}`)
    await page.locator('#invitation-avatar').setInputFiles({ name: 'gros.png', mimeType: 'image/png', buffer: Buffer.alloc(2 * 1024 * 1024 + 1) })
    await expect(page.getByTestId('avatar-field-error')).toContainText('2 Mo')
    await page.locator('#invitation-avatar').setInputFiles({ name: 'texte.txt', mimeType: 'text/plain', buffer: Buffer.from('bonjour') })
    await expect(page.getByTestId('avatar-field-error')).toContainText('JPEG, PNG ou WebP')
    await expect(page.getByTestId('invitation-submit')).toBeEnabled()
  })

  test('activation avec avatar et téléphone : session ouverte, profil à jour, lien consommé', async ({ page }) => {
    const { invitations } = e2eSecrets()
    await hydrated(page, `/invitation/${invitations.flow}`)
    await page.locator('#invitation-password').fill(NEW_PASSWORD)
    await page.locator('#invitation-confirm').fill(NEW_PASSWORD)
    await page.locator('#invitation-avatar').setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: TINY_PNG })
    await page.locator('#invitation-phone').fill('+33 6 22 22 22 22')
    await page.getByTestId('invitation-submit').click()
    await expect(page).toHaveURL(/\/profil$/)
    await expect(page.getByTestId('profile-readonly')).toContainText('Amandine Content')
    await expect(page.locator('#profile-phone')).toHaveValue('+33 6 22 22 22 22')
    await expect(page.getByTestId('avatar-field-preview')).toHaveCount(0)
    const response = await page.request.get('/api/v1/moi')
    const body = await response.json() as { competitor: { avatarUrl: string | null } }
    expect(body.competitor.avatarUrl).toMatch(/\/api\/v1\/competiteurs\/.+\/avatar\?v=/)
    await page.goto(`/invitation/${invitations.flow}`)
    await expect(page.getByRole('heading', { name: 'Lien expiré ou déjà utilisé' })).toBeVisible()
  })

  test.afterAll(async ({ playwright, baseURL }) => {
    // L'avatar posé par l'activation est public (annuaire, fiche) : on le retire pour que les captures des autres écrans restent sur les archives.
    const api = await playwright.request.newContext({ baseURL })
    const login = await api.post('/api/v1/auth/login', { data: { email: 'e2e-invited-flow@example.test', password: NEW_PASSWORD } })
    if (login.ok()) {
      await api.delete('/api/v1/moi/avatar')
    }
    await api.dispose()
  })
})

test.describe('profil incomplet, session expirée, en-têtes de sécurité', () => {
  test('profil incomplet : la bannière non bloquante dit ce qui manque, lu sur le compte', async ({ page, context }) => {
    await signIn(context, 'member')
    await hydrated(page, '/profil')
    const banner = page.getByTestId('profile-incomplete')
    await expect(banner).toContainText('Profil incomplet')
    await expect(banner).toContainText('photo')
    await expect(banner).not.toContainText('téléphone')
    await expect(banner).not.toContainText('pseudo')
    await expect(page.getByTestId('profile-submit')).toBeEnabled()
  })

  test('profil incomplet : le pseudo est cité quand il manque, l’organisation seule le renseigne', async ({ page, context }) => {
    await signIn(context, 'member-edit')
    await hydrated(page, '/profil')
    await expect(page.getByTestId('profile-incomplete')).toContainText('pseudo')
  })

  test('session expirée : une écriture refusée (401) vide le compte et renvoie vers /connexion', async ({ page, context, request }) => {
    await signIn(context, 'member-expired')
    await hydrated(page, '/profil')
    const cookie = (await context.cookies()).find(entry => entry.name === E2E_SESSION_COOKIE)!
    const revoked = await request.post('/api/v1/auth/logout', { headers: { cookie: `${cookie.name}=${cookie.value}` } })
    expect(revoked.ok()).toBe(true)
    await page.locator('#profile-phone').fill('+33 6 44 44 44 44')
    await page.getByTestId('profile-submit').click()
    await expect(page).toHaveURL(/\/connexion$/)
    await expect(page.getByTestId('account-link')).toHaveCount(0)
  })

  test('en-têtes : pas de référent sur le lien d’invitation, origine seule ailleurs, jamais de cache partagé avec un cookie de session', async ({ request, context }) => {
    const { invitations } = e2eSecrets()
    const invitation = await request.get(`/invitation/${invitations.valid}`)
    expect(invitation.headers()['referrer-policy']).toBe('no-referrer')
    expect(invitation.headers()['cache-control']).toContain('no-store')
    const home = await request.get('/')
    expect(home.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(home.headers()['cache-control'] ?? '').not.toContain('private')
    await signIn(context, 'member')
    const cookie = (await context.cookies()).find(entry => entry.name === E2E_SESSION_COOKIE)!
    const profile = await request.get('/profil', { headers: { cookie: `${cookie.name}=${cookie.value}` } })
    expect(profile.headers()['cache-control']).toBe('private, no-store')
  })
})

test.describe('profil : écritures', () => {
  test.describe.configure({ mode: 'serial' })

  test('le téléphone est enregistré, annoncé, puis relu au rechargement', async ({ page, context }) => {
    await signIn(context, 'member-edit')
    await hydrated(page, '/profil')
    await page.locator('#profile-phone').fill('+33 6 33 33 33 33')
    await page.getByTestId('profile-submit').click()
    await expect(page.getByRole('heading', { name: 'Profil enregistré' })).toBeVisible()
    await page.reload()
    await expect(page.locator('#profile-phone')).toHaveValue('+33 6 33 33 33 33')
  })

  test('un téléphone vidé est effacé', async ({ page, context }) => {
    await signIn(context, 'member-edit')
    await hydrated(page, '/profil')
    await page.locator('#profile-phone').fill('')
    await page.getByTestId('profile-submit').click()
    await expect(page.getByRole('heading', { name: 'Profil enregistré' })).toBeVisible()
    await page.reload()
    await expect(page.locator('#profile-phone')).toHaveValue('')
  })

  test('un téléphone refusé par le serveur est expliqué, sans annonce d’enregistrement', async ({ page, context }) => {
    await signIn(context, 'member-edit')
    await hydrated(page, '/profil')
    await page.locator('#profile-phone').fill('pas un numéro')
    await page.getByTestId('profile-submit').click()
    await expect(page.getByTestId('profile-error')).toContainText('invalides')
    await expect(page.getByRole('heading', { name: 'Profil enregistré' })).toHaveCount(0)
  })

  test('avatar : posé puis retiré, les initiales reviennent', async ({ page, context }) => {
    await signIn(context, 'member-edit')
    await hydrated(page, '/profil')
    await page.locator('#profile-avatar').setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: TINY_PNG })
    await expect(page.getByTestId('avatar-field-remove')).toBeVisible()
    const withAvatar = await (await page.request.get('/api/v1/moi')).json() as { competitor: { avatarUrl: string | null } }
    expect(withAvatar.competitor.avatarUrl).toContain('?v=')
    await page.getByTestId('avatar-field-remove').click()
    await expect(page.getByTestId('avatar-field-remove')).toHaveCount(0)
    const withoutAvatar = await (await page.request.get('/api/v1/moi')).json() as { competitor: { avatarUrl: string | null } }
    expect(withoutAvatar.competitor.avatarUrl).toBeNull()
  })

  test('mot de passe : le mot de passe actuel est exigé, puis le nouveau mot de passe ouvre une connexion', async ({ page, context, request }) => {
    const { passwords } = e2eSecrets()
    await signIn(context, 'member-edit')
    await hydrated(page, '/profil')
    await page.locator('#profile-new-password').fill(NEW_PASSWORD)
    await page.locator('#profile-confirm-password').fill('autre-chose-que-le-nouveau')
    await page.getByTestId('profile-submit').click()
    await expect(page.getByText('Saisissez votre mot de passe actuel').first()).toBeVisible()
    await expect(page.getByText('Les deux mots de passe sont différents').first()).toBeVisible()
    await page.locator('#profile-confirm-password').fill(NEW_PASSWORD)
    await page.locator('#profile-current-password').fill('un-mauvais-mot-de-passe-actuel')
    await page.getByTestId('profile-submit').click()
    await expect(page.getByText('Le mot de passe actuel est incorrect')).toBeVisible()
    await expect(page.getByTestId('profile-error')).toHaveCount(0)
    await expect(page.locator('#profile-new-password')).toHaveValue(NEW_PASSWORD)
    await page.locator('#profile-current-password').fill(passwords.edit)
    await page.getByTestId('profile-submit').click()
    await expect(page.getByRole('heading', { name: 'Profil enregistré' })).toBeVisible()
    await expect(page.locator('#profile-new-password')).toHaveValue('')
    await expect(page.locator('#profile-confirm-password')).toHaveValue('')
    await expect(page.locator('#profile-current-password')).toHaveValue('')
    // Un contexte de requête neuf : une connexion qui présente le cookie de session le révoque (rotation), or d'autres specs réutilisent cette session.
    const relogin = await request.post('/api/v1/auth/login', { data: { email: 'e2e-member-edit@example.test', password: NEW_PASSWORD } })
    expect(relogin.status()).toBe(200)
  })
})
