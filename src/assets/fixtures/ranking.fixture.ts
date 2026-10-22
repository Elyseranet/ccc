import type { IRankingEvolutionSeries, IRankingRow } from '../../interfaces/ranking.interface.js'
import { editionId } from './edition-id.fixture.js'
import { RANKING_KIND } from '../../enums/ranking-kind.enum.js'
import type { IFixtureSet } from '../../interfaces/fixture.interface.js'

/*********************************************************
 * Fixtures classements
 *
 * @description
 * Source : palmares.html (classements ACP et All Time au terme de 2025, évolution ACP de 2016 à 2025 des 4 premiers).
 * La maquette ne donne pas le rang annuel : `rank` vaut null dans l'évolution.
 ********************************************************/
const ACP_ROWS: IRankingRow[] = [
  {
    "rank": 1,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000001",
      "displayName": "Lou Bernard",
      "firstName": "Lou",
      "lastName": "Bernard",
      "nickname": "La Mousse",
      "avatarUrl": null
    },
    "points": 49.76,
    "participations": 10,
    "average": 8.4,
    "titles": 4
  },
  {
    "rank": 2,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000007",
      "displayName": "Nina Perrin",
      "firstName": "Nina",
      "lastName": "Perrin",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 27.6,
    "participations": 5,
    "average": 11.06,
    "titles": 3
  },
  {
    "rank": 3,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000002",
      "displayName": "Inès Perrin",
      "firstName": "Inès",
      "lastName": "Perrin",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 25.26,
    "participations": 8,
    "average": 5.96,
    "titles": 1
  },
  {
    "rank": 4,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000005",
      "displayName": "Maya Legrand",
      "firstName": "Maya",
      "lastName": "Legrand",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 20.4,
    "participations": 10,
    "average": 4.32,
    "titles": 1
  },
  {
    "rank": 5,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000017",
      "displayName": "Clara Lambert",
      "firstName": "Clara",
      "lastName": "Lambert",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 17.1,
    "participations": 9,
    "average": 2.62,
    "titles": 0
  },
  {
    "rank": 6,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000003",
      "displayName": "Hugo Robin",
      "firstName": "Hugo",
      "lastName": "Robin",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 16.92,
    "participations": 1,
    "average": 16.92,
    "titles": 1
  },
  {
    "rank": 7,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000018",
      "displayName": "Mila Simon",
      "firstName": "Mila",
      "lastName": "Simon",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 16.62,
    "participations": 5,
    "average": 3.32,
    "titles": 0
  },
  {
    "rank": 8,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000009",
      "displayName": "Sam Dupont",
      "firstName": "Sam",
      "lastName": "Dupont",
      "nickname": "Rebond",
      "avatarUrl": null
    },
    "points": 16.62,
    "participations": 11,
    "average": 4.48,
    "titles": 1
  },
  {
    "rank": 9,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000004",
      "displayName": "Noah Dumont",
      "firstName": "Noah",
      "lastName": "Dumont",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 15.16,
    "participations": 2,
    "average": 7.58,
    "titles": 0
  },
  {
    "rank": 10,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000019",
      "displayName": "Noah Dupont",
      "firstName": "Noah",
      "lastName": "Dupont",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 13.98,
    "participations": 9,
    "average": 3.35,
    "titles": 0
  },
  {
    "rank": 11,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000020",
      "displayName": "Julia Lambert",
      "firstName": "Julia",
      "lastName": "Lambert",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 13.62,
    "participations": 9,
    "average": 2.26,
    "titles": 0
  },
  {
    "rank": 12,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000006",
      "displayName": "Alice Gauthier",
      "firstName": "Alice",
      "lastName": "Gauthier",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 12.74,
    "participations": 4,
    "average": 6.37,
    "titles": 0
  },
  {
    "rank": 13,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000008",
      "displayName": "Sacha Legrand",
      "firstName": "Sacha",
      "lastName": "Legrand",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 11.44,
    "participations": 8,
    "average": 4.14,
    "titles": 1
  },
  {
    "rank": 14,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000011",
      "displayName": "Louise Garcia",
      "firstName": "Louise",
      "lastName": "Garcia",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 10.92,
    "participations": 10,
    "average": 3.94,
    "titles": 1
  },
  {
    "rank": 15,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000015",
      "displayName": "Rose Lefèvre",
      "firstName": "Rose",
      "lastName": "Lefèvre",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 10.92,
    "participations": 7,
    "average": 4.59,
    "titles": 1
  },
  {
    "rank": 16,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000021",
      "displayName": "Basile Garcia",
      "firstName": "Basile",
      "lastName": "Garcia",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 9.76,
    "participations": 10,
    "average": 1.82,
    "titles": 0
  },
  {
    "rank": 17,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000022",
      "displayName": "Lina Mercier",
      "firstName": "Lina",
      "lastName": "Mercier",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 8.52,
    "participations": 10,
    "average": 0.85,
    "titles": 0
  },
  {
    "rank": 18,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000014",
      "displayName": "Iris Durand",
      "firstName": "Iris",
      "lastName": "Durand",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 8.46,
    "participations": 6,
    "average": 2.45,
    "titles": 0
  },
  {
    "rank": 19,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000023",
      "displayName": "Eliott Duval",
      "firstName": "Eliott",
      "lastName": "Duval",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 8.1,
    "participations": 4,
    "average": 3.02,
    "titles": 0
  },
  {
    "rank": 20,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000024",
      "displayName": "Céleste Marie",
      "firstName": "Céleste",
      "lastName": "Marie",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 7.92,
    "participations": 3,
    "average": 2.64,
    "titles": 0
  }
]

const ALL_TIME_ROWS: IRankingRow[] = [
  {
    "rank": 1,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000001",
      "displayName": "Lou Bernard",
      "firstName": "Lou",
      "lastName": "Bernard",
      "nickname": "La Mousse",
      "avatarUrl": null
    },
    "points": 84.02,
    "participations": 10,
    "average": 8.4,
    "titles": 4
  },
  {
    "rank": 2,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000007",
      "displayName": "Nina Perrin",
      "firstName": "Nina",
      "lastName": "Perrin",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 55.32,
    "participations": 5,
    "average": 11.06,
    "titles": 3
  },
  {
    "rank": 3,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000009",
      "displayName": "Sam Dupont",
      "firstName": "Sam",
      "lastName": "Dupont",
      "nickname": "Rebond",
      "avatarUrl": null
    },
    "points": 49.32,
    "participations": 11,
    "average": 4.48,
    "titles": 1
  },
  {
    "rank": 4,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000002",
      "displayName": "Inès Perrin",
      "firstName": "Inès",
      "lastName": "Perrin",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 47.7,
    "participations": 8,
    "average": 5.96,
    "titles": 1
  },
  {
    "rank": 5,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000005",
      "displayName": "Maya Legrand",
      "firstName": "Maya",
      "lastName": "Legrand",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 43.2,
    "participations": 10,
    "average": 4.32,
    "titles": 1
  },
  {
    "rank": 6,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000011",
      "displayName": "Louise Garcia",
      "firstName": "Louise",
      "lastName": "Garcia",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 39.44,
    "participations": 10,
    "average": 3.94,
    "titles": 1
  },
  {
    "rank": 7,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000008",
      "displayName": "Sacha Legrand",
      "firstName": "Sacha",
      "lastName": "Legrand",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 33.14,
    "participations": 8,
    "average": 4.14,
    "titles": 1
  },
  {
    "rank": 8,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000015",
      "displayName": "Rose Lefèvre",
      "firstName": "Rose",
      "lastName": "Lefèvre",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 32.16,
    "participations": 7,
    "average": 4.59,
    "titles": 1
  },
  {
    "rank": 9,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000019",
      "displayName": "Noah Dupont",
      "firstName": "Noah",
      "lastName": "Dupont",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 30.12,
    "participations": 9,
    "average": 3.35,
    "titles": 0
  },
  {
    "rank": 10,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000010",
      "displayName": "Apolline Muller",
      "firstName": "Apolline",
      "lastName": "Muller",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 26.46,
    "participations": 6,
    "average": 4.41,
    "titles": 0
  },
  {
    "rank": 11,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000006",
      "displayName": "Alice Gauthier",
      "firstName": "Alice",
      "lastName": "Gauthier",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 25.46,
    "participations": 4,
    "average": 6.37,
    "titles": 0
  },
  {
    "rank": 12,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000017",
      "displayName": "Clara Lambert",
      "firstName": "Clara",
      "lastName": "Lambert",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 23.58,
    "participations": 9,
    "average": 2.62,
    "titles": 0
  },
  {
    "rank": 13,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000020",
      "displayName": "Julia Lambert",
      "firstName": "Julia",
      "lastName": "Lambert",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 20.34,
    "participations": 9,
    "average": 2.26,
    "titles": 0
  },
  {
    "rank": 14,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000025",
      "displayName": "Lou Girard",
      "firstName": "Lou",
      "lastName": "Girard",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 18.36,
    "participations": 4,
    "average": 4.59,
    "titles": 0
  },
  {
    "rank": 15,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000021",
      "displayName": "Basile Garcia",
      "firstName": "Basile",
      "lastName": "Garcia",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 18.16,
    "participations": 10,
    "average": 1.82,
    "titles": 0
  },
  {
    "rank": 16,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000026",
      "displayName": "Margaux Girard",
      "firstName": "Margaux",
      "lastName": "Girard",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 17.7,
    "participations": 11,
    "average": 1.61,
    "titles": 0
  },
  {
    "rank": 17,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000027",
      "displayName": "Gabriel Denis",
      "firstName": "Gabriel",
      "lastName": "Denis",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 17.4,
    "participations": 7,
    "average": 2.49,
    "titles": 0
  },
  {
    "rank": 18,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000028",
      "displayName": "Léa Noël",
      "firstName": "Léa",
      "lastName": "Noël",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 16.92,
    "participations": 10,
    "average": 1.69,
    "titles": 0
  },
  {
    "rank": 19,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000003",
      "displayName": "Hugo Robin",
      "firstName": "Hugo",
      "lastName": "Robin",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 16.92,
    "participations": 1,
    "average": 16.92,
    "titles": 1
  },
  {
    "rank": 20,
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000018",
      "displayName": "Mila Simon",
      "firstName": "Mila",
      "lastName": "Simon",
      "nickname": null,
      "avatarUrl": null
    },
    "points": 16.62,
    "participations": 5,
    "average": 3.32,
    "titles": 0
  }
]

const EVOLUTION_SERIES: IRankingEvolutionSeries[] = [
  {
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000001",
      "displayName": "Lou Bernard",
      "firstName": "Lou",
      "lastName": "Bernard",
      "nickname": "La Mousse",
      "avatarUrl": null
    },
    "points": [
      {
        "editionId": editionId('2016'),
        "editionCode": "2016",
        "year": 2016,
        "points": 23.6,
        "rank": null
      },
      {
        "editionId": editionId('2017'),
        "editionCode": "2017",
        "year": 2017,
        "points": 19.44,
        "rank": null
      },
      {
        "editionId": editionId('2018'),
        "editionCode": "2018",
        "year": 2018,
        "points": 19.44,
        "rank": null
      },
      {
        "editionId": editionId('2019'),
        "editionCode": "2019",
        "year": 2019,
        "points": 21.46,
        "rank": null
      },
      {
        "editionId": editionId('2020'),
        "editionCode": "2020",
        "year": 2020,
        "points": 21.46,
        "rank": null
      },
      {
        "editionId": editionId('2021'),
        "editionCode": "2021",
        "year": 2021,
        "points": 26.5,
        "rank": null
      },
      {
        "editionId": editionId('2022'),
        "editionCode": "2022",
        "year": 2022,
        "points": 38.46,
        "rank": null
      },
      {
        "editionId": editionId('2023'),
        "editionCode": "2023",
        "year": 2023,
        "points": 41.4,
        "rank": null
      },
      {
        "editionId": editionId('2024'),
        "editionCode": "2024",
        "year": 2024,
        "points": 33.56,
        "rank": null
      },
      {
        "editionId": editionId('2025'),
        "editionCode": "2025",
        "year": 2025,
        "points": 49.76,
        "rank": null
      }
    ]
  },
  {
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000007",
      "displayName": "Nina Perrin",
      "firstName": "Nina",
      "lastName": "Perrin",
      "nickname": null,
      "avatarUrl": null
    },
    "points": [
      {
        "editionId": editionId('2016'),
        "editionCode": "2016",
        "year": 2016,
        "points": 0,
        "rank": null
      },
      {
        "editionId": editionId('2017'),
        "editionCode": "2017",
        "year": 2017,
        "points": 12.96,
        "rank": null
      },
      {
        "editionId": editionId('2018'),
        "editionCode": "2018",
        "year": 2018,
        "points": 12.96,
        "rank": null
      },
      {
        "editionId": editionId('2019'),
        "editionCode": "2019",
        "year": 2019,
        "points": 27.72,
        "rank": null
      },
      {
        "editionId": editionId('2020'),
        "editionCode": "2020",
        "year": 2020,
        "points": 27.72,
        "rank": null
      },
      {
        "editionId": editionId('2021'),
        "editionCode": "2021",
        "year": 2021,
        "points": 27.72,
        "rank": null
      },
      {
        "editionId": editionId('2022'),
        "editionCode": "2022",
        "year": 2022,
        "points": 31.32,
        "rank": null
      },
      {
        "editionId": editionId('2023'),
        "editionCode": "2023",
        "year": 2023,
        "points": 31.32,
        "rank": null
      },
      {
        "editionId": editionId('2024'),
        "editionCode": "2024",
        "year": 2024,
        "points": 22.2,
        "rank": null
      },
      {
        "editionId": editionId('2025'),
        "editionCode": "2025",
        "year": 2025,
        "points": 27.6,
        "rank": null
      }
    ]
  },
  {
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000002",
      "displayName": "Inès Perrin",
      "firstName": "Inès",
      "lastName": "Perrin",
      "nickname": null,
      "avatarUrl": null
    },
    "points": [
      {
        "editionId": editionId('2016'),
        "editionCode": "2016",
        "year": 2016,
        "points": 5.04,
        "rank": null
      },
      {
        "editionId": editionId('2017'),
        "editionCode": "2017",
        "year": 2017,
        "points": 5.04,
        "rank": null
      },
      {
        "editionId": editionId('2018'),
        "editionCode": "2018",
        "year": 2018,
        "points": 11.88,
        "rank": null
      },
      {
        "editionId": editionId('2019'),
        "editionCode": "2019",
        "year": 2019,
        "points": 11.88,
        "rank": null
      },
      {
        "editionId": editionId('2020'),
        "editionCode": "2020",
        "year": 2020,
        "points": 11.64,
        "rank": null
      },
      {
        "editionId": editionId('2021'),
        "editionCode": "2021",
        "year": 2021,
        "points": 16.92,
        "rank": null
      },
      {
        "editionId": editionId('2022'),
        "editionCode": "2022",
        "year": 2022,
        "points": 25.2,
        "rank": null
      },
      {
        "editionId": editionId('2023'),
        "editionCode": "2023",
        "year": 2023,
        "points": 18.36,
        "rank": null
      },
      {
        "editionId": editionId('2024'),
        "editionCode": "2024",
        "year": 2024,
        "points": 18.36,
        "rank": null
      },
      {
        "editionId": editionId('2025'),
        "editionCode": "2025",
        "year": 2025,
        "points": 25.26,
        "rank": null
      }
    ]
  },
  {
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000005",
      "displayName": "Maya Legrand",
      "firstName": "Maya",
      "lastName": "Legrand",
      "nickname": null,
      "avatarUrl": null
    },
    "points": [
      {
        "editionId": editionId('2016'),
        "editionCode": "2016",
        "year": 2016,
        "points": 4.56,
        "rank": null
      },
      {
        "editionId": editionId('2017'),
        "editionCode": "2017",
        "year": 2017,
        "points": 13.92,
        "rank": null
      },
      {
        "editionId": editionId('2018'),
        "editionCode": "2018",
        "year": 2018,
        "points": 18.48,
        "rank": null
      },
      {
        "editionId": editionId('2019'),
        "editionCode": "2019",
        "year": 2019,
        "points": 15.6,
        "rank": null
      },
      {
        "editionId": editionId('2020'),
        "editionCode": "2020",
        "year": 2020,
        "points": 16.32,
        "rank": null
      },
      {
        "editionId": editionId('2021'),
        "editionCode": "2021",
        "year": 2021,
        "points": 16.32,
        "rank": null
      },
      {
        "editionId": editionId('2022'),
        "editionCode": "2022",
        "year": 2022,
        "points": 9.72,
        "rank": null
      },
      {
        "editionId": editionId('2023'),
        "editionCode": "2023",
        "year": 2023,
        "points": 22.8,
        "rank": null
      },
      {
        "editionId": editionId('2024'),
        "editionCode": "2024",
        "year": 2024,
        "points": 22.8,
        "rank": null
      },
      {
        "editionId": editionId('2025'),
        "editionCode": "2025",
        "year": 2025,
        "points": 20.4,
        "rank": null
      }
    ]
  }
]

export const rankingFixture = (kind: RANKING_KIND): IFixtureSet<IRankingRow[]> => ({
  default: kind === RANKING_KIND.ACP ? ACP_ROWS : ALL_TIME_ROWS,
  empty: []
})

export const evolutionFixture = (_kind: RANKING_KIND): IFixtureSet<IRankingEvolutionSeries[]> => ({
  default: EVOLUTION_SERIES,
  empty: []
})
