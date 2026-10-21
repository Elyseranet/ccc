import { MATCH_PURPOSE, MATCH_STATUS } from '#shared/enums/match.enum'
import { ROUND_KIND } from '#shared/enums/round.enum'
import type { IAdminMatch } from '#shared/interfaces/api/admin-match.interface'
import type { IFixtureSet } from '~/interfaces/fixture.interface'

/*********************************************************
 * Fixtures file admin des scores
 *
 * @description
 * Source : admin-matchs.html (édition 2026, 6 cartes de la file « à traiter »).
 * Le score public reste null tant que le match n'est pas validé : seul `recordedScore` est renseigné.
 ********************************************************/
const RECORDED_AT = '2026-06-13T20:30:00.000Z'

export const adminMatchesFixture = (_editionId: string): IFixtureSet<IAdminMatch[]> => ({
  default: [
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
],
  empty: []
})
