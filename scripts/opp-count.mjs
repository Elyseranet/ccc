const base = 'http://localhost:3104/api/v1'
const list = []
for (let page = 1; page <= 8; page += 1) {
  const response = await fetch(`${base}/competiteurs?page=${page}&pageSize=20`)
  list.push(...(await response.json()).items)
}
const rows = []
for (const item of list) {
  const response = await fetch(`${base}/competiteurs/${item.id}/face-a-face`)
  rows.push({ id: item.id, name: item.displayName, opponents: (await response.json()).length })
}
const more = rows.filter(row => row.opponents > 4).sort((a, b) => a.opponents - b.opponents)
const few = rows.filter(row => row.opponents >= 1 && row.opponents <= 4)
console.log('more', more.slice(0, 2), 'count', more.length)
console.log('few', few.slice(0, 3), 'count', few.length)
console.log('exact4', rows.filter(row => row.opponents === 4).slice(0, 2))
console.log('zero', rows.filter(row => row.opponents === 0).length)
