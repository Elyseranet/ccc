import { MATCH_PURPOSE, MATCH_STATUS } from '../../enums/match.enum.js'
import { ROUND_KIND } from '../../enums/round.enum.js'
import type { IAdminMatch } from '../../interfaces/admin-match.interface.js'
import type { IFixtureSet } from '../../interfaces/fixture.interface.js'

/*********************************************************
 * Fixtures file admin des scores
 *
 * @description
 * Source : admin-matchs.html (édition 2026). Les 6 cartes de la maquette (69, 70, 71, 72, 76, 77) ouvrent la file « à traiter » (ordre de rang) ;
 * les autres matchs complètent les compteurs de la maquette : à traiter 37 = saisis 7 + sans score 30, validés 68, soit 105 matchs de poule.
 * Le score public reste null tant que le match n'est pas validé : seul `recordedScore` est renseigné.
 ********************************************************/
const RECORDED_AT = '2026-06-13T20:30:00.000Z'

const MOCKUP_MATCHES: IAdminMatch[] = [
  {
    "id": "00000000-0000-4000-0009-000000000069",
    "sequence": 69,
    "roundKind": ROUND_KIND.POOLS,
    "poolRank": 2,
    "purpose": MATCH_PURPOSE.REGULAR,
    "targetScore": 5,
    "status": MATCH_STATUS.RECORDED,
    "sides": [
      {
        "participationId": "00000000-0000-4000-0010-000000000001",
        "competitorId": "00000000-0000-4000-0001-000000000017",
        "displayName": "Clara Lambert",
        "score": null,
        "recordedScore": 5
      },
      {
        "participationId": "00000000-0000-4000-0010-000000000002",
        "competitorId": "00000000-0000-4000-0001-000000000076",
        "displayName": "Paul Girard",
        "score": null,
        "recordedScore": 1
      }
    ],
    "winnerParticipationId": null,
    "comment": null,
    "version": 1,
    "recordedAt": RECORDED_AT,
    "validatedAt": null,
    "validatedBy": null
  },
  {
    "id": "00000000-0000-4000-0009-000000000070",
    "sequence": 70,
    "roundKind": ROUND_KIND.POOLS,
    "poolRank": 3,
    "purpose": MATCH_PURPOSE.REGULAR,
    "targetScore": 5,
    "status": MATCH_STATUS.RECORDED,
    "sides": [
      {
        "participationId": "00000000-0000-4000-0010-000000000003",
        "competitorId": "00000000-0000-4000-0001-000000000009",
        "displayName": "Sam Dupont",
        "score": null,
        "recordedScore": 1
      },
      {
        "participationId": "00000000-0000-4000-0010-000000000004",
        "competitorId": "00000000-0000-4000-0001-000000000048",
        "displayName": "Lisa Meyer",
        "score": null,
        "recordedScore": 5
      }
    ],
    "winnerParticipationId": null,
    "comment": null,
    "version": 1,
    "recordedAt": RECORDED_AT,
    "validatedAt": null,
    "validatedBy": null
  },
  {
    "id": "00000000-0000-4000-0009-000000000071",
    "sequence": 71,
    "roundKind": ROUND_KIND.POOLS,
    "poolRank": 2,
    "purpose": MATCH_PURPOSE.REGULAR,
    "targetScore": 5,
    "status": MATCH_STATUS.RECORDED,
    "sides": [
      {
        "participationId": "00000000-0000-4000-0010-000000000005",
        "competitorId": "00000000-0000-4000-0001-000000000076",
        "displayName": "Paul Girard",
        "score": null,
        "recordedScore": 5
      },
      {
        "participationId": "00000000-0000-4000-0010-000000000006",
        "competitorId": "00000000-0000-4000-0001-000000000067",
        "displayName": "Mila Lambert",
        "score": null,
        "recordedScore": 1
      }
    ],
    "winnerParticipationId": null,
    "comment": null,
    "version": 1,
    "recordedAt": RECORDED_AT,
    "validatedAt": null,
    "validatedBy": null
  },
  {
    "id": "00000000-0000-4000-0009-000000000072",
    "sequence": 72,
    "roundKind": ROUND_KIND.POOLS,
    "poolRank": 1,
    "purpose": MATCH_PURPOSE.REGULAR,
    "targetScore": 5,
    "status": MATCH_STATUS.RECORDED,
    "sides": [
      {
        "participationId": "00000000-0000-4000-0010-000000000007",
        "competitorId": "00000000-0000-4000-0001-000000000055",
        "displayName": "Côme Duval",
        "score": null,
        "recordedScore": 3
      },
      {
        "participationId": "00000000-0000-4000-0010-000000000008",
        "competitorId": "00000000-0000-4000-0001-000000000041",
        "displayName": "Maya Bonnet",
        "score": null,
        "recordedScore": 5
      }
    ],
    "winnerParticipationId": null,
    "comment": null,
    "version": 1,
    "recordedAt": RECORDED_AT,
    "validatedAt": null,
    "validatedBy": null
  },
  {
    "id": "00000000-0000-4000-0009-000000000076",
    "sequence": 76,
    "roundKind": ROUND_KIND.POOLS,
    "poolRank": 4,
    "purpose": MATCH_PURPOSE.REGULAR,
    "targetScore": 5,
    "status": MATCH_STATUS.SCHEDULED,
    "sides": [
      {
        "participationId": "00000000-0000-4000-0010-000000000009",
        "competitorId": "00000000-0000-4000-0001-000000000073",
        "displayName": "Théo Gauthier",
        "score": null,
        "recordedScore": null
      },
      {
        "participationId": "00000000-0000-4000-0010-000000000010",
        "competitorId": "00000000-0000-4000-0001-000000000059",
        "displayName": "Eva Michel",
        "score": null,
        "recordedScore": null
      }
    ],
    "winnerParticipationId": null,
    "comment": null,
    "version": 1,
    "recordedAt": null,
    "validatedAt": null,
    "validatedBy": null
  },
  {
    "id": "00000000-0000-4000-0009-000000000077",
    "sequence": 77,
    "roundKind": ROUND_KIND.POOLS,
    "poolRank": 8,
    "purpose": MATCH_PURPOSE.REGULAR,
    "targetScore": 5,
    "status": MATCH_STATUS.SCHEDULED,
    "sides": [
      {
        "participationId": "00000000-0000-4000-0010-000000000011",
        "competitorId": "00000000-0000-4000-0001-000000000022",
        "displayName": "Lina Mercier",
        "score": null,
        "recordedScore": null
      },
      {
        "participationId": "00000000-0000-4000-0010-000000000012",
        "competitorId": "00000000-0000-4000-0001-000000000057",
        "displayName": "Eliott Laurent",
        "score": null,
        "recordedScore": null
      }
    ],
    "winnerParticipationId": null,
    "comment": null,
    "version": 1,
    "recordedAt": null,
    "validatedAt": null,
    "validatedBy": null
  }
]

const PLAYER_NAMES = ['Alice Roux', 'Bastien Faure', 'Camille Noël', 'David Lemaire', 'Emma Perrin', 'Félix Marchand', 'Gaëlle Blanc', 'Hugo Rey', 'Inès Colin', 'Jules Vidal', 'Karim Aubert', 'Léa Garnier', 'Marc Dumont', 'Nina Lopez', 'Oscar Henry', 'Pauline Roche']
const POOL_COUNT = 8
const LAST_SEQUENCE = 105

const sequenceId = (sequence: number): string => `00000000-0000-4000-0009-${String(sequence).padStart(12, '0')}`
const participationId = (sequence: number, side: number): string => `00000000-0000-4000-0010-${String(sequence * 2 + side).padStart(12, '0')}`
const competitorId = (seed: number): string => `00000000-0000-4000-0001-${String(seed).padStart(12, '0')}`

const generatedMatch = (sequence: number, status: MATCH_STATUS): IAdminMatch => {
  const first = sequence % PLAYER_NAMES.length
  const second = (sequence * 5 + 3) % PLAYER_NAMES.length === first ? (first + 1) % PLAYER_NAMES.length : (sequence * 5 + 3) % PLAYER_NAMES.length
  const firstWins = sequence % 2 === 0
  const loserScore = sequence % 5
  const scores = firstWins ? [5, loserScore] : [loserScore, 5]
  const hasScore = status !== MATCH_STATUS.SCHEDULED
  const isValidated = status === MATCH_STATUS.VALIDATED
  return {
    id: sequenceId(sequence),
    sequence,
    roundKind: ROUND_KIND.POOLS,
    poolRank: (sequence % POOL_COUNT) + 1,
    purpose: MATCH_PURPOSE.REGULAR,
    targetScore: 5,
    status,
    sides: [first, second].map((player, side) => ({
      participationId: participationId(sequence, side),
      competitorId: competitorId(player + 100),
      displayName: PLAYER_NAMES[player]!,
      score: isValidated ? scores[side]! : null,
      recordedScore: hasScore ? scores[side]! : null
    })),
    winnerParticipationId: isValidated ? participationId(sequence, firstWins ? 0 : 1) : null,
    comment: null,
    version: 1,
    recordedAt: hasScore ? RECORDED_AT : null,
    validatedAt: isValidated ? RECORDED_AT : null,
    validatedBy: isValidated ? { id: '00000000-0000-4000-0003-000000000001', displayName: 'Administrateur' } : null
  }
}

const sequences = (from: number, to: number): number[] => Array.from({ length: to - from + 1 }, (_value, index) => from + index)

const RECORDED_EXTRA_SEQUENCES = [78, 79, 80]

const SCHEDULED_EXTRA_SEQUENCES = [73, 74, 75, ...sequences(81, LAST_SEQUENCE)]

const ALL_MATCHES: IAdminMatch[] = [
  ...sequences(1, 68).map(sequence => generatedMatch(sequence, MATCH_STATUS.VALIDATED)),
  ...MOCKUP_MATCHES.filter(match => match.sequence <= 72),
  ...SCHEDULED_EXTRA_SEQUENCES.filter(sequence => sequence < 76).map(sequence => generatedMatch(sequence, MATCH_STATUS.SCHEDULED)),
  ...MOCKUP_MATCHES.filter(match => match.sequence > 72),
  ...RECORDED_EXTRA_SEQUENCES.map(sequence => generatedMatch(sequence, MATCH_STATUS.RECORDED)),
  ...SCHEDULED_EXTRA_SEQUENCES.filter(sequence => sequence > 80).map(sequence => generatedMatch(sequence, MATCH_STATUS.SCHEDULED))
]

export const ADMIN_MATCHES_2026_FIXTURE: IFixtureSet<IAdminMatch[]> = {
  default: ALL_MATCHES,
  empty: []
}

export const ADMIN_MATCHES_ARCHIVE_FIXTURE: IFixtureSet<IAdminMatch[]> = {
  default: ALL_MATCHES.filter(match => match.status === MATCH_STATUS.VALIDATED),
  empty: []
}
