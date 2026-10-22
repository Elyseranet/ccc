import { API_ERROR_CODE } from '../../enums/api-error-code.enum.js'
import { EDITION_STATUS } from '../../enums/edition.enum.js'
import { FINAL_STAGE } from '../../enums/participation.enum.js'
import { ApiRequestError } from '../../utils/api-request-error.util.js'
import type { ICompetitorDetail, ICompetitorListItem, ICompetitorPublic } from '../../interfaces/competitor.interface.js'
import type { IHeadToHead } from '../../interfaces/head-to-head.interface.js'
import type { IPaginated } from '../../interfaces/pagination.interface.js'
import type { ICompetitorsQuery } from '../../interfaces/api-client.interface.js'
import type { IFixtureSet } from '../../interfaces/fixture.interface.js'
import { editionId } from './edition-id.fixture.js'

/*********************************************************
 * Fixtures compétiteurs
 *
 * @description
 * Source : maquettes Happy Hour (joueurs.html page 1, joueur.html, palmares.html, edition.html).
 * NOT_IN_MOCKUP : la maquette ne fournit pas cette valeur ; 0 explicite, à remplacer par l'API.
 * La dernière paire de face-à-face n'a aucun match avec score : winRatio vaut null (état vide, jamais 0 %).
 * L'annuaire ne contient que la page 1 de la maquette (20 lignes), avec le total de 145.
 ********************************************************/
const NOT_IN_MOCKUP = 0

export const COMPETITORS_FIXTURE: ICompetitorPublic[] = [
  {
    "id": "00000000-0000-4000-0001-000000000001",
    "displayName": "Lou Bernard",
    "firstName": "Lou",
    "lastName": "Bernard",
    "nickname": "La Mousse",
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000002",
    "displayName": "Inès Perrin",
    "firstName": "Inès",
    "lastName": "Perrin",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000003",
    "displayName": "Hugo Robin",
    "firstName": "Hugo",
    "lastName": "Robin",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000004",
    "displayName": "Noah Dumont",
    "firstName": "Noah",
    "lastName": "Dumont",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000005",
    "displayName": "Maya Legrand",
    "firstName": "Maya",
    "lastName": "Legrand",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000006",
    "displayName": "Alice Gauthier",
    "firstName": "Alice",
    "lastName": "Gauthier",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000007",
    "displayName": "Nina Perrin",
    "firstName": "Nina",
    "lastName": "Perrin",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000008",
    "displayName": "Sacha Legrand",
    "firstName": "Sacha",
    "lastName": "Legrand",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000009",
    "displayName": "Sam Dupont",
    "firstName": "Sam",
    "lastName": "Dupont",
    "nickname": "Rebond",
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000010",
    "displayName": "Apolline Muller",
    "firstName": "Apolline",
    "lastName": "Muller",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000011",
    "displayName": "Louise Garcia",
    "firstName": "Louise",
    "lastName": "Garcia",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000012",
    "displayName": "Simon Morel",
    "firstName": "Simon",
    "lastName": "Morel",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000013",
    "displayName": "Romane Dupont",
    "firstName": "Romane",
    "lastName": "Dupont",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000014",
    "displayName": "Iris Durand",
    "firstName": "Iris",
    "lastName": "Durand",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000015",
    "displayName": "Rose Lefèvre",
    "firstName": "Rose",
    "lastName": "Lefèvre",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000016",
    "displayName": "Côme Garnier",
    "firstName": "Côme",
    "lastName": "Garnier",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000017",
    "displayName": "Clara Lambert",
    "firstName": "Clara",
    "lastName": "Lambert",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000018",
    "displayName": "Mila Simon",
    "firstName": "Mila",
    "lastName": "Simon",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000019",
    "displayName": "Noah Dupont",
    "firstName": "Noah",
    "lastName": "Dupont",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000020",
    "displayName": "Julia Lambert",
    "firstName": "Julia",
    "lastName": "Lambert",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000021",
    "displayName": "Basile Garcia",
    "firstName": "Basile",
    "lastName": "Garcia",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000022",
    "displayName": "Lina Mercier",
    "firstName": "Lina",
    "lastName": "Mercier",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000023",
    "displayName": "Eliott Duval",
    "firstName": "Eliott",
    "lastName": "Duval",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000024",
    "displayName": "Céleste Marie",
    "firstName": "Céleste",
    "lastName": "Marie",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000025",
    "displayName": "Lou Girard",
    "firstName": "Lou",
    "lastName": "Girard",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000026",
    "displayName": "Margaux Girard",
    "firstName": "Margaux",
    "lastName": "Girard",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000027",
    "displayName": "Gabriel Denis",
    "firstName": "Gabriel",
    "lastName": "Denis",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000028",
    "displayName": "Léa Noël",
    "firstName": "Léa",
    "lastName": "Noël",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000029",
    "displayName": "Arthur André",
    "firstName": "Arthur",
    "lastName": "André",
    "nickname": "Tournée",
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000030",
    "displayName": "Chloé André",
    "firstName": "Chloé",
    "lastName": "André",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000031",
    "displayName": "Gabriel André",
    "firstName": "Gabriel",
    "lastName": "André",
    "nickname": "Happy Hour",
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000032",
    "displayName": "Lisa André",
    "firstName": "Lisa",
    "lastName": "André",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000033",
    "displayName": "Simon André",
    "firstName": "Simon",
    "lastName": "André",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000034",
    "displayName": "Anna Bernard",
    "firstName": "Anna",
    "lastName": "Bernard",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000035",
    "displayName": "Nathan Bernard",
    "firstName": "Nathan",
    "lastName": "Bernard",
    "nickname": "Demi",
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000036",
    "displayName": "Agathe Bertrand",
    "firstName": "Agathe",
    "lastName": "Bertrand",
    "nickname": "Mousseux",
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000037",
    "displayName": "Clara Bertrand",
    "firstName": "Clara",
    "lastName": "Bertrand",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000038",
    "displayName": "Robin Blanc",
    "firstName": "Robin",
    "lastName": "Blanc",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000039",
    "displayName": "Inès Bonnet",
    "firstName": "Inès",
    "lastName": "Bonnet",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000040",
    "displayName": "Julia Bonnet",
    "firstName": "Julia",
    "lastName": "Bonnet",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000041",
    "displayName": "Maya Bonnet",
    "firstName": "Maya",
    "lastName": "Bonnet",
    "nickname": "Triple",
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000042",
    "displayName": "Maël Bonnet",
    "firstName": "Maël",
    "lastName": "Bonnet",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000043",
    "displayName": "Rose Bonnet",
    "firstName": "Rose",
    "lastName": "Bonnet",
    "nickname": "Fair-Play",
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000044",
    "displayName": "Ambre Boyer",
    "firstName": "Ambre",
    "lastName": "Boyer",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000045",
    "displayName": "Antoine Boyer",
    "firstName": "Antoine",
    "lastName": "Boyer",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000046",
    "displayName": "Louise Boyer",
    "firstName": "Louise",
    "lastName": "Boyer",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000047",
    "displayName": "Margaux Boyer",
    "firstName": "Margaux",
    "lastName": "Boyer",
    "nickname": "Comptoir",
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000048",
    "displayName": "Lisa Meyer",
    "firstName": "Lisa",
    "lastName": "Meyer",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000049",
    "displayName": "Alice Vincent",
    "firstName": "Alice",
    "lastName": "Vincent",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000050",
    "displayName": "Arthur Martin",
    "firstName": "Arthur",
    "lastName": "Martin",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000051",
    "displayName": "Camille Morel",
    "firstName": "Camille",
    "lastName": "Morel",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000052",
    "displayName": "Charlie Fontaine",
    "firstName": "Charlie",
    "lastName": "Fontaine",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000053",
    "displayName": "Charlie Legrand",
    "firstName": "Charlie",
    "lastName": "Legrand",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000054",
    "displayName": "Céleste Moreau",
    "firstName": "Céleste",
    "lastName": "Moreau",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000055",
    "displayName": "Côme Duval",
    "firstName": "Côme",
    "lastName": "Duval",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000056",
    "displayName": "Côme Michel",
    "firstName": "Côme",
    "lastName": "Michel",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000057",
    "displayName": "Eliott Laurent",
    "firstName": "Eliott",
    "lastName": "Laurent",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000058",
    "displayName": "Elsa Marchand",
    "firstName": "Elsa",
    "lastName": "Marchand",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000059",
    "displayName": "Eva Michel",
    "firstName": "Eva",
    "lastName": "Michel",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000060",
    "displayName": "Hugo Laurent",
    "firstName": "Hugo",
    "lastName": "Laurent",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000061",
    "displayName": "Iris Guérin",
    "firstName": "Iris",
    "lastName": "Guérin",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000062",
    "displayName": "Lisa Durand",
    "firstName": "Lisa",
    "lastName": "Durand",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000063",
    "displayName": "Manon Henry",
    "firstName": "Manon",
    "lastName": "Henry",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000064",
    "displayName": "Maya Lemaire",
    "firstName": "Maya",
    "lastName": "Lemaire",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000065",
    "displayName": "Maël Faure",
    "firstName": "Maël",
    "lastName": "Faure",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000066",
    "displayName": "Maël Robert",
    "firstName": "Maël",
    "lastName": "Robert",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000067",
    "displayName": "Mila Lambert",
    "firstName": "Mila",
    "lastName": "Lambert",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000068",
    "displayName": "Robin Girard",
    "firstName": "Robin",
    "lastName": "Girard",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000069",
    "displayName": "Rose Marchand",
    "firstName": "Rose",
    "lastName": "Marchand",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000070",
    "displayName": "Salomé Guérin",
    "firstName": "Salomé",
    "lastName": "Guérin",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000071",
    "displayName": "Salomé Henry",
    "firstName": "Salomé",
    "lastName": "Henry",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000072",
    "displayName": "Samuel François",
    "firstName": "Samuel",
    "lastName": "François",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000073",
    "displayName": "Théo Gauthier",
    "firstName": "Théo",
    "lastName": "Gauthier",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000074",
    "displayName": "Tom Robin",
    "firstName": "Tom",
    "lastName": "Robin",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000075",
    "displayName": "Victor Marie",
    "firstName": "Victor",
    "lastName": "Marie",
    "nickname": null,
    "avatarUrl": null
  },
  {
    "id": "00000000-0000-4000-0001-000000000076",
    "displayName": "Paul Girard",
    "firstName": "Paul",
    "lastName": "Girard",
    "nickname": null,
    "avatarUrl": null
  }
]

const LIST_ITEMS: ICompetitorListItem[] = [
  {
    "id": "00000000-0000-4000-0001-000000000029",
    "displayName": "Arthur André",
    "firstName": "Arthur",
    "lastName": "André",
    "nickname": "Tournée",
    "avatarUrl": null,
    "editionsPlayed": 2,
    "matchesPlayed": 13,
    "wins": 8,
    "losses": 5,
    "unknownResults": 0,
    "titles": 0,
    "firstEditionCode": "2020"
  },
  {
    "id": "00000000-0000-4000-0001-000000000030",
    "displayName": "Chloé André",
    "firstName": "Chloé",
    "lastName": "André",
    "nickname": null,
    "avatarUrl": null,
    "editionsPlayed": 1,
    "matchesPlayed": 4,
    "wins": 2,
    "losses": 2,
    "unknownResults": 0,
    "titles": 0,
    "firstEditionCode": "2026"
  },
  {
    "id": "00000000-0000-4000-0001-000000000031",
    "displayName": "Gabriel André",
    "firstName": "Gabriel",
    "lastName": "André",
    "nickname": "Happy Hour",
    "avatarUrl": null,
    "editionsPlayed": 4,
    "matchesPlayed": 19,
    "wins": 5,
    "losses": 14,
    "unknownResults": 0,
    "titles": 0,
    "firstEditionCode": "2012a"
  },
  {
    "id": "00000000-0000-4000-0001-000000000032",
    "displayName": "Lisa André",
    "firstName": "Lisa",
    "lastName": "André",
    "nickname": null,
    "avatarUrl": null,
    "editionsPlayed": 11,
    "matchesPlayed": 56,
    "wins": 26,
    "losses": 30,
    "unknownResults": 0,
    "titles": 0,
    "firstEditionCode": "2012b"
  },
  {
    "id": "00000000-0000-4000-0001-000000000033",
    "displayName": "Simon André",
    "firstName": "Simon",
    "lastName": "André",
    "nickname": null,
    "avatarUrl": null,
    "editionsPlayed": 1,
    "matchesPlayed": 5,
    "wins": 2,
    "losses": 3,
    "unknownResults": 0,
    "titles": 0,
    "firstEditionCode": "2022"
  },
  {
    "id": "00000000-0000-4000-0001-000000000034",
    "displayName": "Anna Bernard",
    "firstName": "Anna",
    "lastName": "Bernard",
    "nickname": null,
    "avatarUrl": null,
    "editionsPlayed": 1,
    "matchesPlayed": 6,
    "wins": 3,
    "losses": 3,
    "unknownResults": 0,
    "titles": 0,
    "firstEditionCode": "2017"
  },
  {
    "id": "00000000-0000-4000-0001-000000000001",
    "displayName": "Lou Bernard",
    "firstName": "Lou",
    "lastName": "Bernard",
    "nickname": "La Mousse",
    "avatarUrl": null,
    "editionsPlayed": 10,
    "matchesPlayed": 79,
    "wins": 68,
    "losses": 11,
    "unknownResults": 0,
    "titles": 4,
    "firstEditionCode": "2012b"
  },
  {
    "id": "00000000-0000-4000-0001-000000000035",
    "displayName": "Nathan Bernard",
    "firstName": "Nathan",
    "lastName": "Bernard",
    "nickname": "Demi",
    "avatarUrl": null,
    "editionsPlayed": 1,
    "matchesPlayed": 5,
    "wins": 2,
    "losses": 3,
    "unknownResults": 0,
    "titles": 0,
    "firstEditionCode": "2024"
  },
  {
    "id": "00000000-0000-4000-0001-000000000036",
    "displayName": "Agathe Bertrand",
    "firstName": "Agathe",
    "lastName": "Bertrand",
    "nickname": "Mousseux",
    "avatarUrl": null,
    "editionsPlayed": 1,
    "matchesPlayed": 5,
    "wins": 1,
    "losses": 4,
    "unknownResults": 0,
    "titles": 0,
    "firstEditionCode": "2020"
  },
  {
    "id": "00000000-0000-4000-0001-000000000037",
    "displayName": "Clara Bertrand",
    "firstName": "Clara",
    "lastName": "Bertrand",
    "nickname": null,
    "avatarUrl": null,
    "editionsPlayed": 3,
    "matchesPlayed": 15,
    "wins": 5,
    "losses": 10,
    "unknownResults": 0,
    "titles": 0,
    "firstEditionCode": "2012a"
  },
  {
    "id": "00000000-0000-4000-0001-000000000038",
    "displayName": "Robin Blanc",
    "firstName": "Robin",
    "lastName": "Blanc",
    "nickname": null,
    "avatarUrl": null,
    "editionsPlayed": 1,
    "matchesPlayed": 5,
    "wins": 2,
    "losses": 3,
    "unknownResults": 0,
    "titles": 0,
    "firstEditionCode": "2021"
  },
  {
    "id": "00000000-0000-4000-0001-000000000039",
    "displayName": "Inès Bonnet",
    "firstName": "Inès",
    "lastName": "Bonnet",
    "nickname": null,
    "avatarUrl": null,
    "editionsPlayed": 1,
    "matchesPlayed": 5,
    "wins": 1,
    "losses": 4,
    "unknownResults": 0,
    "titles": 0,
    "firstEditionCode": "2012a"
  },
  {
    "id": "00000000-0000-4000-0001-000000000040",
    "displayName": "Julia Bonnet",
    "firstName": "Julia",
    "lastName": "Bonnet",
    "nickname": null,
    "avatarUrl": null,
    "editionsPlayed": 4,
    "matchesPlayed": 23,
    "wins": 12,
    "losses": 11,
    "unknownResults": 0,
    "titles": 0,
    "firstEditionCode": "2017"
  },
  {
    "id": "00000000-0000-4000-0001-000000000041",
    "displayName": "Maya Bonnet",
    "firstName": "Maya",
    "lastName": "Bonnet",
    "nickname": "Triple",
    "avatarUrl": null,
    "editionsPlayed": 1,
    "matchesPlayed": 5,
    "wins": 4,
    "losses": 1,
    "unknownResults": 0,
    "titles": 0,
    "firstEditionCode": "2026"
  },
  {
    "id": "00000000-0000-4000-0001-000000000042",
    "displayName": "Maël Bonnet",
    "firstName": "Maël",
    "lastName": "Bonnet",
    "nickname": null,
    "avatarUrl": null,
    "editionsPlayed": 1,
    "matchesPlayed": 8,
    "wins": 5,
    "losses": 3,
    "unknownResults": 0,
    "titles": 0,
    "firstEditionCode": "2013"
  },
  {
    "id": "00000000-0000-4000-0001-000000000043",
    "displayName": "Rose Bonnet",
    "firstName": "Rose",
    "lastName": "Bonnet",
    "nickname": "Fair-Play",
    "avatarUrl": null,
    "editionsPlayed": 4,
    "matchesPlayed": 22,
    "wins": 9,
    "losses": 13,
    "unknownResults": 0,
    "titles": 0,
    "firstEditionCode": "2013"
  },
  {
    "id": "00000000-0000-4000-0001-000000000044",
    "displayName": "Ambre Boyer",
    "firstName": "Ambre",
    "lastName": "Boyer",
    "nickname": null,
    "avatarUrl": null,
    "editionsPlayed": 1,
    "matchesPlayed": 4,
    "wins": 2,
    "losses": 2,
    "unknownResults": 0,
    "titles": 0,
    "firstEditionCode": "2019"
  },
  {
    "id": "00000000-0000-4000-0001-000000000045",
    "displayName": "Antoine Boyer",
    "firstName": "Antoine",
    "lastName": "Boyer",
    "nickname": null,
    "avatarUrl": null,
    "editionsPlayed": 1,
    "matchesPlayed": 5,
    "wins": 3,
    "losses": 2,
    "unknownResults": 0,
    "titles": 0,
    "firstEditionCode": "2014"
  },
  {
    "id": "00000000-0000-4000-0001-000000000046",
    "displayName": "Louise Boyer",
    "firstName": "Louise",
    "lastName": "Boyer",
    "nickname": null,
    "avatarUrl": null,
    "editionsPlayed": 2,
    "matchesPlayed": 11,
    "wins": 6,
    "losses": 5,
    "unknownResults": 0,
    "titles": 0,
    "firstEditionCode": "2018"
  },
  {
    "id": "00000000-0000-4000-0001-000000000047",
    "displayName": "Margaux Boyer",
    "firstName": "Margaux",
    "lastName": "Boyer",
    "nickname": "Comptoir",
    "avatarUrl": null,
    "editionsPlayed": 1,
    "matchesPlayed": 8,
    "wins": 5,
    "losses": 3,
    "unknownResults": 0,
    "titles": 0,
    "firstEditionCode": "2013"
  }
]

const SAM_DETAIL: ICompetitorDetail = {
  "id": "00000000-0000-4000-0001-000000000009",
  "displayName": "Sam Dupont",
  "firstName": "Sam",
  "lastName": "Dupont",
  "nickname": "Rebond",
  "avatarUrl": null,
  "participations": [
    {
      "editionId": editionId('2026'),
      "editionCode": "2026",
      "year": 2026,
      "editionName": null,
      "editionStatus": EDITION_STATUS.POOLS_PLAYING,
      "finalStage": null,
      "points": null,
      "poolRank": 5
    },
    {
      "editionId": editionId('2025'),
      "editionCode": "2025",
      "year": 2025,
      "editionName": null,
      "editionStatus": EDITION_STATUS.CLOSED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": 0,
      "poolRank": 3
    },
    {
      "editionId": editionId('2024'),
      "editionCode": "2024",
      "year": 2024,
      "editionName": null,
      "editionStatus": EDITION_STATUS.CLOSED,
      "finalStage": FINAL_STAGE.ROUND_OF_16,
      "points": 2.82,
      "poolRank": 3
    },
    {
      "editionId": editionId('2023'),
      "editionCode": "2023",
      "year": 2023,
      "editionName": null,
      "editionStatus": EDITION_STATUS.CLOSED,
      "finalStage": FINAL_STAGE.QUARTER,
      "points": 5.88,
      "poolRank": 1
    },
    {
      "editionId": editionId('2022'),
      "editionCode": "2022",
      "year": 2022,
      "editionName": null,
      "editionStatus": EDITION_STATUS.CLOSED,
      "finalStage": FINAL_STAGE.POOL_ELIMINATED,
      "points": 0,
      "poolRank": 3
    },
    {
      "editionId": editionId('2021'),
      "editionCode": "2021",
      "year": 2021,
      "editionName": null,
      "editionStatus": EDITION_STATUS.CLOSED,
      "finalStage": FINAL_STAGE.SEMI,
      "points": 7.92,
      "poolRank": 1
    },
    {
      "editionId": editionId('2020'),
      "editionCode": "2020",
      "year": 2020,
      "editionName": null,
      "editionStatus": EDITION_STATUS.CLOSED,
      "finalStage": FINAL_STAGE.CHAMPION,
      "points": 14.4,
      "poolRank": 1
    },
    {
      "editionId": editionId('2019'),
      "editionCode": "2019",
      "year": 2019,
      "editionName": null,
      "editionStatus": EDITION_STATUS.CLOSED,
      "finalStage": FINAL_STAGE.SEMI,
      "points": 7.38,
      "poolRank": 3
    },
    {
      "editionId": editionId('2018'),
      "editionCode": "2018",
      "year": 2018,
      "editionName": null,
      "editionStatus": EDITION_STATUS.CLOSED,
      "finalStage": FINAL_STAGE.ROUND_OF_16,
      "points": 2.28,
      "poolRank": 1
    },
    {
      "editionId": editionId('2017'),
      "editionCode": "2017",
      "year": 2017,
      "editionName": null,
      "editionStatus": EDITION_STATUS.CLOSED,
      "finalStage": FINAL_STAGE.ROUND_OF_16,
      "points": 2.16,
      "poolRank": 2
    },
    {
      "editionId": editionId('2016'),
      "editionCode": "2016",
      "year": 2016,
      "editionName": null,
      "editionStatus": EDITION_STATUS.CLOSED,
      "finalStage": FINAL_STAGE.QUARTER,
      "points": 3.6,
      "poolRank": 2
    },
    {
      "editionId": editionId('2014'),
      "editionCode": "2014",
      "year": 2014,
      "editionName": null,
      "editionStatus": EDITION_STATUS.CLOSED,
      "finalStage": FINAL_STAGE.QUARTER,
      "points": 2.88,
      "poolRank": 1
    }
  ],
  "stats": {
    "played": 79,
    "wins": 56,
    "losses": 23,
    "unknownResults": 0,
    "pointsFor": NOT_IN_MOCKUP,
    "pointsAgainst": NOT_IN_MOCKUP,
    "titles": 1
  }
}

const HEAD_TO_HEAD_ITEMS: IHeadToHead[] = [
  {
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000009",
      "displayName": "Sam Dupont",
      "firstName": "Sam",
      "lastName": "Dupont",
      "nickname": "Rebond",
      "avatarUrl": null
    },
    "opponent": {
      "id": "00000000-0000-4000-0001-000000000005",
      "displayName": "Maya Legrand",
      "firstName": "Maya",
      "lastName": "Legrand",
      "nickname": null,
      "avatarUrl": null
    },
    "played": 4,
    "wins": 2,
    "losses": 2,
    "winRatio": 0.5,
    "pointsFor": NOT_IN_MOCKUP,
    "pointsAgainst": NOT_IN_MOCKUP,
    "differential": NOT_IN_MOCKUP,
    "matches": []
  },
  {
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000009",
      "displayName": "Sam Dupont",
      "firstName": "Sam",
      "lastName": "Dupont",
      "nickname": "Rebond",
      "avatarUrl": null
    },
    "opponent": {
      "id": "00000000-0000-4000-0001-000000000001",
      "displayName": "Lou Bernard",
      "firstName": "Lou",
      "lastName": "Bernard",
      "nickname": "La Mousse",
      "avatarUrl": null
    },
    "played": 4,
    "wins": 0,
    "losses": 4,
    "winRatio": 0,
    "pointsFor": NOT_IN_MOCKUP,
    "pointsAgainst": NOT_IN_MOCKUP,
    "differential": NOT_IN_MOCKUP,
    "matches": []
  },
  {
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000009",
      "displayName": "Sam Dupont",
      "firstName": "Sam",
      "lastName": "Dupont",
      "nickname": "Rebond",
      "avatarUrl": null
    },
    "opponent": {
      "id": "00000000-0000-4000-0001-000000000048",
      "displayName": "Lisa Meyer",
      "firstName": "Lisa",
      "lastName": "Meyer",
      "nickname": null,
      "avatarUrl": null
    },
    "played": 4,
    "wins": 1,
    "losses": 3,
    "winRatio": 0.25,
    "pointsFor": NOT_IN_MOCKUP,
    "pointsAgainst": NOT_IN_MOCKUP,
    "differential": NOT_IN_MOCKUP,
    "matches": []
  },
  {
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000009",
      "displayName": "Sam Dupont",
      "firstName": "Sam",
      "lastName": "Dupont",
      "nickname": "Rebond",
      "avatarUrl": null
    },
    "opponent": {
      "id": "00000000-0000-4000-0001-000000000015",
      "displayName": "Rose Lefèvre",
      "firstName": "Rose",
      "lastName": "Lefèvre",
      "nickname": null,
      "avatarUrl": null
    },
    "played": 3,
    "wins": 2,
    "losses": 1,
    "winRatio": 0.67,
    "pointsFor": NOT_IN_MOCKUP,
    "pointsAgainst": NOT_IN_MOCKUP,
    "differential": NOT_IN_MOCKUP,
    "matches": []
  },
  {
    "competitor": {
      "id": "00000000-0000-4000-0001-000000000009",
      "displayName": "Sam Dupont",
      "firstName": "Sam",
      "lastName": "Dupont",
      "nickname": "Rebond",
      "avatarUrl": null
    },
    "opponent": {
      "id": "00000000-0000-4000-0001-000000000016",
      "displayName": "Côme Garnier",
      "firstName": "Côme",
      "lastName": "Garnier",
      "nickname": null,
      "avatarUrl": null
    },
    "played": 0,
    "wins": 0,
    "losses": 0,
    "winRatio": null,
    "pointsFor": 0,
    "pointsAgainst": 0,
    "differential": 0,
    "matches": []
  }
]

const matches = (item: ICompetitorListItem, q?: string): boolean => {
  if (!q) {
    return true
  }
  const norm = (value: string): string => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  return norm(`${item.displayName} ${item.nickname ?? ''}`).includes(norm(q))
}

export const competitorsFixture = (query: ICompetitorsQuery = {}): IFixtureSet<IPaginated<ICompetitorListItem>> => {
  const items = query.page && query.page > 1 ? [] : LIST_ITEMS.filter(item => matches(item, query.q))
  return {
    default: { items, total: query.q ? items.length : 145, page: query.page ?? 1, pageSize: query.pageSize ?? 20 },
    empty: { items: [], total: 0, page: 1, pageSize: query.pageSize ?? 20 }
  }
}

const notFound = (): ApiRequestError => new ApiRequestError({ statusCode: 404, code: API_ERROR_CODE.NOT_FOUND, message: 'Fixture not found' })

export const competitorDetailFixture = (id: string): IFixtureSet<ICompetitorDetail> => {
  if (id !== SAM_DETAIL.id) {
    throw notFound()
  }
  return { default: SAM_DETAIL, empty: { ...SAM_DETAIL, participations: [] } }
}

export const headToHeadFixture = (id: string, opponentId: string): IFixtureSet<IHeadToHead> => {
  const found = HEAD_TO_HEAD_ITEMS.find(item => item.competitor.id === id && item.opponent.id === opponentId)
  if (!found) {
    throw notFound()
  }
  return { default: found, empty: { ...found, played: 0, wins: 0, losses: 0, winRatio: null, matches: [] } }
}
