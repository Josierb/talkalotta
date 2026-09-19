// ---------------------------------------------------------------------------
// THE DIFFERENTIATOR. Do not cut this.
//
// A word that has appeared on the "park" board before comes back to the SAME
// slot on every future park visit. So boards are consistent WITHIN a context
// even though they differ ACROSS contexts - which is how we get the benefit of
// adaptive vocabulary without destroying the motor memory that AAC users rely
// on (LAMP / Unity / TD Snap Motor Plan all exist because position matters).
//
// Persisted as a flat map:  "park:swing" -> 3
// ---------------------------------------------------------------------------

const SLOTS_KEY = 'talkalotta.slots.v1'
const VISITS_KEY = 'talkalotta.visits.v1'

function read(key) {
  try { return JSON.parse(localStorage.getItem(key)) || {} }
  catch { return {} }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* private mode */ }
}

export const getVisits = (scenarioId) => read(VISITS_KEY)[scenarioId] || 0

export function recordVisit(scenarioId) {
  const visits = read(VISITS_KEY)
  visits[scenarioId] = (visits[scenarioId] || 0) + 1
  write(VISITS_KEY, visits)
  return visits[scenarioId]
}

/**
 * Maturity rule - freeze per scenario, not on a global timer. A brand new
 * routine adopted in month six should still be fluid while the school-morning
 * board stays locked.
 */
export function maturity(scenarioId) {
  const v = getVisits(scenarioId)
  if (v < 5) return 'fluid'      // re-rank freely
  if (v <= 20) return 'additive' // only add, never reorder
  return 'frozen'                // caregiver action required to change
}

/**
 * Place words into slots, honouring anything this scenario has seen before.
 * Returns an array of length `slotCount` of { word, remembered } | null.
 */
export function placeWords(scenarioId, words, slotCount) {
  const memory = read(SLOTS_KEY)
  const key = (word) => `${scenarioId}:${word}`

  const slots = new Array(slotCount).fill(null)
  const unplaced = []

  // 1. words we have seen here before go back where they were
  for (const word of words) {
    const seat = memory[key(word)]
    if (Number.isInteger(seat) && seat < slotCount && slots[seat] === null) {
      slots[seat] = { word, remembered: true }
    } else {
      unplaced.push(word)
    }
  }

  // 2. new words take the first free slot, in relevance order, and are learned
  for (const word of unplaced) {
    const free = slots.indexOf(null)
    if (free === -1) break // board full - overflow goes to a review tray, not a swap
    slots[free] = { word, remembered: false }
    memory[key(word)] = free
  }

  write(SLOTS_KEY, memory)
  return slots
}

/** Demo helper - wire to a button if you want a clean slate on stage. */
export function resetMemory() {
  try {
    localStorage.removeItem(SLOTS_KEY)
    localStorage.removeItem(VISITS_KEY)
  } catch { /* ignore */ }
}
