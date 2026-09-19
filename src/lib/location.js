// ---------------------------------------------------------------------------
// Where are we? Coordinates -> a place TYPE (park, cafe, school...), never a
// stored location.
//
// PRIVACY, and say this on stage: raw coordinates go to the geocoder and are
// then thrown away. We keep the place type and nothing else. No location
// history is written anywhere. This is a product for a disabled child and
// "we don't keep where they've been" is a real answer to a real question.
//
// Geocoder: Nominatim (OpenStreetMap). Free, no API key, no signup, CORS
// enabled. Rate limit is 1 request/second, so results are cached and we only
// ever call it on an explicit button press - never on a timer.
// ---------------------------------------------------------------------------

const NOMINATIM = 'https://nominatim.openstreetmap.org/reverse'
const CACHE_KEY = 'talkalotta.places.v1'
const OVERRIDE_KEY = 'talkalotta.placeOverride'

/** OSM tags -> our place types. Extend freely; unknown tags fall through. */
const TAG_MAP = {
  leisure: {
    park: 'park', playground: 'park', garden: 'park', nature_reserve: 'park',
    pitch: 'sports', sports_centre: 'sports', swimming_pool: 'pool',
  },
  amenity: {
    cafe: 'cafe', restaurant: 'cafe', fast_food: 'cafe', ice_cream: 'cafe',
    school: 'school', kindergarten: 'school', college: 'school', university: 'school',
    library: 'library', hospital: 'clinic', clinic: 'clinic', doctors: 'clinic',
    dentist: 'clinic', pharmacy: 'shop', place_of_worship: 'quiet',
    swimming_pool: 'pool', cinema: 'quiet', theatre: 'quiet',
  },
  shop: {
    supermarket: 'shop', convenience: 'shop', bakery: 'cafe', greengrocer: 'shop',
    clothes: 'shop', toys: 'shop', department_store: 'shop',
  },
  tourism: { museum: 'quiet', zoo: 'park', attraction: 'park', aquarium: 'quiet' },
  building: {
    house: 'home', residential: 'home', apartments: 'home', detached: 'home',
    school: 'school', hospital: 'clinic', supermarket: 'shop',
  },
  highway: { bus_stop: 'transit' },
  railway: { station: 'transit', tram_stop: 'transit', subway_entrance: 'transit' },
  place: { house: 'home' },
}

function tagsToPlaceType(category, type) {
  const group = TAG_MAP[category]
  if (group && group[type]) return group[type]
  // a shop of any kind is still a shop
  if (category === 'shop') return 'shop'
  if (category === 'leisure') return 'park'
  return null
}

/* ----------------------------------------------------------------- caching */

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {} } catch { return {} }
}
function writeCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)) } catch { /* ignore */ }
}
/** ~110m buckets, so small GPS drift doesn't re-hit the API. */
const bucket = (lat, lon) => `${lat.toFixed(3)},${lon.toFixed(3)}`

/* --------------------------------------------------------- demo override */

/** Force a place type for the demo. setPlaceOverride('park') / (null) to clear. */
export function setPlaceOverride(placeType) {
  try {
    if (placeType) localStorage.setItem(OVERRIDE_KEY, placeType)
    else localStorage.removeItem(OVERRIDE_KEY)
  } catch { /* ignore */ }
}
export function getPlaceOverride() {
  try { return localStorage.getItem(OVERRIDE_KEY) } catch { return null }
}

/* ------------------------------------------------------------------ public */

/**
 * @returns {Promise<{placeType: string|null, name: string|null, source: string}>}
 * source is one of: override | cache | geocoder | denied | insecure |
 *                   unsupported | timeout | error | unknown
 * Never throws. Never returns coordinates.
 */
export async function detectPlace({ timeoutMs = 6000 } = {}) {
  const override = getPlaceOverride()
  if (override) return { placeType: override, name: null, source: 'override' }

  // Geolocation only works on HTTPS or localhost. Hitting your laptop's LAN
  // IP from a phone is NOT a secure context and will fail silently-ish.
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    return { placeType: null, name: null, source: 'insecure' }
  }
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return { placeType: null, name: null, source: 'unsupported' }
  }

  let coords
  try {
    coords = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos.coords),
        (err) => reject(err),
        { timeout: timeoutMs, maximumAge: 60_000, enableHighAccuracy: false }
      )
    })
  } catch (err) {
    const denied = err && err.code === 1
    return { placeType: null, name: null, source: denied ? 'denied' : 'timeout' }
  }

  const key = bucket(coords.latitude, coords.longitude)
  const cache = readCache()
  if (cache[key]) return { ...cache[key], source: 'cache' }

  try {
    const url = `${NOMINATIM}?format=jsonv2&lat=${coords.latitude}` +
                `&lon=${coords.longitude}&zoom=18&addressdetails=1`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return { placeType: null, name: null, source: 'error' }

    const data = await res.json()
    const placeType = tagsToPlaceType(data.category || data.class, data.type)
    const name = data.name || data.address?.amenity || data.address?.leisure || null

    const result = { placeType, name }
    cache[key] = result           // only the type and name are cached
    writeCache(cache)             // coordinates are never persisted

    return { ...result, source: placeType ? 'geocoder' : 'unknown' }
  } catch {
    return { placeType: null, name: null, source: 'error' }
  }
}

/** Plain-language reason, for the caregiver strip when detection fails. */
export function explainSource(source) {
  return {
    override:    'Using the demo location',
    cache:       'Using your last known place',
    geocoder:    'Found from your location',
    denied:      'Location is off, so we used the time of day',
    insecure:    'Location needs https, so we used the time of day',
    unsupported: 'This browser has no location, so we used the time of day',
    timeout:     "Couldn't get a location in time, so we used the time of day",
    error:       "Couldn't look up the place, so we used the time of day",
    unknown:     "Couldn't tell what kind of place this is, so we used the time of day",
  }[source] || 'Using the time of day'
}
