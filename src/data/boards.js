// Board data.
//
// Pages 1 and 2 hold the Universal Core and never change. Page 3 onward, and
// every folder's pages, are owned by src/lib/userBoards.js - seeded from here
// and then extended at runtime.
//
// Boards render in Open Board Format (.obf) shape, the MIT-licensed open JSON
// standard from the CoughDrop team (github.com/open-aac).

let _id = 0
const uid = () => `b${++_id}`

export const w = (label, category, opts = {}) => ({ label, category, ...opts })
export const folder = (label, target) => w(label, 'folder', { loadBoard: target })
export const scenarioBtn = (label, kind) => w(label, 'scenario', { scenario: kind })
export const nav = (label, target) => w(label, 'nav', { loadBoard: target })

export const COLUMNS = 7
export const WORD_ROWS = 3
export const CELLS_PER_PAGE = COLUMNS * WORD_ROWS // 21
export const SCENARIO_SLOTS = CELLS_PER_PAGE

/** Build an OBF-shaped board from 21 cells plus a 7-cell bottom row. */
export function buildBoard({ id, name, cells, bottom }) {
  const buttons = []
  const grid = []
  const all = [...cells, ...bottom]
  for (let r = 0; r < 4; r++) {
    const row = []
    for (let c = 0; c < COLUMNS; c++) {
      const cell = all[r * COLUMNS + c]
      if (!cell) { row.push(null); continue }
      const button = { id: uid(), ...cell }
      buttons.push(button)
      row.push(button.id)
    }
    grid.push(row)
  }
  return {
    format: 'open-board-0.1',
    id, name, locale: 'en',
    buttons,
    grid: { rows: 4, columns: COLUMNS, order: grid },
  }
}

// ---------------------------------------------------------------------------
// BOTTOM ROW - the "always available" row. Everything here is needed no matter
// which page you are on, so it is identical on every board in the app:
//
//   [< Back] [Right now] [Situation] [My words] [emergency] [Home] [Next >]
//
// Back and Next move through the current chain - core pages on a core page,
// that folder's pages inside a folder. Home always returns to page 1.
//
// This is also the row closest to where hands rest on a held tablet, which is
// why it carries emergency rather than another navigation button.
//
// There is deliberately no "Folders" button here. Folders are not consolidated
// into a directory - each one sits beside the words it extends (see below).
// ---------------------------------------------------------------------------
export const BOTTOM_MIDDLE = [
  scenarioBtn('Right now', 'context'),
  scenarioBtn('Situation', 'typed'),
  folder('My words', 'f:mywords'),
  w('emergency', 'negate'),
  nav('Home', 'core-1'),
]

// ---------------------------------------------------------------------------
// PLACEMENT RULES - every cell on this board is where it is for a reason.
//
// 1. COLOUR BLOCKS ARE CONTIGUOUS. Like-coloured symbols grouped together are
//    found measurably faster than the same symbols scattered (Wilkinson et al.
//    2008; Light et al. 2019), and colour encodes part of speech, so parts of
//    speech occupy contiguous regions.
//
// 2. SENTENCE ORDER RUNS LEFT TO RIGHT. Subjects left, verbs centre, modifiers
//    right, so building "I want more" traces one short path instead of
//    jumping across the board.
//
// 3. FOLDERS SIT BESIDE THE WORDS THEY EXTEND. People follows the pronouns.
//    Actions follows the verbs. Describe follows the modifiers. Questions
//    follows what/where. A folder is then discovered from a word already
//    known, rather than hunted for in an index.
//
// 4. CRITICAL WORDS ARE EDGE-ANCHORED. Edges and corners can be found by feel
//    without looking, so yes sits at the far left of row 3 and no at the far
//    right - six cells apart, the maximum the grid allows. A slip between
//    those two reverses consent, the one misclick here with real consequences.
//
// PAGE 1 - the sentence engine. 17 core words, 4 folders.
// 15 of the 17 come from the Universal Core 36 (UNC Chapel Hill / Project
// Core, CC BY 4.0); yes and no are deliberate additions.
// ---------------------------------------------------------------------------
export const CORE_1_CELLS = [
  // subjects ....................... verbs ..................... quantity
  w('I','pronoun'),      w('you','pronoun'),   w('it','pronoun'),
  w('want','verb'),      w('go','verb'),       w('like','verb'),    w('more','describe'),

  w('that','pronoun'),   folder('People','f:people'),
  w('do','verb'),        w('help','verb'),     w('stop','verb'),
  folder('Actions','f:actions'),                w('finished','describe'),

  // questions ........... negation at the right edge, yes at the left
  w('yes','affirm'),     w('what','question'), w('where','question'),
  folder('Questions','f:questions'),            w('not','negate'),
  folder('Describe','f:describe'),              w('no','negate'),
]

/**
 * PAGE 2 - grammar and the world. The remaining Universal Core words, with the
 * folders that extend them alongside: Places beside the locative prepositions
 * (in / on / up), Things beside the object verbs (put / open), Numbers beside
 * the quantifiers (some / all), Little words beside the function words.
 */
export const CORE_2_CELLS = [
  w('he','pronoun'),     w('she','pronoun'),   w('here','preposition'),
  w('get','verb'),       w('make','verb'),     w('put','verb'),     w('open','verb'),

  w('in','preposition'), w('on','preposition'), w('up','preposition'),
  folder('Places','f:places'),                   w('turn','verb'),
  w('look','verb'),      folder('Things','f:things'),

  w('who','question'),   w('why','question'),  w('when','question'),
  folder('Numbers','f:numbers'),                 w('some','describe'),
  w('all','describe'),   folder('Little words','f:little'),
]

/**
 * PAGE 3 SEED - social language and daily routine, with Chat beside the social
 * phrases, Food beside eat / drink, Time beside wait, and Emotions beside the
 * evaluative words. "All folders" is the one place the full index lives, for a
 * caregiver hunting a folder by name. Two slots are left free to grow into.
 */
export const CORE_3_SEED = [
  w('please','social'),  w('thank you','social'), w('sorry','social'),
  w('my turn','social'), folder('Chat','f:chat'),
  w('again','describe'), w('can','verb'),

  w('eat','verb'),       w('drink','verb'),    folder('Food','f:food'),
  w('play','verb'),      w('sleep','verb'),    w('wash','verb'),    w('good','describe'),

  w('same','describe'),  w('different','describe'),
  folder('Emotions','f:emotions'),               w('wait','verb'),
  folder('Time','f:time'),                       folder('All folders','__directory'),
  null,
]

// ---------------------------------------------------------------------------
// FOLDERS
//
// Row 1 of every folder page is the same seven core words in the same places.
// Jake's dad had to hand-copy `like` and `yes` into Chat so Jake would not have
// to navigate home mid-conversation; this does that for every folder, on every
// page, automatically - and keeps yes and no at opposite ends.
// ---------------------------------------------------------------------------
export const CORE_ROW = [
  w('yes','affirm'), w('I','pronoun'), w('want','verb'), w('like','verb'),
  w('more','describe'), w('stop','verb'), w('no','negate'),
]
const EMPTY_14 = new Array(14).fill(null)

export const FOLDER_SEEDS = {
  questions: {
    name: 'Questions',
    cells: [
    ...CORE_ROW,
    w('what','question'), w('where','question'), w('who','question'), w('why','question'), w('when','question'), w('how','question'), w('which','question'),
    w('how many?','question'), w('how much?','question'), w("what's that?",'question'), w('where is?','question'), w('who is?','question'), w('why not?','question'), w('what happened?','question'),
    ],
  },
  places: {
    name: 'Places',
    cells: [
    ...CORE_ROW,
    w('home','noun'), w('school','noun'), w('shop','noun'), w('park','noun'), w('cafe','noun'), w('hospital','noun'), w('library','noun'),
    w('pool','noun'), w('beach','noun'), w('garden','noun'), w('bedroom','noun'), w('kitchen','noun'), w('bathroom','noun'), w('outside','noun'),
    ],
  },
  actions: {
    name: 'Action words',
    cells: [
    ...CORE_ROW,
    w('eat','verb'), w('drink','verb'), w('play','verb'), w('sleep','verb'), w('wash','verb'), w('read','verb'), w('write','verb'),
    w('draw','verb'), w('walk','verb'), w('run','verb'), w('sing','verb'), w('dance','verb'), w('swim','verb'), w('jump','verb'),
    ],
  },
  chat: {
    name: 'Chat',
    cells: [
    ...CORE_ROW,
    w('hi','social'), w('bye','social'), w('thank you','social'), w('please','social'), w('sorry','social'), w('excuse me','social'), w("what's up?",'social'),
    w('how about you?','social'), w('me too','social'), w("let's hang out",'social'), w('want to?','social'), w('not much','social'), w('just kidding','social'), w("that's funny",'social'),
    ],
  },
  things: {
    name: 'Things',
    cells: [
    ...CORE_ROW,
    w('ball','noun'), w('book','noun'), w('toy','noun'), w('phone','noun'), w('iPad','noun'), w('car','noun'), w('bag','noun'),
    w('chair','noun'), w('table','noun'), w('bed','noun'), w('door','noun'), w('window','noun'), w('TV','noun'), w('music','noun'),
    ],
  },
  describe: {
    name: 'Describe',
    cells: [
    ...CORE_ROW,
    w('big','describe'), w('small','describe'), w('hot','describe'), w('cold','describe'), w('fast','describe'), w('slow','describe'), w('loud','describe'),
    w('quiet','describe'), w('new','describe'), w('old','describe'), w('dirty','describe'), w('clean','describe'), w('funny','describe'), w('pretty','describe'),
    ],
  },
  little: {
    name: 'Little words',
    cells: [
    ...CORE_ROW,
    w('a','preposition'), w('the','preposition'), w('and','preposition'), w('but','preposition'), w('or','preposition'), w('to','preposition'), w('for','preposition'),
    w('with','preposition'), w('of','preposition'), w('in','preposition'), w('on','preposition'), w('at','preposition'), w('is','preposition'), w('my','preposition'),
    ],
  },
  emotions: {
    name: 'Emotions',
    cells: [
    ...CORE_ROW,
    w('happy','describe'), w('sad','describe'), w('angry','describe'), w('scared','describe'), w('tired','describe'), w('excited','describe'), w('bored','describe'),
    w('sick','describe'), w('hurt','describe'), w('worried','describe'), w('silly','describe'), w('proud','describe'), w('shy','describe'), w('okay','describe'),
    ],
  },
  food: {
    name: 'Food',
    cells: [
    ...CORE_ROW,
    w('water','noun'), w('milk','noun'), w('juice','noun'), w('bread','noun'), w('toast','noun'), w('cereal','noun'), w('egg','noun'),
    w('pasta','noun'), w('chicken','noun'), w('apple','noun'), w('banana','noun'), w('crisps','noun'), w('biscuit','noun'), w('cake','noun'),
    ],
  },
  numbers: {
    name: 'Numbers',
    cells: [
    ...CORE_ROW,
    w('1','noun'), w('2','noun'), w('3','noun'), w('4','noun'), w('5','noun'), w('6','noun'), w('7','noun'),
    w('8','noun'), w('9','noun'), w('10','noun'), w('zero','noun'), w('how many?','noun'), w('a lot','noun'), w('none','noun'),
    ],
  },
  time: {
    name: 'Time',
    cells: [
    ...CORE_ROW,
    w('now','describe'), w('later','describe'), w('soon','describe'), w('today','describe'), w('tomorrow','describe'), w('morning','describe'), w('night','describe'),
    w('bedtime','describe'), w('wait','describe'), w('minute','describe'), w('hour','describe'), w('day','describe'), w('week','describe'), w('birthday','describe'),
    ],
  },
  people: {
    name: 'People',
    cells: [
    ...CORE_ROW,
    w('mum','pronoun'), w('dad','pronoun'), w('me','pronoun'), w('brother','pronoun'), w('sister','pronoun'), w('granny','pronoun'), w('grandad','pronoun'),
    w('teacher','pronoun'), w('friend','pronoun'), w('helper','pronoun'), w('doctor','pronoun'), w('everyone','pronoun'), w('who','pronoun'), w('nobody','pronoun'),
    ],
  },
  mywords: {
    name: 'My words',
    cells: [
    ...CORE_ROW,
    ...EMPTY_14,
    ],
  },
}

/** Order the Folders directory lists them in. */
export const FOLDER_ORDER = [
  'questions',
  'places',
  'actions',
  'chat',
  'things',
  'describe',
  'little',
  'emotions',
  'food',
  'numbers',
  'time',
  'people',
  'mywords',
]

/** Core words that follow the communicator into every scenario board. */
export const SCENARIO_PINNED_ROW = [
  nav('Back', 'core-1'),
  w('I','pronoun'), w('want','verb'), w('go','verb'),
  w('more','describe'), w('stop','verb'), w('help','verb'),
]

export const GRID_COLUMNS = COLUMNS
