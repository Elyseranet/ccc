const base = 'http://localhost:3104/api/v1'
const list = []
for (let page = 1; page <= 8; page += 1) {
  list.push(...(await (await fetch(`${base}/competiteurs?page=${page}&pageSize=20`)).json()).items)
}
const found = []
for (const item of list) {
  if (item.titles !== 1) continue
  const detail = await (await fetch(`${base}/competiteurs/${item.id}`)).json()
  const opponents = await (await fetch(`${base}/competiteurs/${item.id}/face-a-face`)).json()
  const ongoing = detail.participations.filter(p => p.finalStage === null).length
  found.push({ id: item.id, name: item.displayName, participations: detail.participations.length, ongoing, opponents: opponents.length })
}
console.log(found.filter(row => row.participations === 12).slice(0, 10))
console.log(found.filter(row => row.ongoing >= 1).slice(0, 10))
