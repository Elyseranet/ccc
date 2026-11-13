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

export interface IWriteDraw {
  id: string
  poolCount: number
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
export const createRegistrationEdition = async (request: APIRequestContext, label: string, seedName?: Partial<Pick<IWriteCompetitor, 'firstName' | 'lastName'>>): Promise<{ edition: IWriteEdition, seed: IWriteCompetitor, seedParticipation: IWriteParticipant }> => {
  const edition = await createEdition(request, label)
  const seed = await createCompetitor(request, `${label} inscrit`, seedName)
  const seedParticipation = await attachParticipant(request, edition, seed)
  return { edition: { ...edition, status: 'REGISTRATION' }, seed, seedParticipation }
}

/** Inscrit `count` compétiteurs neufs (créés pour le test) à l'édition : de quoi former des poules. */
export const attachNewParticipants = async (request: APIRequestContext, edition: IWriteEdition, count: number, label: string): Promise<IWriteCompetitor[]> => {
  const competitors: IWriteCompetitor[] = []
  for (let index = 0; index < count; index += 1) {
    const competitor = await createCompetitor(request, `${label} ${index + 1}`)
    await attachParticipant(request, edition, competitor)
    competitors.push(competitor)
  }
  return competitors
}

const STATUS_OK = 200

const expectOk = async (response: Awaited<ReturnType<APIRequestContext['get']>>, what: string, expected: number[]) => {
  if (!expected.includes(response.status())) {
    throw new Error(`${what} : ${response.status()} ${await response.text()}`)
  }
  return response.json() as Promise<unknown>
}

/**
 * Crée et VALIDE le tirage des poules de l'édition par les routes réelles de B-11 : têtes de série proposées par le serveur, brouillon, affectation de
 * chaque inscrit (têtes de série en tête, les autres répartis en rond), puis validation. L'édition passe en `POOLS_DRAWN` : le tirage est figé.
 * Il faut au moins `poolCount` inscrits.
 */
export const createValidatedPoolDraw = async (request: APIRequestContext, edition: IWriteEdition, poolCount = 2): Promise<IWriteDraw> => {
  const proposal = await expectOk(await request.get(`/api/v1/editions/${edition.id}/tetes-de-serie`, { params: { poules: poolCount } }), 'GET tetes-de-serie', [STATUS_OK]) as { seeds: Array<{ participationId: string }> }
  const seeds = proposal.seeds.map(seed => seed.participationId)
  const draft = await expectOk(await request.post(`/api/v1/editions/${edition.id}/tirages/poules`, { data: { poolCount, seedCount: poolCount, seeds } }), 'POST tirages/poules', [STATUS_CREATED]) as { id: string }
  const participants = await expectOk(await request.get(`/api/v1/admin/editions/${edition.id}/participants`), 'GET participants admin', [STATUS_OK]) as Array<{ participationId: string }>
  const others = participants.map(participant => participant.participationId).filter(id => !seeds.includes(id))
  const assignments = [
    ...seeds.map((participationId, index) => ({ participationId, poolNumber: index + 1, drawnOrder: index + 1 })),
    ...others.map((participationId, index) => ({ participationId, poolNumber: (index % poolCount) + 1, drawnOrder: seeds.length + index + 1 }))
  ]
  await expectOk(await request.put(`/api/v1/tirages/${draft.id}/affectations`, { data: { assignments } }), 'PUT affectations', [STATUS_OK])
  await expectOk(await request.post(`/api/v1/tirages/${draft.id}/validation`), 'POST validation', [STATUS_OK])
  return { id: draft.id, poolCount }
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

/*********************************************************
 * Tirage des poules par l'API réelle (F-08, scores)
 *
 * @description
 * Un test de score a besoin de matchs. `createDrawnEdition` crée l'édition, ses inscrits (compétiteurs créés pour le test),
 * puis enchaîne les routes réelles de B-11 : têtes de série proposées, brouillon, affectations, validation. Les inscrits sont
 * répartis en `poolCount` poules par ordre de tirage (la tête de série d'une poule en premier : RG11). L'édition passe à
 * `POOLS_DRAWN`, le tour de poules est `DRAWN` (la saisie des scores est ouverte).
 ********************************************************/
export interface IDrawnEdition {
  edition: IWriteEdition
  participants: IWriteParticipant[]
  competitors: IWriteCompetitor[]
}

interface ISeedProposalResponse { seeds: Array<{ participationId: string }> }
interface IDrawResponse { id: string }

const expectStatus = async (response: Awaited<ReturnType<APIRequestContext['get']>>, label: string, expected: number): Promise<unknown> => {
  if (response.status() !== expected) {
    throw new Error(`${label} : ${response.status()} ${await response.text()}`)
  }
  return response.json()
}

/** Une édition dont le tirage des poules est validé : `participantCount` inscrits répartis en `poolCount` poules. */
export const createDrawnEdition = async (request: APIRequestContext, label: string, participantCount = 4, poolCount = 1): Promise<IDrawnEdition> => {
  const edition = await createEdition(request, label)
  const competitors: IWriteCompetitor[] = []
  const participants: IWriteParticipant[] = []
  for (let index = 0; index < participantCount; index += 1) {
    const competitor = await createCompetitor(request, `${label} ${index + 1}`)
    competitors.push(competitor)
    participants.push(await attachParticipant(request, edition, competitor))
  }
  const proposal = await expectStatus(await request.get(`/api/v1/editions/${edition.id}/tetes-de-serie?poules=${poolCount}`), 'GET tetes-de-serie', STATUS_OK) as ISeedProposalResponse
  const seeds = proposal.seeds.map(seed => seed.participationId)
  const draw = await expectStatus(await request.post(`/api/v1/editions/${edition.id}/tirages/poules`, { data: { poolCount, seedCount: poolCount, seeds } }), 'POST tirages/poules', STATUS_CREATED) as IDrawResponse
  const seedSet = new Set(seeds)
  const ordered = [...seeds, ...participants.map(participant => participant.participationId).filter(id => !seedSet.has(id))]
  const assignments = ordered.map((participationId, index) => ({
    participationId,
    poolNumber: index < poolCount ? index + 1 : (index % poolCount) + 1,
    drawnOrder: index + 1
  }))
  await expectStatus(await request.put(`/api/v1/tirages/${draw.id}/affectations`, { data: { assignments } }), 'PUT affectations', STATUS_OK)
  await expectStatus(await request.post(`/api/v1/tirages/${draw.id}/validation`), 'POST validation', STATUS_OK)
  return { edition: { ...edition, status: 'POOLS_DRAWN' }, participants, competitors }
}

/*********************************************************
 * Départage à N côtés par l'API réelle (F-21)
 *
 * @description
 * Un départage à 3 côtés ou plus ne naît que d'une égalité réelle entre N joueurs. `createMultiTiebreakEdition` en fabrique une
 * sans rien écrire en base à la main : `sideCount` poules de deux joueurs, chaque match joué et validé 5-2, donc `sideCount` perdants
 * à égalité parfaite (0 victoire, 2 pour, 5 contre) pour une seule place de « meilleur 2e » (`topPerPool: 1`, `bestNextCount: 1`).
 * `POST /editions/{id}/departages` crée alors le match `TIEBREAK` à `sideCount` côtés (B-13, cible 3). Il reste à saisir.
 ********************************************************/
export interface IMultiTiebreakEdition {
  edition: IWriteEdition
  /** Le match de départage (`IAdminMatch` de la réponse 201), à `sideCount` côtés, sans score. */
  tiebreak: { id: string, sides: Array<{ participationId: string, displayName: string }>, version: number, targetScore: number }
}

export interface IAdminMatchView { id: string, version: number, purpose: string, sides: Array<{ participationId: string }> }

const STATUS_PUT_OK = 200

const scoreAndValidate = async (request: APIRequestContext, match: IAdminMatchView, scores: number[]): Promise<void> => {
  const submission = { scores: match.sides.map((side, index) => ({ participationId: side.participationId, score: scores[index]! })) }
  const recorded = await expectStatus(await request.put(`/api/v1/matchs/${match.id}/score`, { data: submission, headers: { 'If-Match': `"${match.version}"` } }), 'PUT score', STATUS_PUT_OK) as { version: number }
  await expectStatus(await request.post(`/api/v1/matchs/${match.id}/validation`, { data: submission, headers: { 'If-Match': `"${recorded.version}"` } }), 'POST validation', STATUS_OK)
}

/**
 * `sideCount` poules de deux joueurs, chaque match validé 5-2 : `sideCount` perdants à égalité parfaite. Avec `topPerPool: 1` et `bestNextCount: 1` ils se disputent
 * une seule place de « meilleur 2e » : une égalité entre poules à `sideCount` joueurs. Rien n'est créé de plus (le départage est à créer par l'écran ou l'API).
 */
export const createTiedPoolsEdition = async (request: APIRequestContext, label: string, sideCount: number): Promise<{ edition: IWriteEdition, losers: string[] }> => {
  const { edition } = await createDrawnEdition(request, label, sideCount * 2, sideCount)
  const matches = await expectStatus(await request.get(`/api/v1/admin/editions/${edition.id}/matchs`), 'GET matchs admin', STATUS_OK) as IAdminMatchView[]
  const losers: string[] = []
  for (const match of matches) {
    await scoreAndValidate(request, match, [5, 2])
    losers.push(match.sides[1]!.participationId)
  }
  return { edition, losers }
}

export const createMultiTiebreakEdition = async (request: APIRequestContext, label: string, sideCount: number): Promise<IMultiTiebreakEdition> => {
  const { edition, losers } = await createTiedPoolsEdition(request, label, sideCount)
  const tiebreak = await expectStatus(
    await request.post(`/api/v1/editions/${edition.id}/departages`, { data: { participationIds: losers, parameters: { topPerPool: 1, bestNextCount: 1 } } }),
    'POST departages',
    STATUS_CREATED
  ) as IMultiTiebreakEdition['tiebreak']
  return { edition, tiebreak }
}

/** Saisit puis valide le score d'un match par l'API réelle (`scores` dans l'ordre des côtés), comme un administrateur sur l'écran des matchs. */
export const playMatch = async (request: APIRequestContext, match: IAdminMatchView, scores: number[]): Promise<void> => {
  await scoreAndValidate(request, match, scores)
}

/**
 * Une édition dont la liste des qualifiés est ARRÊTÉE (F-25) : `poolCount` poules de deux joueurs jouées comme dans `createTiedPoolsEdition`, puis
 * `POST /qualification` avec 2 premiers par poule (tout le monde est qualifié : `2 × poolCount` joueurs) ; `withPlayoff` ajoute les barrages (les premiers de poule attendent).
 * Le tour à tirer se déduit du nombre de joueurs : 4 poules = 8 joueurs = quarts, 2 poules = 4 joueurs = demies, 6 poules = 12 joueurs = tour à choisir.
 */
export const createQualifiedEdition = async (request: APIRequestContext, label: string, poolCount: number, withPlayoff = false): Promise<IWriteEdition> => {
  const { edition } = await createTiedPoolsEdition(request, label, poolCount)
  await expectStatus(await request.post(`/api/v1/editions/${edition.id}/qualification`, { data: { topPerPool: 2, bestNextCount: 0, withPlayoff } }), 'POST qualification', STATUS_OK)
  return { ...edition, status: 'QUALIFIED' }
}
