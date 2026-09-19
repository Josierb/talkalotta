// ---------------------------------------------------------------------------
// STUB - this is the file to replace with the real pipeline.
//
// Right now: a hardcoded lookup so the demo runs with zero network calls.
// Next:      natural-language scenario -> keyword extraction -> OpenSymbols /
//            ARASAAC search -> rank -> return word list.
//
// Keep the signature the same and nothing else in the app has to change.
// ---------------------------------------------------------------------------

const SCENARIOS = {
  park: {
    id: 'park',
    label: 'At the park',
    words: ['swing','slide','sand','climb','ball','ducks','water','dog','tree',
            'bench','push','high','again','my turn','hot','cold','tired','home',
            'snack','drink','wet'],
  },
  cafe: {
    id: 'cafe',
    label: 'At the cafe',
    words: ['juice','milk','water','cake','toast','chips','hot','cold','sit',
            'table','pay','please','thank you','napkin','spoon','messy','full',
            'share','wait','outside','loud'],
  },
  breakfast: {
    id: 'breakfast',
    label: 'Breakfast',
    words: ['cereal','toast','egg','banana','milk','juice','spoon','bowl','hot',
            'cold','spill','messy','full','hungry','sit','wash','dressed',
            'school','bag','shoes','hurry'],
  },
  bedtime: {
    id: 'bedtime',
    label: 'Bedtime',
    words: ['bath','teeth','pyjamas','story','book','light','dark','bed','pillow',
            'blanket','sleepy','hug','kiss','goodnight','water','toilet','scared',
            'quiet','song','tomorrow','stay'],
  },
  school: {
    id: 'school',
    label: 'At school',
    words: ['teacher','friend','desk','pencil','paper','book','read','write',
            'draw','play','lunch','toilet','loud','quiet','sit','line','finished',
            'break','bus','home','tired'],
  },
}

/** Time-of-day suggestion. Works offline, no permissions, demos instantly. */
export function suggestFromContext(now = new Date()) {
  const hour = now.getHours()
  if (hour >= 6 && hour < 10) return SCENARIOS.breakfast
  if (hour >= 10 && hour < 15) return SCENARIOS.school
  if (hour >= 15 && hour < 18) return SCENARIOS.park
  if (hour >= 18 && hour < 21) return SCENARIOS.bedtime
  return SCENARIOS.cafe
}

/**
 * Optional: real location. Ask for permission only when the caregiver taps
 * "Right now", never on load. Falls back to time of day if refused.
 *
 * TODO: reverse-geocode -> place type -> scenario. For the hackathon, time of
 * day alone is a perfectly good demo and never fails on stage.
 */
export function suggestFromLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(suggestFromContext())
    navigator.geolocation.getCurrentPosition(
      () => resolve(suggestFromContext()), // swap for a real lookup
      () => resolve(suggestFromContext()),
      { timeout: 3000 }
    )
  })
}

/** Free-text scenario -> word list. Replace the body, keep the shape. */
export async function resolveScenario(text) {
  const query = text.trim().toLowerCase()
  if (!query) return null

  for (const scenario of Object.values(SCENARIOS)) {
    if (query.includes(scenario.id) || scenario.label.toLowerCase().includes(query)) {
      return scenario
    }
  }

  // Unknown scenario - build a placeholder so the flow still works end to end.
  // TODO: keyword extraction + symbol search goes here.
  return {
    id: query.replace(/[^a-z0-9]+/g, '-'),
    label: text.trim(),
    words: ['here','look','that','more','help','stop','finished','again','my turn'],
    provisional: true,
  }
}

export const RECENT_SCENARIOS = ['park', 'cafe', 'breakfast', 'bedtime', 'school']
export const getScenario = (id) => SCENARIOS[id]
