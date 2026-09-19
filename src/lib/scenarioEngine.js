// ---------------------------------------------------------------------------
// Scenario resolution.
//
// Two signals, scored together rather than one overriding the other:
//   place type  (from location.js)  -> 2 points, a clean match
//   time of day (always available)  -> up to 1 point, falling off with
//                                      distance from the scenario's peak hour
//
// Place therefore always beats time, but time still breaks ties sensibly when
// there is no location at all - which is the common case indoors. Only the
// everyday-rhythm scenarios carry a peak hour; place-driven ones (clinic,
// pool, transit) have peak: null so they never win on the clock alone.
//
// Word lists are still hardcoded. Replacing them with keyword extraction +
// OpenSymbols search is the other half of the job - keep the shape
// { id, label, words } and nothing else in the app changes.
// ---------------------------------------------------------------------------

import { detectPlace, explainSource } from './location.js'

const SCENARIOS = [
  {
    id: 'park', label: 'At the park',
    places: ['park'], peak: 16,
    words: ['swing','slide','sand','climb','ball','ducks','water','dog','tree',
            'bench','push','high','again','my turn','hot','cold','tired','home',
            'snack','drink','wet'],
  },
  {
    id: 'cafe', label: 'At the cafe',
    places: ['cafe'], peak: null,
    words: ['juice','milk','water','cake','toast','chips','hot','cold','sit',
            'table','pay','please','thank you','napkin','spoon','messy','full',
            'share','wait','outside','loud'],
  },
  {
    id: 'breakfast', label: 'Breakfast',
    places: ['home','cafe'], peak: 8,
    words: ['cereal','toast','egg','banana','milk','juice','spoon','bowl','hot',
            'cold','spill','messy','full','hungry','sit','wash','dressed',
            'school','bag','shoes','hurry'],
  },
  {
    id: 'school', label: 'At school',
    places: ['school'], peak: 11,
    words: ['teacher','friend','desk','pencil','paper','book','read','write',
            'draw','play','lunch','toilet','loud','quiet','sit','line','finished',
            'break','bus','home','tired'],
  },
  {
    id: 'shopping', label: 'Shopping',
    places: ['shop'], peak: null,
    words: ['trolley','basket','bread','milk','apples','sweets','pay','queue',
            'busy','loud','bright','carry','heavy','find','look','this one',
            'no thank you','finished','home','wait','tired'],
  },
  {
    id: 'clinic', label: 'At the doctor',
    places: ['clinic'], peak: null,
    words: ['wait','nurse','doctor','sore','hurts','scared','okay','all done',
            'sit','lie down','mouth','arm','ear','tummy','medicine','plaster',
            'brave','hold hand','home','no','finished'],
  },
  {
    id: 'swimming', label: 'Swimming',
    places: ['pool'], peak: null,
    words: ['water','splash','swim','float','kick','armbands','goggles','towel',
            'cold','warm','deep','shallow','scared','fun','again','changing',
            'dry','shower','finished','home','tired'],
  },
  {
    id: 'travelling', label: 'On the way',
    places: ['transit'], peak: null,
    words: ['bus','train','car','seat','belt','wait','late','far','nearly',
            'stop','next','loud','busy','window','look','bored','music','sick',
            'home','school','how long'],
  },
  {
    id: 'bedtime', label: 'Bedtime',
    places: ['home'], peak: 20,
    words: ['bath','teeth','pyjamas','story','book','light','dark','bed','pillow',
            'blanket','sleepy','hug','kiss','goodnight','water','toilet','scared',
            'quiet','song','tomorrow','stay'],
  },
  {
    id: 'quiet', label: 'Somewhere quiet',
    places: ['quiet','library'], peak: null,
    words: ['quiet','whisper','look','sit','wait','bored','how long','finished',
            'toilet','drink','too loud','too bright','outside','home','book',
            'this one','more','again','tired','okay','no'],
  },
  {
    id: 'out', label: 'Out and about',
    places: [], peak: null,
    words: ['look','that','here','go','wait','tired','hungry','thirsty','toilet',
            'hot','cold','loud','busy','home','more','stop','help','my turn',
            'finished','okay','no'],
  },
]

const WINDOW = 4 // hours either side of peak that still count for something

/** 1.0 at the peak hour, sliding to 0 at +/- WINDOW. Wraps around midnight. */
function timeScore(scenario, hour) {
  if (scenario.peak == null) return 0
  const raw = Math.abs(hour - scenario.peak)
  const distance = Math.min(raw, 24 - raw)
  return Math.max(0, 1 - distance / WINDOW)
}

/** Score every scenario against both signals, best first. */
export function scoreScenarios(placeType, hour) {
  return SCENARIOS
    .map((scenario) => {
      const place = placeType && scenario.places.includes(placeType) ? 2 : 0
      // "Out and about" is the floor: a hair above zero so it wins only when
      // nothing else matches at all, and never beats a real match.
      const score = scenario.id === 'out' ? 0.01 : place + timeScore(scenario, hour)
      return { scenario, score: Number(score.toFixed(3)) }
    })
    .sort((a, b) => b.score - a.score)
}

/** Time of day only. Always works, needs no permission, never fails on stage. */
export function suggestFromContext(now = new Date()) {
  const [best] = scoreScenarios(null, now.getHours())
  return best.scenario
}

/**
 * The "Right now" button. Asks for location, falls back to time of day,
 * and always returns something usable plus a plain-language reason.
 * @returns {Promise<{scenario, confidence: 'high'|'low', reason: string, placeName: string|null}>}
 */
export async function suggestFromLocation(now = new Date()) {
  const { placeType, name, source } = await detectPlace()
  const hour = now.getHours()
  const ranked = scoreScenarios(placeType, hour)
  const [best] = ranked

  return {
    scenario: best.scenario,
    confidence: best.score >= 2 ? 'high' : 'low',
    reason: placeType ? explainSource(source) : explainSource(source),
    placeName: name,
    alternatives: ranked.slice(1, 4).map((r) => r.scenario),
  }
}

/** Free-text scenario -> word list. Still the stub to replace. */
export async function resolveScenario(text) {
  const query = String(text).trim().toLowerCase()
  if (!query) return null

  const hit = SCENARIOS.find(
    (s) => s.id === query || s.label.toLowerCase().includes(query) || query.includes(s.id)
  )
  if (hit) return hit

  // TODO: keyword extraction + OpenSymbols search goes here.
  return {
    id: query.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    label: String(text).trim(),
    words: ['here','look','that','more','help','stop','finished','again','my turn'],
    provisional: true,
  }
}

export const RECENT_SCENARIOS = ['park', 'cafe', 'breakfast', 'bedtime', 'school']
export const getScenario = (id) => SCENARIOS.find((s) => s.id === id)
export const ALL_SCENARIOS = SCENARIOS
