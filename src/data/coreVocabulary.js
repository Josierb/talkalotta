// Fitzgerald-style colour coding.
//
// Research note (Light, Wilkinson, Thiessen, Beukelman & Fried-Oken 2019):
// colour the SYMBOL and cluster like-coloured symbols spatially. Background
// cell colour has no measurable effect on search time for displays this size.
// So the layout below groups by category, which does the clustering for free.

export const CATEGORY = {
  pronoun:     { bg: '#FFE45C', fg: '#1A1A1A' },
  verb:        { bg: '#8FDB6E', fg: '#14210E' },
  describe:    { bg: '#7CBEFF', fg: '#0D1A28' },
  question:    { bg: '#FFA94D', fg: '#241203' },
  negate:      { bg: '#EC5B45', fg: '#FFFFFF' },
  affirm:      { bg: '#4CC45C', fg: '#0A1F0D' },
  social:      { bg: '#F79BD3', fg: '#2A0F20' },
  preposition: { bg: '#FFFFFF', fg: '#1A1A1A' },
  noun:        { bg: '#FFE9A8', fg: '#231A05' },
  folder:      { bg: '#E4E1D4', fg: '#1A1A1A' },
  scenario:    { bg: '#0E767C', fg: '#EAFBFB' },
  nav:         { bg: '#C9C9BE', fg: '#1A1A1A' },
}

// The Universal Core 36 (Center for Literacy and Disability Studies, UNC
// Chapel Hill / Project Core). Licensed CC BY 4.0 - free to use commercially
// with attribution. Attribute them in the README and on the evidence slide.
export const UNIVERSAL_CORE_36 = [
  'all','can','different','do','finished','get','go','good','he','help','here',
  'I','in','it','like','look','make','more','not','on','open','put','same','she',
  'some','stop','that','turn','up','want','what','when','where','who','why','you',
]
