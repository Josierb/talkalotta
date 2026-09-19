// What is actually being used. Feeds Analytics and the relearning guardrail.
//
// Deliberately counts and observations only. No scores, no streaks, no
// percentages - framing a disabled child's communication as a score reads
// badly to clinicians and worse to families.

import { read, write, drop } from './store.js'

const KEY = 'talkalotta.usage.v1'

/** { counts: {word: n}, lastUsed: {word: ts}, byScenario: {id: {word: n}} } */
const empty = () => ({ counts: {}, lastUsed: {}, byScenario: {} })

export function recordUse(word, scenarioId = null) {
  const u = read(KEY, empty())
  u.counts[word] = (u.counts[word] || 0) + 1
  u.lastUsed[word] = Date.now()
  if (scenarioId) {
    u.byScenario[scenarioId] = u.byScenario[scenarioId] || {}
    u.byScenario[scenarioId][word] = (u.byScenario[scenarioId][word] || 0) + 1
  }
  write(KEY, u)
}

export const getCount = (word) => read(KEY, empty()).counts[word] || 0

export function topWords(limit = 8) {
  const { counts } = read(KEY, empty())
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }))
}

export const totalTaps = () =>
  Object.values(read(KEY, empty()).counts).reduce((a, b) => a + b, 0)

/**
 * Suggestions, each one an observation with a single action attached.
 * Only ever says what was observed - never what was concluded.
 * @param {{visits: (id:string)=>number, savedIds: string[]}} ctx
 */
export function getSuggestions(ctx = { visits: () => 0, savedIds: [] }) {
  const u = read(KEY, empty())
  const out = []

  // 1. a scenario visited repeatedly is worth keeping as a named board
  for (const scenarioId of Object.keys(u.byScenario)) {
    const visits = ctx.visits(scenarioId)
    if (visits >= 3 && !ctx.savedIds.includes(scenarioId)) {
      out.push({
        id: `save-${scenarioId}`,
        text: `You've used the ${scenarioId} board ${visits} times. Save it so it stays the same every visit.`,
        action: 'save-board',
        payload: scenarioId,
        actionLabel: 'Save it',
      })
    }
  }

  // 2. a heavily used word is worth knowing about
  const [top] = topWords(1)
  if (top && top.count >= 10) {
    out.push({
      id: `top-${top.word}`,
      text: `"${top.word}" is the most used button, tapped ${top.count} times. Moving it would mean relearning where it lives.`,
      action: null,
    })
  }

  // 3. words tapped once and never again may not have landed
  const stale = Object.entries(u.counts).filter(([, n]) => n === 1)
  if (stale.length >= 5) {
    out.push({
      id: 'stale',
      text: `${stale.length} words have been tapped once and not since. They may not have been the right picture.`,
      action: null,
    })
  }

  return out
}

export function resetUsage() { drop(KEY) }
