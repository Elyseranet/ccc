import { EDITION_STATUS } from '#shared/enums/edition.enum'
import { MATCH_PURPOSE, MATCH_STATUS } from '#shared/enums/match.enum'
import { PARTICIPATION_STATUS } from '#shared/enums/participation.enum'
import { ROUND_KIND, ROUND_STATUS } from '#shared/enums/round.enum'
import type { IEditionParticipant, IEditionSummary } from '#shared/interfaces/api/edition.interface'
import type { IMatch } from '#shared/interfaces/api/match.interface'
import type { IPool } from '#shared/interfaces/api/pool.interface'
import type { IRound } from '#shared/interfaces/api/round.interface'
import { editionId } from '~/fixtures/edition-id.fixture'
import type { TEdition2026Body } from '~/types/edition-2026.type'

/*********************************************************
 * Fixtures de l'édition 2026
 *
 * @description
 * Édition en cours, partagée par plusieurs écrans (accueil, édition, tableau de bord admin, participants admin).
 * Deux états :
 *   - défaut (« poules en cours »), repris de index.html et admin.html : 45 participants, 8 poules, tour de poules à 68 matchs validés sur 105,
 *     4 derniers scores validés ;
 *   - scénario `?fixture=registration` (dev et test seulement), repris de admin-participants.html : inscriptions ouvertes, 44 inscrits, aucun tirage.
 * NOT_IN_MOCKUP : seuls 8 des 44 inscrits sont lisibles dans admin-participants.html. Les autres joueurs sont ceux de l'édition 2025
 * (données d'illustration, comme le reste des maquettes). Les identifiants de Manon Faure et d'Anna Chevalier n'existent pas dans
 * competitor.fixture.ts : ils sont fabriqués ici (901 et 902) et ne mènent à aucune fiche tant que l'API réelle n'est pas branchée.
 * Les compteurs `unknownResultMatchCount` valent 0 : aucun résultat inconnu sur une édition jouée dans l'application.
 ********************************************************/
const EDITION_2026_CODE = '2026'

const POOL_COUNT = 8

const POOL_MATCH_COUNT = 105

const POOL_VALIDATED_COUNT = 68

const POOLS_PLAYING_PARTICIPANT_COUNT = 45

const REGISTRATION_PARTICIPANT_COUNT = 44

const competitorId = (rank: number): string => `00000000-0000-4000-0001-${String(rank).padStart(12, '0')}`

const participationId = (rank: number): string => `00000000-0000-4000-0003-${String(rank).padStart(12, '0')}`

const participantId = (index: number): string => participationId(2600 + index)

const matchId = (rank: number): string => `00000000-0000-4000-0009-${String(rank).padStart(12, '0')}`

const poolId = (rank: number): string => `00000000-0000-4000-0008-${String(rank).padStart(12, '0')}`

interface IFixtureSide {
  id: number
  name: string
  score: number
}

const validated = (sequence: number, poolRank: number, winner: IFixtureSide, loser: IFixtureSide): IMatch => ({
  id: matchId(sequence),
  sequence,
  roundKind: ROUND_KIND.POOLS,
  poolRank,
  purpose: MATCH_PURPOSE.REGULAR,
  targetScore: winner.score,
  status: MATCH_STATUS.VALIDATED,
  sides: [
    { participationId: participationId(winner.id), competitorId: competitorId(winner.id), displayName: winner.name, score: winner.score },
    { participationId: participationId(loser.id), competitorId: competitorId(loser.id), displayName: loser.name, score: loser.score }
  ],
  winnerParticipationId: participationId(winner.id)
})

export const EDITION_2026_ROUNDS: IRound[] = [
  {
    id: '00000000-0000-4000-0007-000000000026',
    kind: ROUND_KIND.POOLS,
    sequence: 1,
    status: ROUND_STATUS.PLAYING,
    matchCount: POOL_MATCH_COUNT,
    validatedMatchCount: POOL_VALIDATED_COUNT
  }
]

export const EDITION_2026_POOLS: IPool[] = Array.from({ length: POOL_COUNT }, (_, index) => ({ id: poolId(index + 1), rank: index + 1, standing: [] }))

export const EDITION_2026_LATEST_MATCHES: IMatch[] = [
  validated(68, 4, { id: 901, name: 'Manon Faure', score: 5 }, { id: 73, name: 'Théo Gauthier', score: 4 }),
  validated(67, 2, { id: 56, name: 'Côme Michel', score: 5 }, { id: 67, name: 'Mila Lambert', score: 3 }),
  validated(66, 1, { id: 41, name: 'Maya Bonnet', score: 5 }, { id: 65, name: 'Maël Faure', score: 3 }),
  validated(65, 5, { id: 902, name: 'Anna Chevalier', score: 5 }, { id: 32, name: 'Lisa André', score: 2 })
]

export const isEdition2026 = (id: string): boolean => id === editionId(EDITION_2026_CODE)

const registeredParticipants = (template: IEditionParticipant[], count: number): IEditionParticipant[] =>
  template.slice(0, count).map((participant, index) => ({
    ...participant,
    participationId: participantId(index + 1),
    poolId: null,
    isSeed: false,
    seedRank: null,
    status: PARTICIPATION_STATUS.REGISTERED,
    finalStage: null,
    points: null,
    poolRank: null
  }))

const playingParticipants = (template: IEditionParticipant[]): IEditionParticipant[] =>
  registeredParticipants(template, POOLS_PLAYING_PARTICIPANT_COUNT).map((participant, index) => ({
    ...participant,
    poolId: poolId((index % POOL_COUNT) + 1),
    isSeed: index < POOL_COUNT,
    seedRank: index < POOL_COUNT ? index + 1 : null,
    status: PARTICIPATION_STATUS.IN_POOL
  }))

export const edition2026PoolsPlaying = (template: IEditionParticipant[]): TEdition2026Body => ({
  participants: playingParticipants(template),
  pools: EDITION_2026_POOLS,
  rounds: EDITION_2026_ROUNDS,
  matches: EDITION_2026_LATEST_MATCHES,
  draws: [],
  bracket: []
})

export const edition2026Registration = (template: IEditionParticipant[]): TEdition2026Body => ({
  participants: registeredParticipants(template, REGISTRATION_PARTICIPANT_COUNT),
  pools: [],
  rounds: [],
  matches: [],
  draws: [],
  bracket: []
})

export const edition2026RegistrationSummary = (summary: IEditionSummary): IEditionSummary => ({
  ...summary,
  status: EDITION_STATUS.REGISTRATION,
  participantCount: REGISTRATION_PARTICIPANT_COUNT,
  unidentifiedParticipantCount: 0,
  unknownResultMatchCount: 0,
  matchCount: 0,
  scoredMatchCount: 0
})
