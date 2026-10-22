import { DRAW_KIND, DRAW_STATUS } from '#shared/enums/draw.enum'
import { EDITION_ORIGIN, EDITION_STATUS } from '#shared/enums/edition.enum'
import { MATCH_PURPOSE, MATCH_STATUS } from '#shared/enums/match.enum'
import { FINAL_STAGE, PARTICIPATION_STATUS } from '#shared/enums/participation.enum'
import { ROUND_KIND, ROUND_STATUS } from '#shared/enums/round.enum'
import type { IEditionDetail, IEditionSummary } from '#shared/interfaces/api/edition.interface'
import type { IMatch } from '#shared/interfaces/api/match.interface'
import type { IPaginated } from '#shared/interfaces/api/pagination.interface'
import type { IArchiveStats } from '#shared/interfaces/api/stats.interface'
import { editionId } from '~/fixtures/edition-id.fixture'
import { EDITION_2026_LATEST_MATCHES, edition2026PoolsPlaying, edition2026Registration, edition2026RegistrationSummary, isEdition2026 } from '~/fixtures/edition-2026.fixture'
import type { IFixtureSet } from '~/interfaces/fixture.interface'

/*********************************************************
 * Fixtures éditions
 *
 * @description
 * Source : maquettes Happy Hour (palmares.html, edition.html, index.html). Seule l'édition 2025 a un détail.
 * NOT_IN_MOCKUP : la maquette ne fournit pas cette valeur ; 0 explicite, à remplacer par l'API.
 * Les compteurs de matchs ne sont donnés que pour 2025 et 2026 ; le détail 2025 contient les 16 matchs de la page 1
 * de la maquette (sur 120) et les matchs du bracket.
 * STATS : A16 (729 matchs dont 554 avec score) ; le total de matchs affiché par la maquette est faux et n'est repris nulle part.
 ********************************************************/
const NOT_IN_MOCKUP = 0

const DRAWN_AT = '2025-06-14T18:00:00.000Z'

const poolId = (rank: number): string => `00000000-0000-4000-0008-${String(rank).padStart(12, '0')}`

export const STATS_FIXTURE: IFixtureSet<IArchiveStats> = {
  default: { editions: 16, competitors: 145, matches: 729, scoredMatches: 554, unknownResultMatches: 175 },
  empty: { editions: 0, competitors: 0, matches: 0, scoredMatches: 0, unknownResultMatches: 0 }
}

export const EDITIONS_FIXTURE: IFixtureSet<IEditionSummary[]> = {
  default: [
  {
    "id": editionId('2026'),
    "code": "2026",
    "year": 2026,
    "name": null,
    "heldOn": null,
    "location": null,
    "status": EDITION_STATUS.POOLS_PLAYING,
    "origin": EDITION_ORIGIN.APP,
    "participantCount": 45,
    "unidentifiedParticipantCount": 0,
    "unknownResultMatchCount": 0,
    "matchCount": 105,
    "scoredMatchCount": 68,
    "champion": null
  },
  {
    "id": editionId('2025'),
    "code": "2025",
    "year": 2025,
    "name": null,
    "heldOn": null,
    "location": null,
    "status": EDITION_STATUS.CLOSED,
    "origin": EDITION_ORIGIN.LEGACY_IMPORT,
    "participantCount": 45,
    "unidentifiedParticipantCount": 0,
    "unknownResultMatchCount": 0,
    "matchCount": 120,
    "scoredMatchCount": 120,
    "champion": {
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000001",
        "displayName": "Lou Bernard",
        "firstName": "Lou",
        "lastName": "Bernard",
        "nickname": "La Mousse",
        "avatarUrl": null
      },
      "titlesToDate": 4
    }
  },
  {
    "id": editionId('2024'),
    "code": "2024",
    "year": 2024,
    "name": null,
    "heldOn": null,
    "location": null,
    "status": EDITION_STATUS.CLOSED,
    "origin": EDITION_ORIGIN.LEGACY_IMPORT,
    "participantCount": 47,
    "unidentifiedParticipantCount": 0,
    "unknownResultMatchCount": 0,
    "matchCount": NOT_IN_MOCKUP,
    "scoredMatchCount": NOT_IN_MOCKUP,
    "champion": {
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000003",
        "displayName": "Hugo Robin",
        "firstName": "Hugo",
        "lastName": "Robin",
        "nickname": null,
        "avatarUrl": null
      },
      "titlesToDate": 1
    }
  },
  {
    "id": editionId('2023'),
    "code": "2023",
    "year": 2023,
    "name": null,
    "heldOn": null,
    "location": null,
    "status": EDITION_STATUS.CLOSED,
    "origin": EDITION_ORIGIN.LEGACY_IMPORT,
    "participantCount": 49,
    "unidentifiedParticipantCount": 0,
    "unknownResultMatchCount": 0,
    "matchCount": NOT_IN_MOCKUP,
    "scoredMatchCount": NOT_IN_MOCKUP,
    "champion": {
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000005",
        "displayName": "Maya Legrand",
        "firstName": "Maya",
        "lastName": "Legrand",
        "nickname": null,
        "avatarUrl": null
      },
      "titlesToDate": 1
    }
  },
  {
    "id": editionId('2022'),
    "code": "2022",
    "year": 2022,
    "name": null,
    "heldOn": null,
    "location": null,
    "status": EDITION_STATUS.CLOSED,
    "origin": EDITION_ORIGIN.LEGACY_IMPORT,
    "participantCount": 46,
    "unidentifiedParticipantCount": 0,
    "unknownResultMatchCount": 0,
    "matchCount": NOT_IN_MOCKUP,
    "scoredMatchCount": NOT_IN_MOCKUP,
    "champion": {
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000007",
        "displayName": "Nina Perrin",
        "firstName": "Nina",
        "lastName": "Perrin",
        "nickname": null,
        "avatarUrl": null
      },
      "titlesToDate": 3
    }
  },
  {
    "id": editionId('2021'),
    "code": "2021",
    "year": 2021,
    "name": null,
    "heldOn": null,
    "location": null,
    "status": EDITION_STATUS.CLOSED,
    "origin": EDITION_ORIGIN.LEGACY_IMPORT,
    "participantCount": 44,
    "unidentifiedParticipantCount": 0,
    "unknownResultMatchCount": 0,
    "matchCount": NOT_IN_MOCKUP,
    "scoredMatchCount": NOT_IN_MOCKUP,
    "champion": {
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000001",
        "displayName": "Lou Bernard",
        "firstName": "Lou",
        "lastName": "Bernard",
        "nickname": "La Mousse",
        "avatarUrl": null
      },
      "titlesToDate": 4
    }
  },
  {
    "id": editionId('2020'),
    "code": "2020",
    "year": 2020,
    "name": null,
    "heldOn": null,
    "location": null,
    "status": EDITION_STATUS.CLOSED,
    "origin": EDITION_ORIGIN.LEGACY_IMPORT,
    "participantCount": 40,
    "unidentifiedParticipantCount": 0,
    "unknownResultMatchCount": 0,
    "matchCount": NOT_IN_MOCKUP,
    "scoredMatchCount": NOT_IN_MOCKUP,
    "champion": {
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000009",
        "displayName": "Sam Dupont",
        "firstName": "Sam",
        "lastName": "Dupont",
        "nickname": "Rebond",
        "avatarUrl": null
      },
      "titlesToDate": 1
    }
  },
  {
    "id": editionId('2019'),
    "code": "2019",
    "year": 2019,
    "name": null,
    "heldOn": null,
    "location": null,
    "status": EDITION_STATUS.CLOSED,
    "origin": EDITION_ORIGIN.LEGACY_IMPORT,
    "participantCount": 41,
    "unidentifiedParticipantCount": 0,
    "unknownResultMatchCount": 0,
    "matchCount": NOT_IN_MOCKUP,
    "scoredMatchCount": NOT_IN_MOCKUP,
    "champion": {
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000007",
        "displayName": "Nina Perrin",
        "firstName": "Nina",
        "lastName": "Perrin",
        "nickname": null,
        "avatarUrl": null
      },
      "titlesToDate": 3
    }
  },
  {
    "id": editionId('2018'),
    "code": "2018",
    "year": 2018,
    "name": null,
    "heldOn": null,
    "location": null,
    "status": EDITION_STATUS.CLOSED,
    "origin": EDITION_ORIGIN.LEGACY_IMPORT,
    "participantCount": 38,
    "unidentifiedParticipantCount": 0,
    "unknownResultMatchCount": 0,
    "matchCount": NOT_IN_MOCKUP,
    "scoredMatchCount": NOT_IN_MOCKUP,
    "champion": {
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000011",
        "displayName": "Louise Garcia",
        "firstName": "Louise",
        "lastName": "Garcia",
        "nickname": null,
        "avatarUrl": null
      },
      "titlesToDate": 1
    }
  },
  {
    "id": editionId('2017'),
    "code": "2017",
    "year": 2017,
    "name": null,
    "heldOn": null,
    "location": null,
    "status": EDITION_STATUS.CLOSED,
    "origin": EDITION_ORIGIN.LEGACY_IMPORT,
    "participantCount": 36,
    "unidentifiedParticipantCount": 0,
    "unknownResultMatchCount": 0,
    "matchCount": NOT_IN_MOCKUP,
    "scoredMatchCount": NOT_IN_MOCKUP,
    "champion": {
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000007",
        "displayName": "Nina Perrin",
        "firstName": "Nina",
        "lastName": "Perrin",
        "nickname": null,
        "avatarUrl": null
      },
      "titlesToDate": 3
    }
  },
  {
    "id": editionId('2016'),
    "code": "2016",
    "year": 2016,
    "name": null,
    "heldOn": null,
    "location": null,
    "status": EDITION_STATUS.CLOSED,
    "origin": EDITION_ORIGIN.LEGACY_IMPORT,
    "participantCount": 30,
    "unidentifiedParticipantCount": 0,
    "unknownResultMatchCount": 0,
    "matchCount": NOT_IN_MOCKUP,
    "scoredMatchCount": NOT_IN_MOCKUP,
    "champion": {
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000001",
        "displayName": "Lou Bernard",
        "firstName": "Lou",
        "lastName": "Bernard",
        "nickname": "La Mousse",
        "avatarUrl": null
      },
      "titlesToDate": 4
    }
  },
  {
    "id": editionId('2015'),
    "code": "2015",
    "year": 2015,
    "name": null,
    "heldOn": null,
    "location": null,
    "status": EDITION_STATUS.CLOSED,
    "origin": EDITION_ORIGIN.LEGACY_IMPORT,
    "participantCount": 28,
    "unidentifiedParticipantCount": 0,
    "unknownResultMatchCount": 0,
    "matchCount": NOT_IN_MOCKUP,
    "scoredMatchCount": NOT_IN_MOCKUP,
    "champion": {
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000012",
        "displayName": "Simon Morel",
        "firstName": "Simon",
        "lastName": "Morel",
        "nickname": null,
        "avatarUrl": null
      },
      "titlesToDate": 1
    }
  },
  {
    "id": editionId('2014'),
    "code": "2014",
    "year": 2014,
    "name": null,
    "heldOn": null,
    "location": null,
    "status": EDITION_STATUS.CLOSED,
    "origin": EDITION_ORIGIN.LEGACY_IMPORT,
    "participantCount": 24,
    "unidentifiedParticipantCount": 0,
    "unknownResultMatchCount": 0,
    "matchCount": NOT_IN_MOCKUP,
    "scoredMatchCount": NOT_IN_MOCKUP,
    "champion": {
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000001",
        "displayName": "Lou Bernard",
        "firstName": "Lou",
        "lastName": "Bernard",
        "nickname": "La Mousse",
        "avatarUrl": null
      },
      "titlesToDate": 4
    }
  },
  {
    "id": editionId('2013'),
    "code": "2013",
    "year": 2013,
    "name": null,
    "heldOn": null,
    "location": null,
    "status": EDITION_STATUS.CLOSED,
    "origin": EDITION_ORIGIN.LEGACY_IMPORT,
    "participantCount": 20,
    "unidentifiedParticipantCount": 0,
    "unknownResultMatchCount": 0,
    "matchCount": NOT_IN_MOCKUP,
    "scoredMatchCount": NOT_IN_MOCKUP,
    "champion": {
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000015",
        "displayName": "Rose Lefèvre",
        "firstName": "Rose",
        "lastName": "Lefèvre",
        "nickname": null,
        "avatarUrl": null
      },
      "titlesToDate": 1
    }
  },
  {
    "id": editionId('2012b'),
    "code": "2012b",
    "year": 2012,
    "name": "2012 · 2e",
    "heldOn": null,
    "location": null,
    "status": EDITION_STATUS.CLOSED,
    "origin": EDITION_ORIGIN.LEGACY_IMPORT,
    "participantCount": 16,
    "unidentifiedParticipantCount": 0,
    "unknownResultMatchCount": 0,
    "matchCount": NOT_IN_MOCKUP,
    "scoredMatchCount": NOT_IN_MOCKUP,
    "champion": {
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000008",
        "displayName": "Sacha Legrand",
        "firstName": "Sacha",
        "lastName": "Legrand",
        "nickname": null,
        "avatarUrl": null
      },
      "titlesToDate": 1
    }
  },
  {
    "id": editionId('2012a'),
    "code": "2012a",
    "year": 2012,
    "name": "2012 · 1re",
    "heldOn": null,
    "location": null,
    "status": EDITION_STATUS.CLOSED,
    "origin": EDITION_ORIGIN.LEGACY_IMPORT,
    "participantCount": 16,
    "unidentifiedParticipantCount": 0,
    "unknownResultMatchCount": 0,
    "matchCount": NOT_IN_MOCKUP,
    "scoredMatchCount": NOT_IN_MOCKUP,
    "champion": {
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000002",
        "displayName": "Inès Perrin",
        "firstName": "Inès",
        "lastName": "Perrin",
        "nickname": null,
        "avatarUrl": null
      },
      "titlesToDate": 1
    }
  }
],
  empty: []
}

EDITIONS_FIXTURE.registration = EDITIONS_FIXTURE.default.map(item => isEdition2026(item.id) ? edition2026RegistrationSummary(item) : item)

const EDITION_2025: IEditionDetail = {
  "id": editionId('2025'),
  "code": "2025",
  "year": 2025,
  "name": null,
  "heldOn": null,
  "location": null,
  "status": EDITION_STATUS.CLOSED,
  "origin": EDITION_ORIGIN.LEGACY_IMPORT,
  "participantCount": 45,
  "unidentifiedParticipantCount": 0,
  "unknownResultMatchCount": 0,
  "matchCount": 120,
  "scoredMatchCount": 120,
  "champion": {
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000001",
      "displayName": "Lou Bernard",
      "firstName": "Lou",
      "lastName": "Bernard",
      "nickname": "La Mousse",
      "avatarUrl": null
    },
    "titlesToDate": 4
  },
  "description": null,
  "participants": [
    {
      "participationId": "00000000-0000-4000-0003-000000000001",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000049",
        "displayName": "Alice Vincent",
        "firstName": "Alice",
        "lastName": "Vincent",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(5),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000002",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000050",
        "displayName": "Arthur Martin",
        "firstName": "Arthur",
        "lastName": "Martin",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(2),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000003",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000051",
        "displayName": "Camille Morel",
        "firstName": "Camille",
        "lastName": "Morel",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(3),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.ROUND_OF_16,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000004",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000052",
        "displayName": "Charlie Fontaine",
        "firstName": "Charlie",
        "lastName": "Fontaine",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(4),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.ROUND_OF_16,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000005",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000053",
        "displayName": "Charlie Legrand",
        "firstName": "Charlie",
        "lastName": "Legrand",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(5),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.ROUND_OF_16,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000006",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000017",
        "displayName": "Clara Lambert",
        "firstName": "Clara",
        "lastName": "Lambert",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(4),
      "isSeed": true,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000007",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000024",
        "displayName": "Céleste Marie",
        "firstName": "Céleste",
        "lastName": "Marie",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(1),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000008",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000054",
        "displayName": "Céleste Moreau",
        "firstName": "Céleste",
        "lastName": "Moreau",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(8),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000009",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000055",
        "displayName": "Côme Duval",
        "firstName": "Côme",
        "lastName": "Duval",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(4),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000010",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000056",
        "displayName": "Côme Michel",
        "firstName": "Côme",
        "lastName": "Michel",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(4),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000011",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000023",
        "displayName": "Eliott Duval",
        "firstName": "Eliott",
        "lastName": "Duval",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(1),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.SEMI,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000012",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000057",
        "displayName": "Eliott Laurent",
        "firstName": "Eliott",
        "lastName": "Laurent",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(1),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000013",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000058",
        "displayName": "Elsa Marchand",
        "firstName": "Elsa",
        "lastName": "Marchand",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(8),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000014",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000059",
        "displayName": "Eva Michel",
        "firstName": "Eva",
        "lastName": "Michel",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(3),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000015",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000031",
        "displayName": "Gabriel André",
        "firstName": "Gabriel",
        "lastName": "André",
        "nickname": "Happy Hour",
        "avatarUrl": null
      },
      "poolId": poolId(5),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000016",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000027",
        "displayName": "Gabriel Denis",
        "firstName": "Gabriel",
        "lastName": "Denis",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(6),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.QUARTER,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000017",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000060",
        "displayName": "Hugo Laurent",
        "firstName": "Hugo",
        "lastName": "Laurent",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(4),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.ROUND_OF_16,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000018",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000002",
        "displayName": "Inès Perrin",
        "firstName": "Inès",
        "lastName": "Perrin",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(5),
      "isSeed": true,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.FINALIST,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000019",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000014",
        "displayName": "Iris Durand",
        "firstName": "Iris",
        "lastName": "Durand",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(7),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000020",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000061",
        "displayName": "Iris Guérin",
        "firstName": "Iris",
        "lastName": "Guérin",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(8),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.ROUND_OF_16,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000021",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000020",
        "displayName": "Julia Lambert",
        "firstName": "Julia",
        "lastName": "Lambert",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(7),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.QUARTER,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000022",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000022",
        "displayName": "Lina Mercier",
        "firstName": "Lina",
        "lastName": "Mercier",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(7),
      "isSeed": true,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000023",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000032",
        "displayName": "Lisa André",
        "firstName": "Lisa",
        "lastName": "André",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(6),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.ROUND_OF_16,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000024",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000062",
        "displayName": "Lisa Durand",
        "firstName": "Lisa",
        "lastName": "Durand",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(2),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000025",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000001",
        "displayName": "Lou Bernard",
        "firstName": "Lou",
        "lastName": "Bernard",
        "nickname": "La Mousse",
        "avatarUrl": null
      },
      "poolId": poolId(1),
      "isSeed": true,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.WINNER,
      "finalStage": FINAL_STAGE.CHAMPION,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000026",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000011",
        "displayName": "Louise Garcia",
        "firstName": "Louise",
        "lastName": "Garcia",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(7),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.QUARTER,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000027",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000028",
        "displayName": "Léa Noël",
        "firstName": "Léa",
        "lastName": "Noël",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(2),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000028",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000063",
        "displayName": "Manon Henry",
        "firstName": "Manon",
        "lastName": "Henry",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(1),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000029",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000026",
        "displayName": "Margaux Girard",
        "firstName": "Margaux",
        "lastName": "Girard",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(2),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.ROUND_OF_16,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000030",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000064",
        "displayName": "Maya Lemaire",
        "firstName": "Maya",
        "lastName": "Lemaire",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(3),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000031",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000065",
        "displayName": "Maël Faure",
        "firstName": "Maël",
        "lastName": "Faure",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(4),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000032",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000066",
        "displayName": "Maël Robert",
        "firstName": "Maël",
        "lastName": "Robert",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(3),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000033",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000067",
        "displayName": "Mila Lambert",
        "firstName": "Mila",
        "lastName": "Lambert",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(5),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000034",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000018",
        "displayName": "Mila Simon",
        "firstName": "Mila",
        "lastName": "Simon",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(8),
      "isSeed": true,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.SEMI,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000035",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000007",
        "displayName": "Nina Perrin",
        "firstName": "Nina",
        "lastName": "Perrin",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(3),
      "isSeed": true,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.QUARTER,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000036",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000019",
        "displayName": "Noah Dupont",
        "firstName": "Noah",
        "lastName": "Dupont",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(6),
      "isSeed": true,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000037",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000068",
        "displayName": "Robin Girard",
        "firstName": "Robin",
        "lastName": "Girard",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(3),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000038",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000069",
        "displayName": "Rose Marchand",
        "firstName": "Rose",
        "lastName": "Marchand",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(7),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000039",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000070",
        "displayName": "Salomé Guérin",
        "firstName": "Salomé",
        "lastName": "Guérin",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(6),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000040",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000071",
        "displayName": "Salomé Henry",
        "firstName": "Salomé",
        "lastName": "Henry",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(2),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.ROUND_OF_16,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000041",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000009",
        "displayName": "Sam Dupont",
        "firstName": "Sam",
        "lastName": "Dupont",
        "nickname": "Rebond",
        "avatarUrl": null
      },
      "poolId": poolId(2),
      "isSeed": true,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000042",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000072",
        "displayName": "Samuel François",
        "firstName": "Samuel",
        "lastName": "François",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(5),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000043",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000073",
        "displayName": "Théo Gauthier",
        "firstName": "Théo",
        "lastName": "Gauthier",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(1),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000044",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000074",
        "displayName": "Tom Robin",
        "firstName": "Tom",
        "lastName": "Robin",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(6),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": null,
      "poolRank": null
    },
    {
      "participationId": "00000000-0000-4000-0003-000000000045",
      "competitor": {
        "id": "00000000-0000-4000-0001-000000000075",
        "displayName": "Victor Marie",
        "firstName": "Victor",
        "lastName": "Marie",
        "nickname": null,
        "avatarUrl": null
      },
      "poolId": poolId(8),
      "isSeed": false,
      "seedRank": null,
      "status": PARTICIPATION_STATUS.ELIMINATED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": null,
      "poolRank": null
    }
  ],
  "pools": [
    {
      "id": poolId(1),
      "rank": 1,
      "standing": [
        {
          "rank": 1,
          "participationId": "00000000-0000-4000-0003-000000000025",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000001",
            "displayName": "Lou Bernard",
            "firstName": "Lou",
            "lastName": "Bernard",
            "nickname": "La Mousse",
            "avatarUrl": null
          },
          "isSeed": true,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 5,
          "losses": 0,
          "pointsFor": 25,
          "pointsAgainst": 15,
          "capsAverage": 10,
          "unknownResults": 0
        },
        {
          "rank": 2,
          "participationId": "00000000-0000-4000-0003-000000000011",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000023",
            "displayName": "Eliott Duval",
            "firstName": "Eliott",
            "lastName": "Duval",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 3,
          "losses": 2,
          "pointsFor": 22,
          "pointsAgainst": 15,
          "capsAverage": 7,
          "unknownResults": 0
        },
        {
          "rank": 3,
          "participationId": "00000000-0000-4000-0003-000000000028",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000063",
            "displayName": "Manon Henry",
            "firstName": "Manon",
            "lastName": "Henry",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 3,
          "losses": 2,
          "pointsFor": 20,
          "pointsAgainst": 17,
          "capsAverage": 3,
          "unknownResults": 0
        },
        {
          "rank": 4,
          "participationId": "00000000-0000-4000-0003-000000000043",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000073",
            "displayName": "Théo Gauthier",
            "firstName": "Théo",
            "lastName": "Gauthier",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 2,
          "losses": 3,
          "pointsFor": 21,
          "pointsAgainst": 18,
          "capsAverage": 3,
          "unknownResults": 0
        },
        {
          "rank": 5,
          "participationId": "00000000-0000-4000-0003-000000000007",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000024",
            "displayName": "Céleste Marie",
            "firstName": "Céleste",
            "lastName": "Marie",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 2,
          "losses": 3,
          "pointsFor": 16,
          "pointsAgainst": 21,
          "capsAverage": -5,
          "unknownResults": 0
        },
        {
          "rank": 6,
          "participationId": "00000000-0000-4000-0003-000000000012",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000057",
            "displayName": "Eliott Laurent",
            "firstName": "Eliott",
            "lastName": "Laurent",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 0,
          "losses": 5,
          "pointsFor": 7,
          "pointsAgainst": 25,
          "capsAverage": -18,
          "unknownResults": 0
        }
      ]
    },
    {
      "id": poolId(2),
      "rank": 2,
      "standing": [
        {
          "rank": 1,
          "participationId": "00000000-0000-4000-0003-000000000029",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000026",
            "displayName": "Margaux Girard",
            "firstName": "Margaux",
            "lastName": "Girard",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 5,
          "losses": 0,
          "pointsFor": 25,
          "pointsAgainst": 11,
          "capsAverage": 14,
          "unknownResults": 0
        },
        {
          "rank": 2,
          "participationId": "00000000-0000-4000-0003-000000000040",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000071",
            "displayName": "Salomé Henry",
            "firstName": "Salomé",
            "lastName": "Henry",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 4,
          "losses": 1,
          "pointsFor": 22,
          "pointsAgainst": 16,
          "capsAverage": 6,
          "unknownResults": 0
        },
        {
          "rank": 3,
          "participationId": "00000000-0000-4000-0003-000000000041",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000009",
            "displayName": "Sam Dupont",
            "firstName": "Sam",
            "lastName": "Dupont",
            "nickname": "Rebond",
            "avatarUrl": null
          },
          "isSeed": true,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 3,
          "losses": 2,
          "pointsFor": 20,
          "pointsAgainst": 20,
          "capsAverage": 0,
          "unknownResults": 0
        },
        {
          "rank": 4,
          "participationId": "00000000-0000-4000-0003-000000000027",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000028",
            "displayName": "Léa Noël",
            "firstName": "Léa",
            "lastName": "Noël",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 2,
          "losses": 3,
          "pointsFor": 19,
          "pointsAgainst": 20,
          "capsAverage": -1,
          "unknownResults": 0
        },
        {
          "rank": 5,
          "participationId": "00000000-0000-4000-0003-000000000024",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000062",
            "displayName": "Lisa Durand",
            "firstName": "Lisa",
            "lastName": "Durand",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 1,
          "losses": 4,
          "pointsFor": 16,
          "pointsAgainst": 23,
          "capsAverage": -7,
          "unknownResults": 0
        },
        {
          "rank": 6,
          "participationId": "00000000-0000-4000-0003-000000000002",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000050",
            "displayName": "Arthur Martin",
            "firstName": "Arthur",
            "lastName": "Martin",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 0,
          "losses": 5,
          "pointsFor": 13,
          "pointsAgainst": 25,
          "capsAverage": -12,
          "unknownResults": 0
        }
      ]
    },
    {
      "id": poolId(3),
      "rank": 3,
      "standing": [
        {
          "rank": 1,
          "participationId": "00000000-0000-4000-0003-000000000035",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000007",
            "displayName": "Nina Perrin",
            "firstName": "Nina",
            "lastName": "Perrin",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": true,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 5,
          "losses": 0,
          "pointsFor": 25,
          "pointsAgainst": 12,
          "capsAverage": 13,
          "unknownResults": 0
        },
        {
          "rank": 2,
          "participationId": "00000000-0000-4000-0003-000000000003",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000051",
            "displayName": "Camille Morel",
            "firstName": "Camille",
            "lastName": "Morel",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 4,
          "losses": 1,
          "pointsFor": 23,
          "pointsAgainst": 14,
          "capsAverage": 9,
          "unknownResults": 0
        },
        {
          "rank": 3,
          "participationId": "00000000-0000-4000-0003-000000000014",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000059",
            "displayName": "Eva Michel",
            "firstName": "Eva",
            "lastName": "Michel",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 3,
          "losses": 2,
          "pointsFor": 21,
          "pointsAgainst": 14,
          "capsAverage": 7,
          "unknownResults": 0
        },
        {
          "rank": 4,
          "participationId": "00000000-0000-4000-0003-000000000037",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000068",
            "displayName": "Robin Girard",
            "firstName": "Robin",
            "lastName": "Girard",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 2,
          "losses": 3,
          "pointsFor": 17,
          "pointsAgainst": 21,
          "capsAverage": -4,
          "unknownResults": 0
        },
        {
          "rank": 5,
          "participationId": "00000000-0000-4000-0003-000000000030",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000064",
            "displayName": "Maya Lemaire",
            "firstName": "Maya",
            "lastName": "Lemaire",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 1,
          "losses": 4,
          "pointsFor": 11,
          "pointsAgainst": 23,
          "capsAverage": -12,
          "unknownResults": 0
        },
        {
          "rank": 6,
          "participationId": "00000000-0000-4000-0003-000000000032",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000066",
            "displayName": "Maël Robert",
            "firstName": "Maël",
            "lastName": "Robert",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 0,
          "losses": 5,
          "pointsFor": 12,
          "pointsAgainst": 25,
          "capsAverage": -13,
          "unknownResults": 0
        }
      ]
    },
    {
      "id": poolId(4),
      "rank": 4,
      "standing": [
        {
          "rank": 1,
          "participationId": "00000000-0000-4000-0003-000000000004",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000052",
            "displayName": "Charlie Fontaine",
            "firstName": "Charlie",
            "lastName": "Fontaine",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 4,
          "losses": 1,
          "pointsFor": 20,
          "pointsAgainst": 16,
          "capsAverage": 4,
          "unknownResults": 0
        },
        {
          "rank": 2,
          "participationId": "00000000-0000-4000-0003-000000000017",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000060",
            "displayName": "Hugo Laurent",
            "firstName": "Hugo",
            "lastName": "Laurent",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 3,
          "losses": 2,
          "pointsFor": 21,
          "pointsAgainst": 15,
          "capsAverage": 6,
          "unknownResults": 0
        },
        {
          "rank": 3,
          "participationId": "00000000-0000-4000-0003-000000000010",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000056",
            "displayName": "Côme Michel",
            "firstName": "Côme",
            "lastName": "Michel",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 3,
          "losses": 2,
          "pointsFor": 20,
          "pointsAgainst": 17,
          "capsAverage": 3,
          "unknownResults": 0
        },
        {
          "rank": 4,
          "participationId": "00000000-0000-4000-0003-000000000031",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000065",
            "displayName": "Maël Faure",
            "firstName": "Maël",
            "lastName": "Faure",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 3,
          "losses": 2,
          "pointsFor": 19,
          "pointsAgainst": 20,
          "capsAverage": -1,
          "unknownResults": 0
        },
        {
          "rank": 5,
          "participationId": "00000000-0000-4000-0003-000000000009",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000055",
            "displayName": "Côme Duval",
            "firstName": "Côme",
            "lastName": "Duval",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 1,
          "losses": 4,
          "pointsFor": 18,
          "pointsAgainst": 22,
          "capsAverage": -4,
          "unknownResults": 0
        },
        {
          "rank": 6,
          "participationId": "00000000-0000-4000-0003-000000000006",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000017",
            "displayName": "Clara Lambert",
            "firstName": "Clara",
            "lastName": "Lambert",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": true,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 1,
          "losses": 4,
          "pointsFor": 15,
          "pointsAgainst": 23,
          "capsAverage": -8,
          "unknownResults": 0
        }
      ]
    },
    {
      "id": poolId(5),
      "rank": 5,
      "standing": [
        {
          "rank": 1,
          "participationId": "00000000-0000-4000-0003-000000000018",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000002",
            "displayName": "Inès Perrin",
            "firstName": "Inès",
            "lastName": "Perrin",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": true,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 5,
          "losses": 0,
          "pointsFor": 25,
          "pointsAgainst": 15,
          "capsAverage": 10,
          "unknownResults": 0
        },
        {
          "rank": 2,
          "participationId": "00000000-0000-4000-0003-000000000005",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000053",
            "displayName": "Charlie Legrand",
            "firstName": "Charlie",
            "lastName": "Legrand",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 4,
          "losses": 1,
          "pointsFor": 24,
          "pointsAgainst": 12,
          "capsAverage": 12,
          "unknownResults": 0
        },
        {
          "rank": 3,
          "participationId": "00000000-0000-4000-0003-000000000042",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000072",
            "displayName": "Samuel François",
            "firstName": "Samuel",
            "lastName": "François",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 2,
          "losses": 3,
          "pointsFor": 18,
          "pointsAgainst": 18,
          "capsAverage": 0,
          "unknownResults": 0
        },
        {
          "rank": 4,
          "participationId": "00000000-0000-4000-0003-000000000033",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000067",
            "displayName": "Mila Lambert",
            "firstName": "Mila",
            "lastName": "Lambert",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 2,
          "losses": 3,
          "pointsFor": 16,
          "pointsAgainst": 22,
          "capsAverage": -6,
          "unknownResults": 0
        },
        {
          "rank": 5,
          "participationId": "00000000-0000-4000-0003-000000000001",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000049",
            "displayName": "Alice Vincent",
            "firstName": "Alice",
            "lastName": "Vincent",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 1,
          "losses": 4,
          "pointsFor": 14,
          "pointsAgainst": 21,
          "capsAverage": -7,
          "unknownResults": 0
        },
        {
          "rank": 6,
          "participationId": "00000000-0000-4000-0003-000000000015",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000031",
            "displayName": "Gabriel André",
            "firstName": "Gabriel",
            "lastName": "André",
            "nickname": "Happy Hour",
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 5,
          "wins": 1,
          "losses": 4,
          "pointsFor": 14,
          "pointsAgainst": 23,
          "capsAverage": -9,
          "unknownResults": 0
        }
      ]
    },
    {
      "id": poolId(6),
      "rank": 6,
      "standing": [
        {
          "rank": 1,
          "participationId": "00000000-0000-4000-0003-000000000016",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000027",
            "displayName": "Gabriel Denis",
            "firstName": "Gabriel",
            "lastName": "Denis",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 4,
          "wins": 3,
          "losses": 1,
          "pointsFor": 18,
          "pointsAgainst": 10,
          "capsAverage": 8,
          "unknownResults": 0
        },
        {
          "rank": 2,
          "participationId": "00000000-0000-4000-0003-000000000023",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000032",
            "displayName": "Lisa André",
            "firstName": "Lisa",
            "lastName": "André",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 4,
          "wins": 3,
          "losses": 1,
          "pointsFor": 18,
          "pointsAgainst": 10,
          "capsAverage": 8,
          "unknownResults": 0
        },
        {
          "rank": 3,
          "participationId": "00000000-0000-4000-0003-000000000036",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000019",
            "displayName": "Noah Dupont",
            "firstName": "Noah",
            "lastName": "Dupont",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": true,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 4,
          "wins": 3,
          "losses": 1,
          "pointsFor": 17,
          "pointsAgainst": 10,
          "capsAverage": 7,
          "unknownResults": 0
        },
        {
          "rank": 4,
          "participationId": "00000000-0000-4000-0003-000000000039",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000070",
            "displayName": "Salomé Guérin",
            "firstName": "Salomé",
            "lastName": "Guérin",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 4,
          "wins": 1,
          "losses": 3,
          "pointsFor": 7,
          "pointsAgainst": 18,
          "capsAverage": -11,
          "unknownResults": 0
        },
        {
          "rank": 5,
          "participationId": "00000000-0000-4000-0003-000000000044",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000074",
            "displayName": "Tom Robin",
            "firstName": "Tom",
            "lastName": "Robin",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 4,
          "wins": 0,
          "losses": 4,
          "pointsFor": 8,
          "pointsAgainst": 20,
          "capsAverage": -12,
          "unknownResults": 0
        }
      ]
    },
    {
      "id": poolId(7),
      "rank": 7,
      "standing": [
        {
          "rank": 1,
          "participationId": "00000000-0000-4000-0003-000000000021",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000020",
            "displayName": "Julia Lambert",
            "firstName": "Julia",
            "lastName": "Lambert",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 4,
          "wins": 3,
          "losses": 1,
          "pointsFor": 17,
          "pointsAgainst": 9,
          "capsAverage": 8,
          "unknownResults": 0
        },
        {
          "rank": 2,
          "participationId": "00000000-0000-4000-0003-000000000026",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000011",
            "displayName": "Louise Garcia",
            "firstName": "Louise",
            "lastName": "Garcia",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 4,
          "wins": 3,
          "losses": 1,
          "pointsFor": 16,
          "pointsAgainst": 12,
          "capsAverage": 4,
          "unknownResults": 0
        },
        {
          "rank": 3,
          "participationId": "00000000-0000-4000-0003-000000000019",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000014",
            "displayName": "Iris Durand",
            "firstName": "Iris",
            "lastName": "Durand",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 4,
          "wins": 2,
          "losses": 2,
          "pointsFor": 12,
          "pointsAgainst": 12,
          "capsAverage": 0,
          "unknownResults": 0
        },
        {
          "rank": 4,
          "participationId": "00000000-0000-4000-0003-000000000038",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000069",
            "displayName": "Rose Marchand",
            "firstName": "Rose",
            "lastName": "Marchand",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 4,
          "wins": 1,
          "losses": 3,
          "pointsFor": 12,
          "pointsAgainst": 15,
          "capsAverage": -3,
          "unknownResults": 0
        },
        {
          "rank": 5,
          "participationId": "00000000-0000-4000-0003-000000000022",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000022",
            "displayName": "Lina Mercier",
            "firstName": "Lina",
            "lastName": "Mercier",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": true,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 4,
          "wins": 1,
          "losses": 3,
          "pointsFor": 10,
          "pointsAgainst": 19,
          "capsAverage": -9,
          "unknownResults": 0
        }
      ]
    },
    {
      "id": poolId(8),
      "rank": 8,
      "standing": [
        {
          "rank": 1,
          "participationId": "00000000-0000-4000-0003-000000000034",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000018",
            "displayName": "Mila Simon",
            "firstName": "Mila",
            "lastName": "Simon",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": true,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 4,
          "wins": 4,
          "losses": 0,
          "pointsFor": 20,
          "pointsAgainst": 11,
          "capsAverage": 9,
          "unknownResults": 0
        },
        {
          "rank": 2,
          "participationId": "00000000-0000-4000-0003-000000000020",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000061",
            "displayName": "Iris Guérin",
            "firstName": "Iris",
            "lastName": "Guérin",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 4,
          "wins": 3,
          "losses": 1,
          "pointsFor": 18,
          "pointsAgainst": 9,
          "capsAverage": 9,
          "unknownResults": 0
        },
        {
          "rank": 3,
          "participationId": "00000000-0000-4000-0003-000000000008",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000054",
            "displayName": "Céleste Moreau",
            "firstName": "Céleste",
            "lastName": "Moreau",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 4,
          "wins": 2,
          "losses": 2,
          "pointsFor": 13,
          "pointsAgainst": 18,
          "capsAverage": -5,
          "unknownResults": 0
        },
        {
          "rank": 4,
          "participationId": "00000000-0000-4000-0003-000000000013",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000058",
            "displayName": "Elsa Marchand",
            "firstName": "Elsa",
            "lastName": "Marchand",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 4,
          "wins": 1,
          "losses": 3,
          "pointsFor": 16,
          "pointsAgainst": 16,
          "capsAverage": 0,
          "unknownResults": 0
        },
        {
          "rank": 5,
          "participationId": "00000000-0000-4000-0003-000000000045",
          "competitor": {
            "id": "00000000-0000-4000-0001-000000000075",
            "displayName": "Victor Marie",
            "firstName": "Victor",
            "lastName": "Marie",
            "nickname": null,
            "avatarUrl": null
          },
          "isSeed": false,
          "participationStatus": PARTICIPATION_STATUS.ELIMINATED,
          "played": 4,
          "wins": 0,
          "losses": 4,
          "pointsFor": 7,
          "pointsAgainst": 20,
          "capsAverage": -13,
          "unknownResults": 0
        }
      ]
    }
  ],
  "rounds": [
    {
      "id": "00000000-0000-4000-0007-000000000001",
      "kind": ROUND_KIND.POOLS,
      "sequence": 1,
      "status": ROUND_STATUS.COMPLETED,
      "matchCount": 105,
      "validatedMatchCount": 105
    },
    {
      "id": "00000000-0000-4000-0007-000000000002",
      "kind": ROUND_KIND.ROUND_OF_16,
      "sequence": 2,
      "status": ROUND_STATUS.COMPLETED,
      "matchCount": 8,
      "validatedMatchCount": 8
    },
    {
      "id": "00000000-0000-4000-0007-000000000003",
      "kind": ROUND_KIND.QUARTER,
      "sequence": 3,
      "status": ROUND_STATUS.COMPLETED,
      "matchCount": 4,
      "validatedMatchCount": 4
    },
    {
      "id": "00000000-0000-4000-0007-000000000004",
      "kind": ROUND_KIND.FINAL,
      "sequence": 4,
      "status": ROUND_STATUS.COMPLETED,
      "matchCount": 2,
      "validatedMatchCount": 2
    },
    {
      "id": "00000000-0000-4000-0007-000000000005",
      "kind": ROUND_KIND.FINAL,
      "sequence": 5,
      "status": ROUND_STATUS.COMPLETED,
      "matchCount": 1,
      "validatedMatchCount": 1
    }
  ],
  "matches": [
    {
      "id": "00000000-0000-4000-0004-000000000120",
      "sequence": 120,
      "roundKind": ROUND_KIND.FINAL,
      "poolRank": null,
      "purpose": MATCH_PURPOSE.REGULAR,
      "targetScore": 10,
      "status": MATCH_STATUS.VALIDATED,
      "sides": [
        {
          "participationId": "00000000-0000-4000-0003-000000000025",
          "competitorId": "00000000-0000-4000-0001-000000000001",
          "displayName": "Lou Bernard",
          "score": 10
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000018",
          "competitorId": "00000000-0000-4000-0001-000000000002",
          "displayName": "Inès Perrin",
          "score": 7
        }
      ],
      "winnerParticipationId": "00000000-0000-4000-0003-000000000025"
    },
    {
      "id": "00000000-0000-4000-0004-000000000119",
      "sequence": 119,
      "roundKind": ROUND_KIND.SEMI,
      "poolRank": null,
      "purpose": MATCH_PURPOSE.REGULAR,
      "targetScore": 10,
      "status": MATCH_STATUS.VALIDATED,
      "sides": [
        {
          "participationId": "00000000-0000-4000-0003-000000000025",
          "competitorId": "00000000-0000-4000-0001-000000000001",
          "displayName": "Lou Bernard",
          "score": 10
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000011",
          "competitorId": "00000000-0000-4000-0001-000000000023",
          "displayName": "Eliott Duval",
          "score": 5
        }
      ],
      "winnerParticipationId": "00000000-0000-4000-0003-000000000025"
    },
    {
      "id": "00000000-0000-4000-0004-000000000118",
      "sequence": 118,
      "roundKind": ROUND_KIND.SEMI,
      "poolRank": null,
      "purpose": MATCH_PURPOSE.REGULAR,
      "targetScore": 10,
      "status": MATCH_STATUS.VALIDATED,
      "sides": [
        {
          "participationId": "00000000-0000-4000-0003-000000000018",
          "competitorId": "00000000-0000-4000-0001-000000000002",
          "displayName": "Inès Perrin",
          "score": 10
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000034",
          "competitorId": "00000000-0000-4000-0001-000000000018",
          "displayName": "Mila Simon",
          "score": 6
        }
      ],
      "winnerParticipationId": "00000000-0000-4000-0003-000000000018"
    },
    {
      "id": "00000000-0000-4000-0004-000000000117",
      "sequence": 117,
      "roundKind": ROUND_KIND.QUARTER,
      "poolRank": null,
      "purpose": MATCH_PURPOSE.REGULAR,
      "targetScore": 10,
      "status": MATCH_STATUS.VALIDATED,
      "sides": [
        {
          "participationId": "00000000-0000-4000-0003-000000000011",
          "competitorId": "00000000-0000-4000-0001-000000000023",
          "displayName": "Eliott Duval",
          "score": 10
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000021",
          "competitorId": "00000000-0000-4000-0001-000000000020",
          "displayName": "Julia Lambert",
          "score": 6
        }
      ],
      "winnerParticipationId": "00000000-0000-4000-0003-000000000011"
    },
    {
      "id": "00000000-0000-4000-0004-000000000116",
      "sequence": 116,
      "roundKind": ROUND_KIND.QUARTER,
      "poolRank": null,
      "purpose": MATCH_PURPOSE.REGULAR,
      "targetScore": 10,
      "status": MATCH_STATUS.VALIDATED,
      "sides": [
        {
          "participationId": "00000000-0000-4000-0003-000000000018",
          "competitorId": "00000000-0000-4000-0001-000000000002",
          "displayName": "Inès Perrin",
          "score": 10
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000035",
          "competitorId": "00000000-0000-4000-0001-000000000007",
          "displayName": "Nina Perrin",
          "score": 9
        }
      ],
      "winnerParticipationId": "00000000-0000-4000-0003-000000000018"
    },
    {
      "id": "00000000-0000-4000-0004-000000000115",
      "sequence": 115,
      "roundKind": ROUND_KIND.QUARTER,
      "poolRank": null,
      "purpose": MATCH_PURPOSE.REGULAR,
      "targetScore": 10,
      "status": MATCH_STATUS.VALIDATED,
      "sides": [
        {
          "participationId": "00000000-0000-4000-0003-000000000025",
          "competitorId": "00000000-0000-4000-0001-000000000001",
          "displayName": "Lou Bernard",
          "score": 10
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000016",
          "competitorId": "00000000-0000-4000-0001-000000000027",
          "displayName": "Gabriel Denis",
          "score": 6
        }
      ],
      "winnerParticipationId": "00000000-0000-4000-0003-000000000025"
    },
    {
      "id": "00000000-0000-4000-0004-000000000114",
      "sequence": 114,
      "roundKind": ROUND_KIND.QUARTER,
      "poolRank": null,
      "purpose": MATCH_PURPOSE.REGULAR,
      "targetScore": 10,
      "status": MATCH_STATUS.VALIDATED,
      "sides": [
        {
          "participationId": "00000000-0000-4000-0003-000000000034",
          "competitorId": "00000000-0000-4000-0001-000000000018",
          "displayName": "Mila Simon",
          "score": 10
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000026",
          "competitorId": "00000000-0000-4000-0001-000000000011",
          "displayName": "Louise Garcia",
          "score": 5
        }
      ],
      "winnerParticipationId": "00000000-0000-4000-0003-000000000034"
    },
    {
      "id": "00000000-0000-4000-0004-000000000113",
      "sequence": 113,
      "roundKind": ROUND_KIND.ROUND_OF_16,
      "poolRank": null,
      "purpose": MATCH_PURPOSE.REGULAR,
      "targetScore": 10,
      "status": MATCH_STATUS.VALIDATED,
      "sides": [
        {
          "participationId": "00000000-0000-4000-0003-000000000021",
          "competitorId": "00000000-0000-4000-0001-000000000020",
          "displayName": "Julia Lambert",
          "score": 10
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000005",
          "competitorId": "00000000-0000-4000-0001-000000000053",
          "displayName": "Charlie Legrand",
          "score": 5
        }
      ],
      "winnerParticipationId": "00000000-0000-4000-0003-000000000021"
    },
    {
      "id": "00000000-0000-4000-0004-000000000112",
      "sequence": 112,
      "roundKind": ROUND_KIND.ROUND_OF_16,
      "poolRank": null,
      "purpose": MATCH_PURPOSE.REGULAR,
      "targetScore": 10,
      "status": MATCH_STATUS.VALIDATED,
      "sides": [
        {
          "participationId": "00000000-0000-4000-0003-000000000025",
          "competitorId": "00000000-0000-4000-0001-000000000001",
          "displayName": "Lou Bernard",
          "score": 10
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000020",
          "competitorId": "00000000-0000-4000-0001-000000000061",
          "displayName": "Iris Guérin",
          "score": 9
        }
      ],
      "winnerParticipationId": "00000000-0000-4000-0003-000000000025"
    },
    {
      "id": "00000000-0000-4000-0004-000000000111",
      "sequence": 111,
      "roundKind": ROUND_KIND.ROUND_OF_16,
      "poolRank": null,
      "purpose": MATCH_PURPOSE.REGULAR,
      "targetScore": 10,
      "status": MATCH_STATUS.VALIDATED,
      "sides": [
        {
          "participationId": "00000000-0000-4000-0003-000000000026",
          "competitorId": "00000000-0000-4000-0001-000000000011",
          "displayName": "Louise Garcia",
          "score": 10
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000023",
          "competitorId": "00000000-0000-4000-0001-000000000032",
          "displayName": "Lisa André",
          "score": 9
        }
      ],
      "winnerParticipationId": "00000000-0000-4000-0003-000000000026"
    },
    {
      "id": "00000000-0000-4000-0004-000000000110",
      "sequence": 110,
      "roundKind": ROUND_KIND.ROUND_OF_16,
      "poolRank": null,
      "purpose": MATCH_PURPOSE.REGULAR,
      "targetScore": 10,
      "status": MATCH_STATUS.VALIDATED,
      "sides": [
        {
          "participationId": "00000000-0000-4000-0003-000000000011",
          "competitorId": "00000000-0000-4000-0001-000000000023",
          "displayName": "Eliott Duval",
          "score": 10
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000029",
          "competitorId": "00000000-0000-4000-0001-000000000026",
          "displayName": "Margaux Girard",
          "score": 3
        }
      ],
      "winnerParticipationId": "00000000-0000-4000-0003-000000000011"
    },
    {
      "id": "00000000-0000-4000-0004-000000000109",
      "sequence": 109,
      "roundKind": ROUND_KIND.ROUND_OF_16,
      "poolRank": null,
      "purpose": MATCH_PURPOSE.REGULAR,
      "targetScore": 10,
      "status": MATCH_STATUS.VALIDATED,
      "sides": [
        {
          "participationId": "00000000-0000-4000-0003-000000000034",
          "competitorId": "00000000-0000-4000-0001-000000000018",
          "displayName": "Mila Simon",
          "score": 10
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000004",
          "competitorId": "00000000-0000-4000-0001-000000000052",
          "displayName": "Charlie Fontaine",
          "score": 4
        }
      ],
      "winnerParticipationId": "00000000-0000-4000-0003-000000000034"
    },
    {
      "id": "00000000-0000-4000-0004-000000000108",
      "sequence": 108,
      "roundKind": ROUND_KIND.ROUND_OF_16,
      "poolRank": null,
      "purpose": MATCH_PURPOSE.REGULAR,
      "targetScore": 10,
      "status": MATCH_STATUS.VALIDATED,
      "sides": [
        {
          "participationId": "00000000-0000-4000-0003-000000000016",
          "competitorId": "00000000-0000-4000-0001-000000000027",
          "displayName": "Gabriel Denis",
          "score": 10
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000040",
          "competitorId": "00000000-0000-4000-0001-000000000071",
          "displayName": "Salomé Henry",
          "score": 3
        }
      ],
      "winnerParticipationId": "00000000-0000-4000-0003-000000000016"
    },
    {
      "id": "00000000-0000-4000-0004-000000000107",
      "sequence": 107,
      "roundKind": ROUND_KIND.ROUND_OF_16,
      "poolRank": null,
      "purpose": MATCH_PURPOSE.REGULAR,
      "targetScore": 10,
      "status": MATCH_STATUS.VALIDATED,
      "sides": [
        {
          "participationId": "00000000-0000-4000-0003-000000000035",
          "competitorId": "00000000-0000-4000-0001-000000000007",
          "displayName": "Nina Perrin",
          "score": 10
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000017",
          "competitorId": "00000000-0000-4000-0001-000000000060",
          "displayName": "Hugo Laurent",
          "score": 3
        }
      ],
      "winnerParticipationId": "00000000-0000-4000-0003-000000000035"
    },
    {
      "id": "00000000-0000-4000-0004-000000000106",
      "sequence": 106,
      "roundKind": ROUND_KIND.ROUND_OF_16,
      "poolRank": null,
      "purpose": MATCH_PURPOSE.REGULAR,
      "targetScore": 10,
      "status": MATCH_STATUS.VALIDATED,
      "sides": [
        {
          "participationId": "00000000-0000-4000-0003-000000000018",
          "competitorId": "00000000-0000-4000-0001-000000000002",
          "displayName": "Inès Perrin",
          "score": 10
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000003",
          "competitorId": "00000000-0000-4000-0001-000000000051",
          "displayName": "Camille Morel",
          "score": 8
        }
      ],
      "winnerParticipationId": "00000000-0000-4000-0003-000000000018"
    },
    {
      "id": "00000000-0000-4000-0004-000000000001",
      "sequence": 1,
      "roundKind": ROUND_KIND.POOLS,
      "poolRank": null,
      "purpose": MATCH_PURPOSE.REGULAR,
      "targetScore": 10,
      "status": MATCH_STATUS.VALIDATED,
      "sides": [
        {
          "participationId": "00000000-0000-4000-0003-000000000030",
          "competitorId": "00000000-0000-4000-0001-000000000064",
          "displayName": "Maya Lemaire",
          "score": 5
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000032",
          "competitorId": "00000000-0000-4000-0001-000000000066",
          "displayName": "Maël Robert",
          "score": 3
        }
      ],
      "winnerParticipationId": "00000000-0000-4000-0003-000000000030"
    }
  ],
  "draws": [
    {
      "id": "00000000-0000-4000-0006-000000000001",
      "kind": DRAW_KIND.POOLS,
      "roundKind": null,
      "status": DRAW_STATUS.VALIDATED,
      "parameters": {
        "poolCount": 8,
        "seedCount": 8
      },
      "createdAt": DRAWN_AT,
      "validatedAt": DRAWN_AT,
      "assignments": [
        {
          "participationId": "00000000-0000-4000-0003-000000000001",
          "competitorId": "00000000-0000-4000-0001-000000000049",
          "displayName": "Alice Vincent",
          "poolId": poolId(5),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 1,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000002",
          "competitorId": "00000000-0000-4000-0001-000000000050",
          "displayName": "Arthur Martin",
          "poolId": poolId(2),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 2,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000003",
          "competitorId": "00000000-0000-4000-0001-000000000051",
          "displayName": "Camille Morel",
          "poolId": poolId(3),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 3,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000004",
          "competitorId": "00000000-0000-4000-0001-000000000052",
          "displayName": "Charlie Fontaine",
          "poolId": poolId(4),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 4,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000005",
          "competitorId": "00000000-0000-4000-0001-000000000053",
          "displayName": "Charlie Legrand",
          "poolId": poolId(5),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 5,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000006",
          "competitorId": "00000000-0000-4000-0001-000000000017",
          "displayName": "Clara Lambert",
          "poolId": poolId(4),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 6,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000007",
          "competitorId": "00000000-0000-4000-0001-000000000024",
          "displayName": "Céleste Marie",
          "poolId": poolId(1),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 7,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000008",
          "competitorId": "00000000-0000-4000-0001-000000000054",
          "displayName": "Céleste Moreau",
          "poolId": poolId(8),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 8,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000009",
          "competitorId": "00000000-0000-4000-0001-000000000055",
          "displayName": "Côme Duval",
          "poolId": poolId(4),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 9,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000010",
          "competitorId": "00000000-0000-4000-0001-000000000056",
          "displayName": "Côme Michel",
          "poolId": poolId(4),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 10,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000011",
          "competitorId": "00000000-0000-4000-0001-000000000023",
          "displayName": "Eliott Duval",
          "poolId": poolId(1),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 11,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000012",
          "competitorId": "00000000-0000-4000-0001-000000000057",
          "displayName": "Eliott Laurent",
          "poolId": poolId(1),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 12,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000013",
          "competitorId": "00000000-0000-4000-0001-000000000058",
          "displayName": "Elsa Marchand",
          "poolId": poolId(8),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 13,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000014",
          "competitorId": "00000000-0000-4000-0001-000000000059",
          "displayName": "Eva Michel",
          "poolId": poolId(3),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 14,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000015",
          "competitorId": "00000000-0000-4000-0001-000000000031",
          "displayName": "Gabriel André",
          "poolId": poolId(5),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 15,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000016",
          "competitorId": "00000000-0000-4000-0001-000000000027",
          "displayName": "Gabriel Denis",
          "poolId": poolId(6),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 16,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000017",
          "competitorId": "00000000-0000-4000-0001-000000000060",
          "displayName": "Hugo Laurent",
          "poolId": poolId(4),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 17,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000018",
          "competitorId": "00000000-0000-4000-0001-000000000002",
          "displayName": "Inès Perrin",
          "poolId": poolId(5),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 18,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000019",
          "competitorId": "00000000-0000-4000-0001-000000000014",
          "displayName": "Iris Durand",
          "poolId": poolId(7),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 19,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000020",
          "competitorId": "00000000-0000-4000-0001-000000000061",
          "displayName": "Iris Guérin",
          "poolId": poolId(8),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 20,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000021",
          "competitorId": "00000000-0000-4000-0001-000000000020",
          "displayName": "Julia Lambert",
          "poolId": poolId(7),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 21,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000022",
          "competitorId": "00000000-0000-4000-0001-000000000022",
          "displayName": "Lina Mercier",
          "poolId": poolId(7),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 22,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000023",
          "competitorId": "00000000-0000-4000-0001-000000000032",
          "displayName": "Lisa André",
          "poolId": poolId(6),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 23,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000024",
          "competitorId": "00000000-0000-4000-0001-000000000062",
          "displayName": "Lisa Durand",
          "poolId": poolId(2),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 24,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000025",
          "competitorId": "00000000-0000-4000-0001-000000000001",
          "displayName": "Lou Bernard",
          "poolId": poolId(1),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 25,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000026",
          "competitorId": "00000000-0000-4000-0001-000000000011",
          "displayName": "Louise Garcia",
          "poolId": poolId(7),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 26,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000027",
          "competitorId": "00000000-0000-4000-0001-000000000028",
          "displayName": "Léa Noël",
          "poolId": poolId(2),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 27,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000028",
          "competitorId": "00000000-0000-4000-0001-000000000063",
          "displayName": "Manon Henry",
          "poolId": poolId(1),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 28,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000029",
          "competitorId": "00000000-0000-4000-0001-000000000026",
          "displayName": "Margaux Girard",
          "poolId": poolId(2),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 29,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000030",
          "competitorId": "00000000-0000-4000-0001-000000000064",
          "displayName": "Maya Lemaire",
          "poolId": poolId(3),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 30,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000031",
          "competitorId": "00000000-0000-4000-0001-000000000065",
          "displayName": "Maël Faure",
          "poolId": poolId(4),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 31,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000032",
          "competitorId": "00000000-0000-4000-0001-000000000066",
          "displayName": "Maël Robert",
          "poolId": poolId(3),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 32,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000033",
          "competitorId": "00000000-0000-4000-0001-000000000067",
          "displayName": "Mila Lambert",
          "poolId": poolId(5),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 33,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000034",
          "competitorId": "00000000-0000-4000-0001-000000000018",
          "displayName": "Mila Simon",
          "poolId": poolId(8),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 34,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000035",
          "competitorId": "00000000-0000-4000-0001-000000000007",
          "displayName": "Nina Perrin",
          "poolId": poolId(3),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 35,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000036",
          "competitorId": "00000000-0000-4000-0001-000000000019",
          "displayName": "Noah Dupont",
          "poolId": poolId(6),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 36,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000037",
          "competitorId": "00000000-0000-4000-0001-000000000068",
          "displayName": "Robin Girard",
          "poolId": poolId(3),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 37,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000038",
          "competitorId": "00000000-0000-4000-0001-000000000069",
          "displayName": "Rose Marchand",
          "poolId": poolId(7),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 38,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000039",
          "competitorId": "00000000-0000-4000-0001-000000000070",
          "displayName": "Salomé Guérin",
          "poolId": poolId(6),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 39,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000040",
          "competitorId": "00000000-0000-4000-0001-000000000071",
          "displayName": "Salomé Henry",
          "poolId": poolId(2),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 40,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000041",
          "competitorId": "00000000-0000-4000-0001-000000000009",
          "displayName": "Sam Dupont",
          "poolId": poolId(2),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 41,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000042",
          "competitorId": "00000000-0000-4000-0001-000000000072",
          "displayName": "Samuel François",
          "poolId": poolId(5),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 42,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000043",
          "competitorId": "00000000-0000-4000-0001-000000000073",
          "displayName": "Théo Gauthier",
          "poolId": poolId(1),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 43,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000044",
          "competitorId": "00000000-0000-4000-0001-000000000074",
          "displayName": "Tom Robin",
          "poolId": poolId(6),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 44,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000045",
          "competitorId": "00000000-0000-4000-0001-000000000075",
          "displayName": "Victor Marie",
          "poolId": poolId(8),
          "pairingIndex": null,
          "sidePosition": null,
          "drawnOrder": 45,
          "assignedAt": DRAWN_AT
        }
      ]
    },
    {
      "id": "00000000-0000-4000-0006-000000000002",
      "kind": DRAW_KIND.ROUND,
      "roundKind": ROUND_KIND.ROUND_OF_16,
      "status": DRAW_STATUS.VALIDATED,
      "parameters": {
        "poolCount": 8,
        "seedCount": 8
      },
      "createdAt": DRAWN_AT,
      "validatedAt": DRAWN_AT,
      "assignments": [
        {
          "participationId": "00000000-0000-4000-0003-000000000018",
          "competitorId": "00000000-0000-4000-0001-000000000002",
          "displayName": "Inès Perrin",
          "poolId": null,
          "pairingIndex": 0,
          "sidePosition": 0,
          "drawnOrder": 1,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000003",
          "competitorId": "00000000-0000-4000-0001-000000000051",
          "displayName": "Camille Morel",
          "poolId": null,
          "pairingIndex": 0,
          "sidePosition": 1,
          "drawnOrder": 2,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000035",
          "competitorId": "00000000-0000-4000-0001-000000000007",
          "displayName": "Nina Perrin",
          "poolId": null,
          "pairingIndex": 1,
          "sidePosition": 0,
          "drawnOrder": 3,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000017",
          "competitorId": "00000000-0000-4000-0001-000000000060",
          "displayName": "Hugo Laurent",
          "poolId": null,
          "pairingIndex": 1,
          "sidePosition": 1,
          "drawnOrder": 4,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000040",
          "competitorId": "00000000-0000-4000-0001-000000000071",
          "displayName": "Salomé Henry",
          "poolId": null,
          "pairingIndex": 2,
          "sidePosition": 0,
          "drawnOrder": 5,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000016",
          "competitorId": "00000000-0000-4000-0001-000000000027",
          "displayName": "Gabriel Denis",
          "poolId": null,
          "pairingIndex": 2,
          "sidePosition": 1,
          "drawnOrder": 6,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000004",
          "competitorId": "00000000-0000-4000-0001-000000000052",
          "displayName": "Charlie Fontaine",
          "poolId": null,
          "pairingIndex": 3,
          "sidePosition": 0,
          "drawnOrder": 7,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000034",
          "competitorId": "00000000-0000-4000-0001-000000000018",
          "displayName": "Mila Simon",
          "poolId": null,
          "pairingIndex": 3,
          "sidePosition": 1,
          "drawnOrder": 8,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000029",
          "competitorId": "00000000-0000-4000-0001-000000000026",
          "displayName": "Margaux Girard",
          "poolId": null,
          "pairingIndex": 4,
          "sidePosition": 0,
          "drawnOrder": 9,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000011",
          "competitorId": "00000000-0000-4000-0001-000000000023",
          "displayName": "Eliott Duval",
          "poolId": null,
          "pairingIndex": 4,
          "sidePosition": 1,
          "drawnOrder": 10,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000023",
          "competitorId": "00000000-0000-4000-0001-000000000032",
          "displayName": "Lisa André",
          "poolId": null,
          "pairingIndex": 5,
          "sidePosition": 0,
          "drawnOrder": 11,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000026",
          "competitorId": "00000000-0000-4000-0001-000000000011",
          "displayName": "Louise Garcia",
          "poolId": null,
          "pairingIndex": 5,
          "sidePosition": 1,
          "drawnOrder": 12,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000020",
          "competitorId": "00000000-0000-4000-0001-000000000061",
          "displayName": "Iris Guérin",
          "poolId": null,
          "pairingIndex": 6,
          "sidePosition": 0,
          "drawnOrder": 13,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000025",
          "competitorId": "00000000-0000-4000-0001-000000000001",
          "displayName": "Lou Bernard",
          "poolId": null,
          "pairingIndex": 6,
          "sidePosition": 1,
          "drawnOrder": 14,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000005",
          "competitorId": "00000000-0000-4000-0001-000000000053",
          "displayName": "Charlie Legrand",
          "poolId": null,
          "pairingIndex": 7,
          "sidePosition": 0,
          "drawnOrder": 15,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000021",
          "competitorId": "00000000-0000-4000-0001-000000000020",
          "displayName": "Julia Lambert",
          "poolId": null,
          "pairingIndex": 7,
          "sidePosition": 1,
          "drawnOrder": 16,
          "assignedAt": DRAWN_AT
        }
      ]
    },
    {
      "id": "00000000-0000-4000-0006-000000000003",
      "kind": DRAW_KIND.ROUND,
      "roundKind": ROUND_KIND.QUARTER,
      "status": DRAW_STATUS.VALIDATED,
      "parameters": {
        "poolCount": 8,
        "seedCount": 8
      },
      "createdAt": DRAWN_AT,
      "validatedAt": DRAWN_AT,
      "assignments": [
        {
          "participationId": "00000000-0000-4000-0003-000000000034",
          "competitorId": "00000000-0000-4000-0001-000000000018",
          "displayName": "Mila Simon",
          "poolId": null,
          "pairingIndex": 0,
          "sidePosition": 0,
          "drawnOrder": 1,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000026",
          "competitorId": "00000000-0000-4000-0001-000000000011",
          "displayName": "Louise Garcia",
          "poolId": null,
          "pairingIndex": 0,
          "sidePosition": 1,
          "drawnOrder": 2,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000025",
          "competitorId": "00000000-0000-4000-0001-000000000001",
          "displayName": "Lou Bernard",
          "poolId": null,
          "pairingIndex": 1,
          "sidePosition": 0,
          "drawnOrder": 3,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000016",
          "competitorId": "00000000-0000-4000-0001-000000000027",
          "displayName": "Gabriel Denis",
          "poolId": null,
          "pairingIndex": 1,
          "sidePosition": 1,
          "drawnOrder": 4,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000018",
          "competitorId": "00000000-0000-4000-0001-000000000002",
          "displayName": "Inès Perrin",
          "poolId": null,
          "pairingIndex": 2,
          "sidePosition": 0,
          "drawnOrder": 5,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000035",
          "competitorId": "00000000-0000-4000-0001-000000000007",
          "displayName": "Nina Perrin",
          "poolId": null,
          "pairingIndex": 2,
          "sidePosition": 1,
          "drawnOrder": 6,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000011",
          "competitorId": "00000000-0000-4000-0001-000000000023",
          "displayName": "Eliott Duval",
          "poolId": null,
          "pairingIndex": 3,
          "sidePosition": 0,
          "drawnOrder": 7,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000021",
          "competitorId": "00000000-0000-4000-0001-000000000020",
          "displayName": "Julia Lambert",
          "poolId": null,
          "pairingIndex": 3,
          "sidePosition": 1,
          "drawnOrder": 8,
          "assignedAt": DRAWN_AT
        }
      ]
    },
    {
      "id": "00000000-0000-4000-0006-000000000004",
      "kind": DRAW_KIND.ROUND,
      "roundKind": ROUND_KIND.FINAL,
      "status": DRAW_STATUS.VALIDATED,
      "parameters": {
        "poolCount": 8,
        "seedCount": 8
      },
      "createdAt": DRAWN_AT,
      "validatedAt": DRAWN_AT,
      "assignments": [
        {
          "participationId": "00000000-0000-4000-0003-000000000034",
          "competitorId": "00000000-0000-4000-0001-000000000018",
          "displayName": "Mila Simon",
          "poolId": null,
          "pairingIndex": 0,
          "sidePosition": 0,
          "drawnOrder": 1,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000018",
          "competitorId": "00000000-0000-4000-0001-000000000002",
          "displayName": "Inès Perrin",
          "poolId": null,
          "pairingIndex": 0,
          "sidePosition": 1,
          "drawnOrder": 2,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000025",
          "competitorId": "00000000-0000-4000-0001-000000000001",
          "displayName": "Lou Bernard",
          "poolId": null,
          "pairingIndex": 1,
          "sidePosition": 0,
          "drawnOrder": 3,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000011",
          "competitorId": "00000000-0000-4000-0001-000000000023",
          "displayName": "Eliott Duval",
          "poolId": null,
          "pairingIndex": 1,
          "sidePosition": 1,
          "drawnOrder": 4,
          "assignedAt": DRAWN_AT
        }
      ]
    },
    {
      "id": "00000000-0000-4000-0006-000000000005",
      "kind": DRAW_KIND.ROUND,
      "roundKind": ROUND_KIND.FINAL,
      "status": DRAW_STATUS.VALIDATED,
      "parameters": {
        "poolCount": 8,
        "seedCount": 8
      },
      "createdAt": DRAWN_AT,
      "validatedAt": DRAWN_AT,
      "assignments": [
        {
          "participationId": "00000000-0000-4000-0003-000000000018",
          "competitorId": "00000000-0000-4000-0001-000000000002",
          "displayName": "Inès Perrin",
          "poolId": null,
          "pairingIndex": 0,
          "sidePosition": 0,
          "drawnOrder": 1,
          "assignedAt": DRAWN_AT
        },
        {
          "participationId": "00000000-0000-4000-0003-000000000025",
          "competitorId": "00000000-0000-4000-0001-000000000001",
          "displayName": "Lou Bernard",
          "poolId": null,
          "pairingIndex": 0,
          "sidePosition": 1,
          "drawnOrder": 2,
          "assignedAt": DRAWN_AT
        }
      ]
    }
  ],
  "bracket": [
    {
      "kind": ROUND_KIND.ROUND_OF_16,
      "matches": [
        {
          "id": "00000000-0000-4000-0005-000000001001",
          "sequence": 1001,
          "roundKind": ROUND_KIND.ROUND_OF_16,
          "poolRank": null,
          "purpose": MATCH_PURPOSE.REGULAR,
          "targetScore": 10,
          "status": MATCH_STATUS.VALIDATED,
          "sides": [
            {
              "participationId": "00000000-0000-4000-0003-000000000018",
              "competitorId": "00000000-0000-4000-0001-000000000002",
              "displayName": "Inès Perrin",
              "score": 10
            },
            {
              "participationId": "00000000-0000-4000-0003-000000000003",
              "competitorId": "00000000-0000-4000-0001-000000000051",
              "displayName": "Camille Morel",
              "score": 8
            }
          ],
          "winnerParticipationId": "00000000-0000-4000-0003-000000000018"
        },
        {
          "id": "00000000-0000-4000-0005-000000001002",
          "sequence": 1002,
          "roundKind": ROUND_KIND.ROUND_OF_16,
          "poolRank": null,
          "purpose": MATCH_PURPOSE.REGULAR,
          "targetScore": 10,
          "status": MATCH_STATUS.VALIDATED,
          "sides": [
            {
              "participationId": "00000000-0000-4000-0003-000000000035",
              "competitorId": "00000000-0000-4000-0001-000000000007",
              "displayName": "Nina Perrin",
              "score": 10
            },
            {
              "participationId": "00000000-0000-4000-0003-000000000017",
              "competitorId": "00000000-0000-4000-0001-000000000060",
              "displayName": "Hugo Laurent",
              "score": 3
            }
          ],
          "winnerParticipationId": "00000000-0000-4000-0003-000000000035"
        },
        {
          "id": "00000000-0000-4000-0005-000000001003",
          "sequence": 1003,
          "roundKind": ROUND_KIND.ROUND_OF_16,
          "poolRank": null,
          "purpose": MATCH_PURPOSE.REGULAR,
          "targetScore": 10,
          "status": MATCH_STATUS.VALIDATED,
          "sides": [
            {
              "participationId": "00000000-0000-4000-0003-000000000040",
              "competitorId": "00000000-0000-4000-0001-000000000071",
              "displayName": "Salomé Henry",
              "score": 3
            },
            {
              "participationId": "00000000-0000-4000-0003-000000000016",
              "competitorId": "00000000-0000-4000-0001-000000000027",
              "displayName": "Gabriel Denis",
              "score": 10
            }
          ],
          "winnerParticipationId": "00000000-0000-4000-0003-000000000016"
        },
        {
          "id": "00000000-0000-4000-0005-000000001004",
          "sequence": 1004,
          "roundKind": ROUND_KIND.ROUND_OF_16,
          "poolRank": null,
          "purpose": MATCH_PURPOSE.REGULAR,
          "targetScore": 10,
          "status": MATCH_STATUS.VALIDATED,
          "sides": [
            {
              "participationId": "00000000-0000-4000-0003-000000000004",
              "competitorId": "00000000-0000-4000-0001-000000000052",
              "displayName": "Charlie Fontaine",
              "score": 4
            },
            {
              "participationId": "00000000-0000-4000-0003-000000000034",
              "competitorId": "00000000-0000-4000-0001-000000000018",
              "displayName": "Mila Simon",
              "score": 10
            }
          ],
          "winnerParticipationId": "00000000-0000-4000-0003-000000000034"
        },
        {
          "id": "00000000-0000-4000-0005-000000001005",
          "sequence": 1005,
          "roundKind": ROUND_KIND.ROUND_OF_16,
          "poolRank": null,
          "purpose": MATCH_PURPOSE.REGULAR,
          "targetScore": 10,
          "status": MATCH_STATUS.VALIDATED,
          "sides": [
            {
              "participationId": "00000000-0000-4000-0003-000000000029",
              "competitorId": "00000000-0000-4000-0001-000000000026",
              "displayName": "Margaux Girard",
              "score": 3
            },
            {
              "participationId": "00000000-0000-4000-0003-000000000011",
              "competitorId": "00000000-0000-4000-0001-000000000023",
              "displayName": "Eliott Duval",
              "score": 10
            }
          ],
          "winnerParticipationId": "00000000-0000-4000-0003-000000000011"
        },
        {
          "id": "00000000-0000-4000-0005-000000001006",
          "sequence": 1006,
          "roundKind": ROUND_KIND.ROUND_OF_16,
          "poolRank": null,
          "purpose": MATCH_PURPOSE.REGULAR,
          "targetScore": 10,
          "status": MATCH_STATUS.VALIDATED,
          "sides": [
            {
              "participationId": "00000000-0000-4000-0003-000000000023",
              "competitorId": "00000000-0000-4000-0001-000000000032",
              "displayName": "Lisa André",
              "score": 9
            },
            {
              "participationId": "00000000-0000-4000-0003-000000000026",
              "competitorId": "00000000-0000-4000-0001-000000000011",
              "displayName": "Louise Garcia",
              "score": 10
            }
          ],
          "winnerParticipationId": "00000000-0000-4000-0003-000000000026"
        },
        {
          "id": "00000000-0000-4000-0005-000000001007",
          "sequence": 1007,
          "roundKind": ROUND_KIND.ROUND_OF_16,
          "poolRank": null,
          "purpose": MATCH_PURPOSE.REGULAR,
          "targetScore": 10,
          "status": MATCH_STATUS.VALIDATED,
          "sides": [
            {
              "participationId": "00000000-0000-4000-0003-000000000020",
              "competitorId": "00000000-0000-4000-0001-000000000061",
              "displayName": "Iris Guérin",
              "score": 9
            },
            {
              "participationId": "00000000-0000-4000-0003-000000000025",
              "competitorId": "00000000-0000-4000-0001-000000000001",
              "displayName": "Lou Bernard",
              "score": 10
            }
          ],
          "winnerParticipationId": "00000000-0000-4000-0003-000000000025"
        },
        {
          "id": "00000000-0000-4000-0005-000000001008",
          "sequence": 1008,
          "roundKind": ROUND_KIND.ROUND_OF_16,
          "poolRank": null,
          "purpose": MATCH_PURPOSE.REGULAR,
          "targetScore": 10,
          "status": MATCH_STATUS.VALIDATED,
          "sides": [
            {
              "participationId": "00000000-0000-4000-0003-000000000005",
              "competitorId": "00000000-0000-4000-0001-000000000053",
              "displayName": "Charlie Legrand",
              "score": 5
            },
            {
              "participationId": "00000000-0000-4000-0003-000000000021",
              "competitorId": "00000000-0000-4000-0001-000000000020",
              "displayName": "Julia Lambert",
              "score": 10
            }
          ],
          "winnerParticipationId": "00000000-0000-4000-0003-000000000021"
        }
      ]
    },
    {
      "kind": ROUND_KIND.QUARTER,
      "matches": [
        {
          "id": "00000000-0000-4000-0005-000000001009",
          "sequence": 1009,
          "roundKind": ROUND_KIND.QUARTER,
          "poolRank": null,
          "purpose": MATCH_PURPOSE.REGULAR,
          "targetScore": 10,
          "status": MATCH_STATUS.VALIDATED,
          "sides": [
            {
              "participationId": "00000000-0000-4000-0003-000000000034",
              "competitorId": "00000000-0000-4000-0001-000000000018",
              "displayName": "Mila Simon",
              "score": 10
            },
            {
              "participationId": "00000000-0000-4000-0003-000000000026",
              "competitorId": "00000000-0000-4000-0001-000000000011",
              "displayName": "Louise Garcia",
              "score": 5
            }
          ],
          "winnerParticipationId": "00000000-0000-4000-0003-000000000034"
        },
        {
          "id": "00000000-0000-4000-0005-000000001010",
          "sequence": 1010,
          "roundKind": ROUND_KIND.QUARTER,
          "poolRank": null,
          "purpose": MATCH_PURPOSE.REGULAR,
          "targetScore": 10,
          "status": MATCH_STATUS.VALIDATED,
          "sides": [
            {
              "participationId": "00000000-0000-4000-0003-000000000025",
              "competitorId": "00000000-0000-4000-0001-000000000001",
              "displayName": "Lou Bernard",
              "score": 10
            },
            {
              "participationId": "00000000-0000-4000-0003-000000000016",
              "competitorId": "00000000-0000-4000-0001-000000000027",
              "displayName": "Gabriel Denis",
              "score": 6
            }
          ],
          "winnerParticipationId": "00000000-0000-4000-0003-000000000025"
        },
        {
          "id": "00000000-0000-4000-0005-000000001011",
          "sequence": 1011,
          "roundKind": ROUND_KIND.QUARTER,
          "poolRank": null,
          "purpose": MATCH_PURPOSE.REGULAR,
          "targetScore": 10,
          "status": MATCH_STATUS.VALIDATED,
          "sides": [
            {
              "participationId": "00000000-0000-4000-0003-000000000018",
              "competitorId": "00000000-0000-4000-0001-000000000002",
              "displayName": "Inès Perrin",
              "score": 10
            },
            {
              "participationId": "00000000-0000-4000-0003-000000000035",
              "competitorId": "00000000-0000-4000-0001-000000000007",
              "displayName": "Nina Perrin",
              "score": 9
            }
          ],
          "winnerParticipationId": "00000000-0000-4000-0003-000000000018"
        },
        {
          "id": "00000000-0000-4000-0005-000000001012",
          "sequence": 1012,
          "roundKind": ROUND_KIND.QUARTER,
          "poolRank": null,
          "purpose": MATCH_PURPOSE.REGULAR,
          "targetScore": 10,
          "status": MATCH_STATUS.VALIDATED,
          "sides": [
            {
              "participationId": "00000000-0000-4000-0003-000000000011",
              "competitorId": "00000000-0000-4000-0001-000000000023",
              "displayName": "Eliott Duval",
              "score": 10
            },
            {
              "participationId": "00000000-0000-4000-0003-000000000021",
              "competitorId": "00000000-0000-4000-0001-000000000020",
              "displayName": "Julia Lambert",
              "score": 6
            }
          ],
          "winnerParticipationId": "00000000-0000-4000-0003-000000000011"
        }
      ]
    },
    {
      "kind": ROUND_KIND.FINAL,
      "matches": [
        {
          "id": "00000000-0000-4000-0005-000000001013",
          "sequence": 1013,
          "roundKind": ROUND_KIND.FINAL,
          "poolRank": null,
          "purpose": MATCH_PURPOSE.REGULAR,
          "targetScore": 10,
          "status": MATCH_STATUS.VALIDATED,
          "sides": [
            {
              "participationId": "00000000-0000-4000-0003-000000000034",
              "competitorId": "00000000-0000-4000-0001-000000000018",
              "displayName": "Mila Simon",
              "score": 6
            },
            {
              "participationId": "00000000-0000-4000-0003-000000000018",
              "competitorId": "00000000-0000-4000-0001-000000000002",
              "displayName": "Inès Perrin",
              "score": 10
            }
          ],
          "winnerParticipationId": "00000000-0000-4000-0003-000000000018"
        },
        {
          "id": "00000000-0000-4000-0005-000000001014",
          "sequence": 1014,
          "roundKind": ROUND_KIND.FINAL,
          "poolRank": null,
          "purpose": MATCH_PURPOSE.REGULAR,
          "targetScore": 10,
          "status": MATCH_STATUS.VALIDATED,
          "sides": [
            {
              "participationId": "00000000-0000-4000-0003-000000000025",
              "competitorId": "00000000-0000-4000-0001-000000000001",
              "displayName": "Lou Bernard",
              "score": 10
            },
            {
              "participationId": "00000000-0000-4000-0003-000000000011",
              "competitorId": "00000000-0000-4000-0001-000000000023",
              "displayName": "Eliott Duval",
              "score": 5
            }
          ],
          "winnerParticipationId": "00000000-0000-4000-0003-000000000025"
        }
      ]
    },
    {
      "kind": ROUND_KIND.FINAL,
      "matches": [
        {
          "id": "00000000-0000-4000-0005-000000001015",
          "sequence": 1015,
          "roundKind": ROUND_KIND.FINAL,
          "poolRank": null,
          "purpose": MATCH_PURPOSE.REGULAR,
          "targetScore": 10,
          "status": MATCH_STATUS.VALIDATED,
          "sides": [
            {
              "participationId": "00000000-0000-4000-0003-000000000018",
              "competitorId": "00000000-0000-4000-0001-000000000002",
              "displayName": "Inès Perrin",
              "score": 7
            },
            {
              "participationId": "00000000-0000-4000-0003-000000000025",
              "competitorId": "00000000-0000-4000-0001-000000000001",
              "displayName": "Lou Bernard",
              "score": 10
            }
          ],
          "winnerParticipationId": "00000000-0000-4000-0003-000000000025"
        }
      ]
    }
  ]
}

export const editionDetailFixture = (id: string): IFixtureSet<IEditionDetail> => {
  const summary = EDITIONS_FIXTURE.default.find(item => item.id === id)
  const isCurrent = isEdition2026(id)
  const body = isCurrent ? edition2026PoolsPlaying(EDITION_2025.participants) : { participants: [], pools: [], rounds: [], matches: [], draws: [], bracket: [] }
  const base = id === EDITION_2025.id || !summary ? EDITION_2025 : { ...EDITION_2025, ...summary, ...body }
  const registration = isCurrent && summary ? { ...EDITION_2025, ...edition2026RegistrationSummary(summary), ...edition2026Registration(EDITION_2025.participants) } : base
  return { default: base, empty: { ...base, participants: [], pools: [], rounds: [], matches: [], draws: [], bracket: [] }, registration }
}

export const editionMatchesFixture = (id: string): IFixtureSet<IPaginated<IMatch>> => {
  const items = id === EDITION_2025.id ? EDITION_2025.matches : (isEdition2026(id) ? EDITION_2026_LATEST_MATCHES : [])
  return {
    default: { items, total: id === EDITION_2025.id ? 120 : items.length, page: 1, pageSize: 16 },
    empty: { items: [], total: 0, page: 1, pageSize: 16 }
  }
}
