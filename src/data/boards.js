// Boards are stored in the shape of the Open Board Format (.obf) - an
// MIT-licensed open JSON standard for AAC boards, created by the CoughDrop
// team (github.com/open-aac). We are not importing anything from other apps,
// we are just using their schema so that:
//   1. we don't invent our own, and
//   2. `grid.order` is exactly the rows x columns slot matrix we need anyway.
//
// Adding an "export board" button later is then almost free.

let _id = 0
const uid = () => `b${++_id}`

/** cell helpers - keep the layout tables below readable */
export const w = (label, category, opts = {}) => ({ label, category, ...opts })
export const folder = (label, target) => w(label, 'folder', { loadBoard: target })
export const scenarioBtn = (label, kind) => w(label, 'scenario', { scenario: kind })
export const nav = (label, target) => w(label, 'nav', { loadBoard: target })
export const gap = null

/** Build an OBF-shaped board from a 2-D layout table. */
export function buildBoard({ id, name, columns, layout }) {
  const buttons = []
  const order = layout.map((row) => {
    const cells = []
    for (let c = 0; c < columns; c++) {
      const cell = row[c]
      if (!cell) { cells.push(null); continue }
      const button = { id: uid(), ...cell }
      buttons.push(button)
      cells.push(button.id)
    }
    return cells
  })
  return {
    format: 'open-board-0.1',
    id,
    name,
    locale: 'en',
    buttons,
    grid: { rows: layout.length, columns, order },
  }
}

const COLUMNS = 7

/** Row 4 is identical on every core page - positions never move. */
const bottomRow = (nextTarget, nextLabel) => [
  scenarioBtn('Right now', 'context'),
  scenarioBtn('Situation', 'typed'),
  folder('People', 'people'),
  folder('Places', 'places'),
  folder('Things', 'things'),
  folder('Feelings', 'feelings'),
  nav(nextLabel, nextTarget),
]

export const CORE_1 = buildBoard({
  id: 'core-1',
  name: 'Core 1',
  columns: COLUMNS,
  layout: [
    [w('I','pronoun'), w('you','pronoun'), w('he','pronoun'),
     w('want','verb'), w('go','verb'), w('get','verb'), w('more','describe')],
    [w('she','pronoun'), w('it','pronoun'), w('that','pronoun'),
     w('like','verb'), w('do','verb'), w('make','verb'), w('finished','describe')],
    [w('what','question'), w('where','question'), w('not','negate'),
     w('help','verb'), w('stop','verb'), w('put','verb'), w('good','describe')],
    bottomRow('core-2', 'Next page'),
  ],
})

export const CORE_2 = buildBoard({
  id: 'core-2',
  name: 'Core 2',
  columns: COLUMNS,
  layout: [
    [w('who','question'), w('why','question'), w('when','question'),
     w('turn','verb'), w('open','verb'), w('look','verb'), w('all','describe')],
    [w('yes','affirm'), w('no','negate'), w('again','describe'),
     w('can','verb'), w('come','verb'), w('my turn','social'), w('some','describe')],
    [w('here','preposition'), w('in','preposition'), w('on','preposition'),
     w('up','preposition'), w('same','describe'), w('different','describe'),
     w('please','social')],
    bottomRow('core-1', 'Page 1'),
  ],
})

/** Core words that follow the communicator into every scenario board.
 *  Without these they can name things but not ask for them. */
export const SCENARIO_PINNED_ROW = [
  nav('Back', 'core-1'),
  w('I','pronoun'), w('want','verb'), w('go','verb'),
  w('more','describe'), w('stop','verb'), w('help','verb'),
]

export const BOARDS = { 'core-1': CORE_1, 'core-2': CORE_2 }
export const GRID_COLUMNS = COLUMNS
export const SCENARIO_SLOTS = COLUMNS * 3 // rows 2-4 of the scenario board
