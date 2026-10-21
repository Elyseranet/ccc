import { describe, expect, it } from 'vitest'
import { COMPETITOR_ALIAS_SOURCE } from '../../../shared/enums/competitor.enum'
import { MATCH_STATUS } from '../../../shared/enums/match.enum'
import { FINAL_STAGE, PARTICIPATION_STATUS } from '../../../shared/enums/participation.enum'
import { ROUND_KIND } from '../../../shared/enums/round.enum'
import { LEGACY_ANOMALY_CODE, LEGACY_IMPORT_ERROR_CODE } from '../../../server/enums/legacy-import.enum'
import { LegacyImportError } from '../../../server/utils/legacy/legacy-import-error.util'
import { parseLegacyWorkbook } from '../../../server/utils/legacy/legacy-workbook-parser.util'
import { buildPlan, dataRows, identityMap, scoresRows } from './legacy-import.fixture'

const plan = buildPlan()

const importError = (action: () => unknown): LegacyImportError => {
  try {
    action()
  } catch (error) {
    if (error instanceof LegacyImportError) {
      return error
    }
    throw error
  }
  throw new Error('Aucune erreur levée')
}

describe('parseLegacyWorkbook : comptes (ticket B-04)', () => {
  it('lit 16 éditions, 145 joueurs Data et crée « Marion Cobra »', () => {
    expect(plan.editions).toHaveLength(16)
    expect(plan.editions.map((edition) => edition.code)).toEqual([
      '2012a', '2012b', '2013', '2014', '2015', '2016', '2017', '2018',
      '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026',
    ])
    expect(plan.players).toHaveLength(145)
    expect(plan.competitors).toHaveLength(146)
    expect(plan.competitors.at(-1)?.displayName).toBe('Marion Cobra')
  })

  it('importe 729 matchs (554 VALIDATED, 175 RESULT_UNKNOWN) et ignore les 685 gabarits vides (A16)', () => {
    expect(plan.matches).toHaveLength(729)
    expect(plan.matches.filter((match) => match.status === MATCH_STATUS.VALIDATED)).toHaveLength(554)
    expect(plan.matches.filter((match) => match.status === MATCH_STATUS.RESULT_UNKNOWN)).toHaveLength(175)
    expect(plan.sourceCounts).toMatchObject({ editionHeaders: 16, matchRowsRead: 1414, matchRowsTemplate: 685 })
  })

  it('un match sans score n invente aucun score', () => {
    const unknown = plan.matches.filter((match) => match.status === MATCH_STATUS.RESULT_UNKNOWN)
    expect(unknown.every((match) => match.sides.every((side) => side.score === null))).toBe(true)
  })

  it('cible 5 en poule et 10 en phase finale, Barrages compris', () => {
    for (const match of plan.matches) {
      expect(match.targetScore).toBe(match.roundKind === ROUND_KIND.POOLS ? 5 : 10)
    }
    const playoff = plan.matches.filter((match) => match.roundKind === ROUND_KIND.PLAYOFF)
    expect(playoff).toHaveLength(8)
    expect(new Set(playoff.map((match) => match.editionCode))).toEqual(new Set(['2024']))
  })

  it('les côtés suivent la position source (Adv1 = 1, Adv2 = 2)', () => {
    for (const match of plan.matches) {
      expect(match.sides.map((side) => side.position)).toEqual([1, 2])
    }
  })

  it('reprend le commentaire d édition (colonne H de l en-tête) sur 5 éditions (le ticket en annonçait 6 : la lecture du snapshot en donne 5)', () => {
    expect(plan.editions.filter((edition) => edition.comment !== null)).toHaveLength(5)
    expect(plan.editions.filter((edition) => edition.comment !== null).map((edition) => edition.code)).toEqual(['2012a', '2012b', '2013', '2016', '2022'])
    expect(plan.editions[0]?.comment).toBe('1ère édition #lhistoireestenmarche')
  })

  it('aucun prénom, nom ni surnom n est deviné', () => {
    expect(plan.competitors.every((competitor) => competitor.displayName === competitor.displayName.trim())).toBe(true)
    expect(Object.keys(plan.competitors[0]!)).toEqual(['key', 'displayName', 'aliases'])
  })
})

describe('parseLegacyWorkbook : anomalies du ticket', () => {
  it('A6 : 2012a et 2012b gardent N = 16 avec 11 participations, écart de 5 signalé', () => {
    for (const code of ['2012a', '2012b']) {
      expect(plan.editions.find((edition) => edition.code === code)?.participantCount).toBe(16)
      expect(plan.participations.filter((participation) => participation.editionCode === code)).toHaveLength(11)
      const anomaly = plan.anomalies.find(
        (entry) => entry.code === LEGACY_ANOMALY_CODE.UNIDENTIFIED_PARTICIPANTS && entry.editionCode === code,
      )
      expect(anomaly?.values).toEqual({ declared: 16, listed: 11, unidentified: 5 })
    }
    expect(
      plan.anomalies.filter((entry) => entry.code === LEGACY_ANOMALY_CODE.UNIDENTIFIED_PARTICIPANTS),
    ).toHaveLength(2)
  })

  it('A7 : Simon Legoupil et Alan Denoyelle gardent 5,76 en 2017, signalé hors barème', () => {
    for (const name of ['Simon Legoupil', 'Alan Denoyelle']) {
      const participation = plan.participations.find(
        (entry) => entry.editionCode === '2017' && entry.competitorKey === name,
      )
      expect(participation?.points).toBe(5.76)
      expect(participation?.finalStage).toBe(FINAL_STAGE.SEMI)
    }
    const offScale = plan.anomalies.filter((entry) => entry.code === LEGACY_ANOMALY_CODE.POINTS_OFF_SCALE)
    expect(offScale.map((entry) => entry.competitor).sort()).toEqual(['Alan Denoyelle', 'Simon Legoupil'])
    expect(offScale.every((entry) => entry.values.rg2Points === 6.48)).toBe(true)
  })

  it('les cas « joue sans cellule » restent en issue inconnue après fusion des alias', () => {
    const unknown = plan.participations.filter((participation) => participation.points === null)
    expect(unknown.map((entry) => `${entry.editionCode} ${entry.competitorKey}`).sort()).toEqual([
      '2016 Marion Pallier',
      '2017 Eleonore Deseine',
      '2017 Marie-Lyne Gallais',
      '2017 Marion Cobra',
    ])
    expect(unknown.every((entry) => entry.finalStage === null)).toBe(true)
    expect(unknown.every((entry) => entry.status === PARTICIPATION_STATUS.ELIMINATED)).toBe(true)
    expect(plan.participations.some((entry) => entry.status === PARTICIPATION_STATUS.REGISTERED)).toBe(false)
  })

  it('une cellule 0 devient POOL_ELIMINATED et le barème inverse retrouve chaque stade', () => {
    const stages = new Set(plan.participations.map((participation) => participation.finalStage))
    expect(stages).toContain(FINAL_STAGE.POOL_ELIMINATED)
    expect(stages).toContain(FINAL_STAGE.PLAYOFF)
    expect(stages).toContain(FINAL_STAGE.CHAMPION)
    expect(plan.participations.filter((entry) => entry.finalStage === FINAL_STAGE.CHAMPION)).toHaveLength(16)
  })
})

describe('parseLegacyWorkbook : identités (A5)', () => {
  const aliasesOf = (key: string) => plan.competitors.find((competitor) => competitor.key === key)?.aliases

  it('Vincent K/Vern et Vincent K/vern sont deux alias exacts du même compétiteur', () => {
    expect(aliasesOf('Vincent K/vern')).toEqual([
      { alias: 'Vincent K/vern', source: COMPETITOR_ALIAS_SOURCE.LEGACY_DATA },
      { alias: 'Vincent K/Vern', source: COMPETITOR_ALIAS_SOURCE.LEGACY_SCORES },
    ])
    expect(plan.competitors.find((competitor) => competitor.key === 'Vincent K/vern')?.displayName).toBe('Vincent K/vern')
  })

  it('l alias reprend la graphie exacte de Data, espace final compris, et display_name la rogne', () => {
    expect(aliasesOf('Remi Bastien ')?.map((entry) => entry.alias)).toEqual(['Remi Bastien ', 'Rémi Bastien'])
    expect(plan.competitors.find((competitor) => competitor.key === 'Remi Bastien ')?.displayName).toBe('Remi Bastien')
  })

  it('refuse l import si une graphie n a pas de correspondance, sans rien produire', () => {
    const map = identityMap().filter((entry) => entry.alias !== 'Marion Cobra')
    const error = importError(() => buildPlan(map))
    expect(error.code).toBe(LEGACY_IMPORT_ERROR_CODE.UNRESOLVED_ALIAS)
    expect(error.details).toEqual(['« Marion Cobra »'])
  })

  it('refuse une correspondance qui ne diffère que par la casse : jamais de rapprochement insensible à la casse', () => {
    const map = identityMap().map((entry) =>
      entry.alias === 'Vincent K/Vern' ? { ...entry, alias: 'vincent k/vern' } : entry,
    )
    const error = importError(() => buildPlan(map))
    expect(error.code).toBe(LEGACY_IMPORT_ERROR_CODE.UNRESOLVED_ALIAS)
    expect(error.details).toEqual(['« Vincent K/Vern »'])
  })

  it('liste toutes les graphies manquantes, pas seulement la première', () => {
    const error = importError(() => buildPlan([]))
    expect(error.details).toHaveLength(13)
  })

  it('refuse un fichier de correspondance dont la cible est absente de Data', () => {
    const map = identityMap().map((entry) =>
      'competitor' in entry && entry.alias === 'Andrea Busetto' ? { ...entry, competitor: 'andréa busetto' } : entry,
    )
    expect(importError(() => buildPlan(map)).code).toBe(LEGACY_IMPORT_ERROR_CODE.IDENTITY_MAP_INVALID)
  })

  it('refuse une entrée qui n est ni fusion ni création, et une graphie déjà exacte dans Data', () => {
    const ambiguous = [...identityMap(), { alias: 'X' } as never]
    expect(importError(() => buildPlan(ambiguous)).code).toBe(LEGACY_IMPORT_ERROR_CODE.IDENTITY_MAP_INVALID)
    const useless = [...identityMap(), { alias: 'Arthur Vaur', create: true as const }]
    expect(importError(() => buildPlan(useless)).code).toBe(LEGACY_IMPORT_ERROR_CODE.IDENTITY_MAP_INVALID)
  })
})

describe('parseLegacyWorkbook : source incohérente', () => {
  it('refuse un score seul, un libellé de tour inconnu et un joueur contre lui-même', () => {
    const firstNamed = scoresRows().find((row) => row.values[3] !== null && typeof row.values[3] === 'number')!
    const patch = (values: Array<string | number | boolean | null>) =>
      scoresRows().map((row) => (row.rowNumber === firstNamed.rowNumber ? { ...row, values } : row))
    const run = (rows: ReturnType<typeof scoresRows>) =>
      parseLegacyWorkbook({ dataRows: dataRows(), scoresRows: rows, identityMap: identityMap() })

    const oneScore = [...firstNamed.values]
    oneScore[5] = null
    expect(importError(() => run(patch(oneScore))).code).toBe(LEGACY_IMPORT_ERROR_CODE.SOURCE_INVALID)

    const badLabel = [...firstNamed.values]
    badLabel[1] = 'Poulpe'
    expect(importError(() => run(patch(badLabel))).code).toBe(LEGACY_IMPORT_ERROR_CODE.SOURCE_INVALID)

    for (const label of ['constructor', '__proto__', 'toString']) {
      const proto = [...firstNamed.values]
      proto[1] = label
      const error = importError(() => run(patch(proto)))
      expect(error.code).toBe(LEGACY_IMPORT_ERROR_CODE.SOURCE_INVALID)
      expect(error.message).toContain('Libellé de tour inconnu')
    }

    const self = [...firstNamed.values]
    self[4] = self[2]!
    expect(importError(() => run(patch(self))).code).toBe(LEGACY_IMPORT_ERROR_CODE.SOURCE_INVALID)
  })
})

describe('parseLegacyWorkbook : forme du fichier de correspondance', () => {
  it.each([
    ['une clé en trop', { alias: 'Marion Cobra', create: true, extra: 1 }],
    ['un alias qui n est pas une chaîne', { alias: 42, create: true }],
    ['un alias vide', { alias: '', create: true }],
    ['un competitor qui n est pas une chaîne', { alias: 'Z', competitor: 3 }],
    ['create: false', { alias: 'Z', create: false }],
    ['competitor et create ensemble', { alias: 'Z', competitor: 'Arthur Vaur', create: true }],
    ['une entrée qui n est pas un objet', 'Marion Cobra'],
  ])('refuse %s', (_label, entry) => {
    const map = [...identityMap().filter((e) => e.alias !== 'Marion Cobra'), entry] as never
    expect(importError(() => buildPlan(map)).code).toBe(LEGACY_IMPORT_ERROR_CODE.IDENTITY_MAP_INVALID)
  })

  it('refuse un fichier qui n est pas un tableau', () => {
    expect(importError(() => buildPlan({ entries: [] } as never)).code).toBe(LEGACY_IMPORT_ERROR_CODE.IDENTITY_MAP_INVALID)
  })
})
