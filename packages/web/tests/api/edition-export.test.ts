import 'reflect-metadata'
import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { unzipSync } from 'fflate'
import readExcelFile from 'read-excel-file/node'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { buildEditionExportFilename, EDITION_EXPORT_CONTENT_TYPE, EDITION_EXPORT_SHEET_NAMES } from '../../src/consts/edition-export.const'
import { DRAW_KIND, DRAW_STATUS } from '../../src/enums/draw.enum'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../src/enums/edition.enum'
import { MATCH_PURPOSE, MATCH_STATUS } from '../../src/enums/match.enum'
import { FINAL_STAGE, PARTICIPATION_STATUS } from '../../src/enums/participation.enum'
import { ROUND_KIND, ROUND_STATUS } from '../../src/enums/round.enum'
import { USER_ROLE } from '../../src/enums/user.enum'
import type { IApiError } from '../../src/interfaces/error.interface'
import { CompetitorEntity } from '../../src/server/db/typeorm/entities/competitor.entity'
import { DrawAssignmentEntity } from '../../src/server/db/typeorm/entities/draw-assignment.entity'
import { DrawEntity } from '../../src/server/db/typeorm/entities/draw.entity'
import { EditionEntity } from '../../src/server/db/typeorm/entities/edition.entity'
import { MatchSideEntity } from '../../src/server/db/typeorm/entities/match-side.entity'
import { MatchEntity } from '../../src/server/db/typeorm/entities/match.entity'
import { ParticipationEntity } from '../../src/server/db/typeorm/entities/participation.entity'
import { RoundEntity } from '../../src/server/db/typeorm/entities/round.entity'
import { UserEntity } from '../../src/server/db/typeorm/entities/user.entity'
import { cookieHeaderOf, login, resetTestDatabase, seedUser } from './helpers/auth-fixtures'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'
import { clearPool, seedPoolStage } from './helpers/seed-pool-stage'
import type { IPoolStageFixture } from './helpers/seed-pool-stage'
import { requireTestDatabaseEnv } from './helpers/test-database'

const PASSWORD = 'a-long-enough-password'
const ADMIN_EMAIL = 'boss-b30@ccc.test'
const PLAYER_EMAIL = 'player-b30@ccc.test'
const PENDING_MATCHES = 1
const SHEETS = Object.values(EDITION_EXPORT_SHEET_NAMES)

type TSheets = Record<string, unknown[][]>

describe('edition Excel export (B-30)', async () => {
  const env = requireTestDatabaseEnv()
  const dataSource: DataSource = await resetTestDatabase()
  await seedUser(dataSource, { email: ADMIN_EMAIL, password: PASSWORD, role: USER_ROLE.ADMIN })
  const player = await seedUser(dataSource, { email: PLAYER_EMAIL, password: PASSWORD, role: USER_ROLE.PARTICIPANT, withCompetitor: true })
  // Le nom affiché ne doit pas contenir l'email : le test « aucun email » cherche l'adresse dans tout le fichier.
  await dataSource.getRepository(CompetitorEntity).update({ id: player.competitorId! }, { displayName: 'Zoé Test', firstName: 'Zoé', lastName: 'Test', nickname: 'Zozo' })

  // Édition en cours : deux poules de trois (6 matchs, le dernier sans score), un tirage de poules validé, qualification arrêtée.
  const live: IPoolStageFixture = await seedPoolStage(dataSource, {
    code: '2060', rank: 60, pools: [clearPool('A'), clearPool('B')], pendingMatches: PENDING_MATCHES, status: EDITION_STATUS.POOLS_PLAYING
  })
  await dataSource.getRepository(EditionEntity).update({ id: live.edition.id }, {
    name: 'Cup =SUM(1+1)', location: 'Cherbourg', qualification: { topPerPool: 2, bestNextCount: 1, withPlayoff: false }
  })
  const liveMembers = [...live.participationByName.values()]
  await dataSource.getRepository(ParticipationEntity).save({
    editionId: live.edition.id, competitorId: player.competitorId!, status: PARTICIPATION_STATUS.REGISTERED
  })
  await dataSource.getRepository(ParticipationEntity).update({ id: liveMembers[0]!.id }, { isSeed: true, seedRank: 1 })
  const draw = await dataSource.getRepository(DrawEntity).save({
    editionId: live.edition.id, kind: DRAW_KIND.POOLS, status: DRAW_STATUS.VALIDATED, parameters: { poolCount: 2, seedCount: 1 }, validatedAt: new Date()
  })
  await dataSource.getRepository(DrawAssignmentEntity).save(liveMembers.map((member, index) => ({
    drawId: draw.id, participationId: member.id, poolId: member.poolId, poolNumber: index < 3 ? 1 : 2, drawnOrder: index + 1
  })))

  // Archive : une finale, un champion, un finaliste, un score de départage non jugé (finale sans score importé).
  const archive = await dataSource.getRepository(EditionEntity).save({
    code: '2010', year: 2010, chronologicalRank: 10, name: 'Archive 2010', heldOn: '2010-06-12',
    status: EDITION_STATUS.CLOSED, origin: EDITION_ORIGIN.LEGACY_IMPORT, participantCount: 16, closedAt: new Date('2010-06-13T10:30:00Z')
  })
  const archivePlayers = await dataSource.getRepository(CompetitorEntity).save([{ displayName: 'Champion Archive' }, { displayName: 'Finaliste Archive' }])
  const [champion, runnerUp] = await dataSource.getRepository(ParticipationEntity).save([
    { editionId: archive.id, competitorId: archivePlayers[0]!.id, status: PARTICIPATION_STATUS.WINNER, finalStage: FINAL_STAGE.CHAMPION, points: 16 },
    { editionId: archive.id, competitorId: archivePlayers[1]!.id, status: PARTICIPATION_STATUS.ELIMINATED, finalStage: FINAL_STAGE.FINALIST, points: 12 }
  ])
  const finalRound = await dataSource.getRepository(RoundEntity).save({
    editionId: archive.id, kind: ROUND_KIND.FINAL, sequence: 1, status: ROUND_STATUS.COMPLETED
  })
  const finalMatch = await dataSource.getRepository(MatchEntity).save({
    editionId: archive.id, roundId: finalRound.id, sequence: 1, targetScore: 5, purpose: MATCH_PURPOSE.REGULAR,
    status: MATCH_STATUS.VALIDATED, validatedAt: new Date()
  })
  await dataSource.getRepository(MatchSideEntity).save([
    { matchId: finalMatch.id, position: 1, participationId: champion!.id, validatedScore: 5, recordedScore: 5 },
    { matchId: finalMatch.id, position: 2, participationId: runnerUp!.id, validatedScore: 2, recordedScore: 2 }
  ])

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: { ...env, NUXT_AUTH_LOGIN_RATE_LIMIT_MAX_IP_ATTEMPTS: '1000' }
  })

  let adminCookie = ''
  let playerCookie = ''
  beforeAll(async () => {
    adminCookie = cookieHeaderOf(await login(ADMIN_EMAIL, PASSWORD))
    playerCookie = cookieHeaderOf(await login(PLAYER_EMAIL, PASSWORD))
  })
  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })

  const exportPath = (id: string): string => `/api/v1/admin/editions/${id}/export.xlsx`
  const download = (id: string, cookie = adminCookie) => fetch(exportPath(id), { headers: { Cookie: cookie } })
  const readWorkbook = async (response: Response): Promise<{ sheets: TSheets, bytes: Uint8Array }> => {
    const bytes = new Uint8Array(await response.arrayBuffer())
    const sheets = await readExcelFile(Buffer.from(bytes))
    return { sheets: Object.fromEntries(sheets.map(({ sheet, data }) => [sheet, data])), bytes }
  }
  const dataRows = (sheets: TSheets, name: string): unknown[][] => sheets[name]!.slice(1)
  const fieldOf = (sheets: TSheets, field: string): unknown => sheets['Édition']!.find((row) => row[0] === field)?.[1]

  it('answers 401 anonymously and 403 to a participant, without any file', async () => {
    const anonymous = await fetch(exportPath('2060'))
    expect(anonymous.status).toBe(401)
    expect((await anonymous.json() as IApiError).code).toBe(API_ERROR_CODE.UNAUTHORIZED)
    const participant = await download('2060', playerCookie)
    expect(participant.status).toBe(403)
    expect(participant.headers.get('content-type')).not.toContain('spreadsheetml')
  })

  it('answers 404 for an unknown edition and 400 for a malformed id', async () => {
    expect((await download('2999')).status).toBe(404)
    expect((await download('not an id!')).status).toBeGreaterThanOrEqual(400)
  })

  it('serves an in-progress edition by code or by uuid with the download headers, one sheet per part', async () => {
    const byCode = await download('2060')
    expect(byCode.status).toBe(200)
    expect(byCode.headers.get('content-type')).toBe(EDITION_EXPORT_CONTENT_TYPE)
    expect(byCode.headers.get('content-disposition')).toBe(`attachment; filename="${buildEditionExportFilename('2060')}"`)
    expect(byCode.headers.get('cache-control')).toBe('no-store')
    const { sheets } = await readWorkbook(byCode)
    expect(Object.keys(sheets)).toEqual(SHEETS)

    const byUuid = await readWorkbook(await download(live.edition.id))
    expect(byUuid.sheets).toEqual(sheets)
  })

  it('writes French headers and one row per participant, pool row, match and draw assignment', async () => {
    const { sheets } = await readWorkbook(await download('2060'))
    expect(sheets['Participants']![0]).toEqual(['Nom', 'Prénom', 'Pseudo', 'Poule', 'Tête de série', 'Tour atteint', 'Points'])
    expect(sheets['Poules']![0]).toEqual(['Poule', 'Rang', 'Joueur', 'Joués', 'Victoires', 'Défaites', 'Points pour', 'Points contre', 'Cap\'s average'])
    expect(sheets['Matchs']![0]).toEqual(['Tour', 'Poule', 'N°', 'Joueur A', 'Score A', 'Joueur B', 'Score B', 'Vainqueur', 'Statut', 'Départage', 'Autres joueurs'])
    expect(sheets['Tirages']![0]).toEqual(['Tirage', 'Tour', 'Statut', 'Ordre', 'Poule', 'Affiche', 'Côté', 'Joueur', 'Tête de série'])

    expect(dataRows(sheets, 'Participants')).toHaveLength(liveMembers.length + 1)
    expect(dataRows(sheets, 'Poules')).toHaveLength(liveMembers.length)
    expect(dataRows(sheets, 'Matchs')).toHaveLength(live.matches.length)
    expect(dataRows(sheets, 'Tirages')).toHaveLength(liveMembers.length)
    expect(dataRows(sheets, 'Phases finales')).toHaveLength(0)
  })

  it('types the values: numbers as numbers, the held date as a date, text starting with = kept as text', async () => {
    const { sheets } = await readWorkbook(await download('2060'))
    const matches = dataRows(sheets, 'Matchs')
    expect(matches.every((row) => typeof row[2] === 'number')).toBe(true)
    const scored = matches.filter((row) => row[8] === 'Validé')
    expect(scored).toHaveLength(live.matches.length - PENDING_MATCHES)
    expect(scored.every((row) => row[4] === 5 && typeof row[6] === 'number')).toBe(true)
    expect(matches.filter((row) => row[8] === 'Sans score').every((row) => row[4] === null && row[6] === null)).toBe(true)
    expect(fieldOf(sheets, 'Nom')).toBe('Cup =SUM(1+1)')
    expect(fieldOf(sheets, 'Qualifiés par poule')).toBe(2)
    expect(fieldOf(sheets, 'Barrages')).toBe('Non')
    expect(fieldOf(sheets, 'Statut')).toBe('Phase de poules')

    const first = dataRows(sheets, 'Poules')[0]!
    expect(first.slice(0, 2)).toEqual([1, 1])
    expect(first.slice(3).every((cell) => typeof cell === 'number')).toBe(true)
    expect(dataRows(sheets, 'Participants').filter((row) => row[4] === 'Oui')).toHaveLength(1)
  })

  it('contains no email and no account data anywhere in the file, raw XML included', async () => {
    const { sheets, bytes } = await readWorkbook(await download('2060'))
    const decoder = new TextDecoder()
    const raw = Object.values(unzipSync(bytes)).map((file) => decoder.decode(file)).join('\n')
    const users = await dataSource.getRepository(UserEntity).find({ select: { email: true, passwordHash: true } })
    expect(users.length).toBeGreaterThan(0)
    for (const user of users) {
      expect(raw).not.toContain(user.email)
      expect(raw).not.toContain(user.passwordHash!)
    }
    expect(JSON.stringify(sheets)).not.toMatch(/@/)
    expect(sheets['Participants']![0]).not.toContain('Email')
  })

  it('exports an archive: champion, final with its score, closing date, frozen N', async () => {
    const response = await download('2010')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-disposition')).toContain('ccc-2010.xlsx')
    const { sheets } = await readWorkbook(response)
    expect(Object.keys(sheets)).toEqual(SHEETS)
    expect(fieldOf(sheets, 'Effectif N')).toBe(16)
    expect(fieldOf(sheets, 'Origine')).toBe('Archive')
    expect(fieldOf(sheets, 'Vainqueur')).toBe('Champion Archive')
    expect(fieldOf(sheets, 'Date')).toBeInstanceOf(Date)
    expect((fieldOf(sheets, 'Date') as Date).toISOString().slice(0, 10)).toBe('2010-06-12')
    expect(fieldOf(sheets, 'Date de clôture')).toBeInstanceOf(Date)

    const participants = dataRows(sheets, 'Participants')
    expect(participants).toHaveLength(2)
    expect(participants.map((row) => [row[5], row[6]])).toEqual(expect.arrayContaining([['Champion·ne', 16], ['Finaliste', 12]]))

    expect(dataRows(sheets, 'Matchs')).toHaveLength(1)
    const finalPhase = dataRows(sheets, 'Phases finales')
    expect(finalPhase[0]).toEqual(['Finale', 1, 'Champion Archive', 5, 'Finaliste Archive', 2, 'Champion Archive'])
    expect(finalPhase.at(-1)![0]).toBe('Vainqueur de l\'édition')
    expect(dataRows(sheets, 'Poules')).toHaveLength(0)
    expect(dataRows(sheets, 'Tirages')).toHaveLength(0)
  })
})
