import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import type { APIRequestContext, BrowserContext } from '@playwright/test'
import {
  E2E_ADMIN_EDITION_COOKIE,
  E2E_BASE_URL,
  E2E_MAIL_CAPTURE_FILE,
  E2E_WRITE_EMAIL_DOMAIN,
  E2E_WRITE_YEAR_FIRST,
  E2E_WRITE_YEAR_SPAN
} from './e2e.const'

/*********************************************************
 * Éditions et compétiteurs créés par un test d'écriture (QA-3)
 *
 * @description
 * Un test qui écrit (ajouter ou retirer un inscrit, saisir un score, tirer les poules…) travaille sur SA propre
 * édition, créée par l'API réelle d'administration (`POST /editions`), jamais sur les archives (2012 à 2026) ni sur 2026
 * en phase de poules (QA-2). Les compétiteurs dont il a besoin sont créés de la même façon (`POST /competiteurs`) : un
 * test n'écrit jamais sur un profil partagé.
 *
 * Unicité : le serveur génère le code de l'édition (CE-1) sous verrou, deux créations simultanées (`fullyParallel`)
 * ne se marchent donc jamais dessus. Seule l'année peut s'épuiser (26 codes par an, 409 `EDITION_CODE_EXHAUSTED`) :
 * elle part d'un hachage du libellé du test dans les années 2050 à 2099, bien au-delà des archives, et passe à
 * la suivante si elle est épuisée. La base est remise à neuf à chaque lancement (global-setup).
 *
 * Statuts : `POST /editions` donne `CREATED` ; la première inscription (`attachParticipant`) fait passer l'édition à
 * `REGISTRATION` par la route réelle. `createRegistrationEdition` rend donc une édition en inscriptions avec un
 * premier inscrit, prête pour les tirages (F-11) ou les scores (F-08) qui poursuivront les transitions par leurs routes.
 *
 * Ces éditions restent dans la base jusqu'au lancement suivant : le projet Playwright `writes` passe après les autres
 * (`dependencies`), qui lisent donc la base telle que le seed l'a laissée.
 ********************************************************/
export interface IWriteEdition {
  id: string
  code: string
  year: number
  status: string
}

export interface IWriteCompetitor {
  id: string
  email: string
  firstName: string
  lastName: string
  displayName: string
}

export interface IWriteParticipant {
  participationId: string
  competitorId: string
  invitationSent: boolean | null
}

export interface ICapturedMail {
  to: string
  subject: string
  text: string
}

const STATUS_CREATED = 201
const STATUS_CONFLICT = 409
const CODE_EXHAUSTED = 'EDITION_CODE_EXHAUSTED'
const HASH_MULTIPLIER = 31

const hashOf = (label: string): number => [...label].reduce((hash, character) => (hash * HASH_MULTIPLIER + character.charCodeAt(0)) >>> 0, 0)

/** Courriel unique et jetable : il n'est jamais réutilisé d'un test à l'autre (refus `EMAIL_ALREADY_USED` sinon). */
export const uniqueEmail = (prefix: string): string => `${prefix}.${randomUUID().slice(0, 8)}@${E2E_WRITE_EMAIL_DOMAIN}`

/** Crée une édition en `CREATED` (code serveur, année issue du libellé du test). */
export const createEdition = async (request: APIRequestContext, label: string): Promise<IWriteEdition> => {
  const start = hashOf(label) % E2E_WRITE_YEAR_SPAN
  for (let offset = 0; offset < E2E_WRITE_YEAR_SPAN; offset += 1) {
    const year = E2E_WRITE_YEAR_FIRST + (start + offset) % E2E_WRITE_YEAR_SPAN
    const response = await request.post('/api/v1/editions', { data: { year, name: `E2E ${label}` } })
    if (response.status() === STATUS_CREATED) {
      return await response.json() as IWriteEdition
    }
    const body = await response.json().catch(() => ({})) as { code?: string }
    if (response.status() !== STATUS_CONFLICT || body.code !== CODE_EXHAUSTED) {
      throw new Error(`POST /editions : ${response.status()} ${JSON.stringify(body)}`)
    }
  }
  throw new Error(`Aucune année libre pour l'édition de test « ${label} »`)
}

/** Crée un compétiteur (avec compte invité) : un profil propre au test, rattachable ensuite par la route réelle. */
export const createCompetitor = async (
  request: APIRequestContext,
  label: string,
  overrides: Partial<Pick<IWriteCompetitor, 'firstName' | 'lastName' | 'email'>> = {}
): Promise<IWriteCompetitor> => {
  const firstName = overrides.firstName ?? 'Test'
  const lastName = overrides.lastName ?? `Ecriture ${label}`
  const email = overrides.email ?? uniqueEmail('profil')
  const response = await request.post('/api/v1/competiteurs', { data: { email, firstName, lastName } })
  if (response.status() !== STATUS_CREATED) {
    throw new Error(`POST /competiteurs : ${response.status()} ${await response.text()}`)
  }
  const { competitorId } = await response.json() as { competitorId: string }
  return { id: competitorId, email, firstName, lastName, displayName: `${firstName} ${lastName}` }
}

/** Rattache un compétiteur existant à l'édition (la première inscription la fait passer à `REGISTRATION`). */
export const attachParticipant = async (request: APIRequestContext, edition: IWriteEdition, competitor: IWriteCompetitor): Promise<IWriteParticipant> => {
  const response = await request.post(`/api/v1/editions/${edition.id}/participants`, { data: { competitorId: competitor.id } })
  if (response.status() !== STATUS_CREATED) {
    throw new Error(`POST /editions/${edition.id}/participants : ${response.status()} ${await response.text()}`)
  }
  const body = await response.json() as { participationId: string, invitationSent: boolean | null }
  return { participationId: body.participationId, competitorId: competitor.id, invitationSent: body.invitationSent }
}

/** Une édition en inscriptions, avec un premier inscrit créé pour le test. */
export const createRegistrationEdition = async (request: APIRequestContext, label: string): Promise<{ edition: IWriteEdition, seed: IWriteCompetitor, seedParticipation: IWriteParticipant }> => {
  const edition = await createEdition(request, label)
  const seed = await createCompetitor(request, `${label} inscrit`)
  const seedParticipation = await attachParticipant(request, edition, seed)
  return { edition: { ...edition, status: 'REGISTRATION' }, seed, seedParticipation }
}

/** Fait de cette édition l'édition de travail des pages admin (cookie du sélecteur d'édition). */
export const selectAdminEdition = async (context: BrowserContext, edition: IWriteEdition): Promise<void> => {
  await context.addCookies([{ name: E2E_ADMIN_EDITION_COOKIE, value: edition.id, url: E2E_BASE_URL, sameSite: 'Lax' }])
}

/** Courriels capturés par le serveur de test (transport `capture`). */
export const readCapturedMails = (): ICapturedMail[] => readFileSync(E2E_MAIL_CAPTURE_FILE, 'utf8')
  .split('\n')
  .filter(line => line.trim() !== '')
  .map(line => JSON.parse(line) as ICapturedMail)
