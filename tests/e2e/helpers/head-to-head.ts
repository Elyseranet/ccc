import type { APIRequestContext } from '@playwright/test'

/*********************************************************
 * Paires de joueurs des e2e du face-à-face (ARCH-9)
 *
 * @description
 * Aucune donnée fictive : les joueurs sont ceux des archives chargées dans la base de test. La paire de référence est
 * celle qui ressemble le plus à la maquette (4 rencontres avec score, 2 victoires chacun), retrouvée par son nom ; les
 * identifiants sont lus dans l'API, jamais écrits en dur (le seed SQL ne garantit pas des UUID stables).
 ********************************************************/
export const PAIR_NAME_A = 'Arthur Vaur'
export const PAIR_NAME_B = 'Nicolas Deseine'
export const UNKNOWN_ID = '00000000-0000-4000-8000-999999999999'
export const BASE = '/joueurs/face-a-face'

interface ICompetitorRow { id: string, displayName: string }

export interface IPairIds { a: string, b: string, neverMet: string }

let cached: IPairIds | undefined

const searchByName = async (request: APIRequestContext, name: string): Promise<ICompetitorRow> => {
  const response = await request.get('/api/v1/competiteurs', { params: { q: name, pageSize: 20 } })
  const rows = (await response.json()).items as ICompetitorRow[]
  const found = rows.find(row => row.displayName === name)
  if (!found) {
    throw new Error(`Joueur introuvable dans la base de test : ${name}`)
  }
  return found
}

const findNeverMet = async (request: APIRequestContext, id: string): Promise<string> => {
  const response = await request.get('/api/v1/competiteurs', { params: { pageSize: 100, sort: 'matchesPlayed' } })
  const rows = (await response.json()).items as ICompetitorRow[]
  for (const row of rows) {
    if (row.id === id) {
      continue
    }
    const pair = await request.get(`/api/v1/competiteurs/${id}/face-a-face`, { params: { adversaire: row.id } })
    if ((await pair.json()).played === 0) {
      return row.id
    }
  }
  throw new Error('Aucun joueur sans rencontre avec la paire de référence')
}

export const resolvePair = async (request: APIRequestContext): Promise<IPairIds> => {
  if (!cached) {
    const a = await searchByName(request, PAIR_NAME_A)
    const b = await searchByName(request, PAIR_NAME_B)
    cached = { a: a.id, b: b.id, neverMet: await findNeverMet(request, a.id) }
  }
  return cached
}

export const pairUrl = (a: string, b: string): string => `${BASE}?a=${a}&b=${b}`
