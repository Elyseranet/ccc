const base = 'http://localhost:3104/api/v1'
const list = await (await fetch(`${base}/competiteurs?edition=eb9b80ed-9659-461f-8cb2-68f2c3c1323f&pageSize=100`)).json()
console.log('participants 2026 :', list.total, list.items.length)
for (const item of list.items.slice(0, 40)) {
  const detail = await (await fetch(`${base}/competiteurs/${item.id}`)).json()
  const row = detail.participations.find(p => p.editionCode === '2026')
  if (row) console.log(item.id, item.displayName, JSON.stringify({ status: row.editionStatus, pool: row.poolNumber, rank: row.poolRank, w: row.wins, l: row.losses, u: row.unknownResults, pts: row.points, stage: row.finalStage, n: detail.participations.length }))
}
