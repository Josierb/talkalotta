// Symbol lookup. Falls back to a plain coloured tile if anything fails, so a
// flaky conference network can never break the demo.
//
// ARASAAC is free and needs no API key. Licence is CC BY-NC-SA: fine for a
// hackathon, but non-commercial, so swap to Mulberry (CC BY-SA) before any
// commercial release.
//
// Ranking TODO: Diez et al. (2024) published transparency / name-agreement
// norms for 1,525 ARASAAC pictograms, free at https://osf.io/eyjr6/ . Join
// candidates against that table and only auto-place above a threshold -
// everything below goes to the caregiver review tray. That turns our
// confidence gate from a guess into a cited mechanism.

const SEARCH = (word) =>
  `https://api.arasaac.org/api/pictograms/en/search/${encodeURIComponent(word)}`
const IMAGE = (id) => `https://static.arasaac.org/pictograms/${id}/${id}_300.png`

const CACHE_KEY = 'talkalotta.symbols.v1'
const memory = new Map()

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {} }
  catch { return {} }
}
function saveCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)) } catch { /* ignore */ }
}

export async function symbolFor(word) {
  if (memory.has(word)) return memory.get(word)

  const cache = loadCache()
  if (word in cache) {
    memory.set(word, cache[word])
    return cache[word]
  }

  let url = null
  try {
    const res = await fetch(SEARCH(word))
    if (res.ok) {
      const hits = await res.json()
      const id = Array.isArray(hits) && hits.length ? (hits[0]._id ?? hits[0].id) : null
      if (id) url = IMAGE(id)
    }
  } catch {
    // offline, blocked, or the endpoint moved - tile fallback handles it
  }

  memory.set(word, url)
  cache[word] = url
  saveCache(cache)
  return url
}
