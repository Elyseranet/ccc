const base = 'http://localhost:3104/api/v1'
const list = { items: [...(await (await fetch(`${base}/competiteurs?pageSize=100`)).json()).items, ...(await (await fetch(`${base}/competiteurs?pageSize=100&page=2`)).json()).items] }
const found = { plural: null, singular: null, pool: null, both: null }
for (const item of list.items) {
  const summaries = await (await fetch(`${base}/competiteurs/${item.id}/face-a-face`)).json()
  for (const s of summaries) {
    if (s.unknownResults >= 2 && !found.plural) found.plural = { a: item.id, b: s.opponent.id, unknown: s.unknownResults, played: s.played }
    if (s.unknownResults === 1 && !found.singular) found.singular = { a: item.id, b: s.opponent.id, unknown: 1, played: s.played }
    if (s.played > 0 && s.unknownResults === 0 && !found.pool) {
      const detail = await (await fetch(`${base}/competiteurs/${item.id}/face-a-face?adversaire=${s.opponent.id}`)).json()
      if (detail.matches.some(m => m.roundKind === 'POOLS')) found.pool = { a: item.id, b: s.opponent.id, pools: detail.matches.filter(m => m.roundKind === 'POOLS').map(m => m.poolNumber) }
    }
  }
  if (found.plural && found.singular && found.pool) break
}
console.log(JSON.stringify(found, null, 1))
