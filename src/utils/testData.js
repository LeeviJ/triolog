/**
 * Test data generator for TrioLog development.
 * Generates realistic Finnish driving logbook entries.
 */

const testAddresses = [
  { from: 'Kotikatu 5, Joensuu', to: 'Torikatu 21, Joensuu' },
  { from: 'Torikatu 21, Joensuu', to: 'Noljakantie 2, Joensuu' },
  { from: 'Kotikatu 5, Joensuu', to: 'Kauppakatu 38, Joensuu' },
  { from: 'Kauppakatu 38, Joensuu', to: 'Siltakatu 10, Joensuu' },
  { from: 'Kotikatu 5, Joensuu', to: 'Yliopistokatu 7, Joensuu' },
  { from: 'Yliopistokatu 7, Joensuu', to: 'Länsikatu 15, Joensuu' },
  { from: 'Kotikatu 5, Joensuu', to: 'Kuopio, Maaherrankatu 11' },
  { from: 'Kuopio, Maaherrankatu 11', to: 'Kotikatu 5, Joensuu' },
  { from: 'Kotikatu 5, Joensuu', to: 'Varkaus, Kauppakatu 40' },
  { from: 'Varkaus, Kauppakatu 40', to: 'Kotikatu 5, Joensuu' },
]

const types = ['work', 'work', 'work', 'private', 'unclassified']
const profiles = ['Yleinen', 'Ohjelmapalvelut', 'Maatalous']

export function generateTestTrips(count = 8) {
  const trips = []
  const now = Date.now()

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 30)
    const hours = 7 + Math.floor(Math.random() * 10)
    const minutes = Math.floor(Math.random() * 60)

    const startTime = now - daysAgo * 86400000 + hours * 3600000 + minutes * 60000
    const durationSec = 600 + Math.floor(Math.random() * 5400) // 10 min – 1.5 h
    const endTime = startTime + durationSec * 1000
    const distance = 2 + Math.random() * 120 // 2–122 km

    const d = new Date(startTime)
    const date = `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`

    const addr = testAddresses[i % testAddresses.length]

    trips.push({
      id: startTime + i,
      date,
      startTime,
      endTime,
      distance: Math.round(distance * 100) / 100,
      duration: durationSec,
      type: types[Math.floor(Math.random() * types.length)],
      profile: profiles[Math.floor(Math.random() * profiles.length)],
      startAddress: addr.from,
      endAddress: addr.to,
    })
  }

  return trips.sort((a, b) => b.startTime - a.startTime)
}
