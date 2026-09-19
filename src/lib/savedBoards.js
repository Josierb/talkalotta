// Saved boards: "the menu at Flour Bakery", "Danehy Park".
//
// A saved board is NOT a second system. It is a scenario whose slots have
// been reviewed, named and frozen - the same slot memory, with a name on it.
// One code path, and a better demo line: we've been here three times, now the
// board knows it.

import { read, write } from './store.js'

const KEY = 'talkalotta.saved.v1'

/** [{ id, name, scenarioId, words, slots, savedAt }] */
export const listSaved = () => read(KEY, [])

export const savedIds = () => listSaved().map((b) => b.scenarioId)

export function saveBoard({ name, scenarioId, slots }) {
  const boards = listSaved()
  const id = `${scenarioId}-${Date.now().toString(36)}`
  boards.unshift({
    id,
    name: name.trim() || scenarioId,
    scenarioId,
    // freeze the exact arrangement, holes and all
    slots: slots.map((s) => (s ? s.word : null)),
    savedAt: Date.now(),
  })
  write(KEY, boards)
  return id
}

export function renameBoard(id, name) {
  const boards = listSaved().map((b) => (b.id === id ? { ...b, name } : b))
  write(KEY, boards)
}

export function deleteBoard(id) {
  write(KEY, listSaved().filter((b) => b.id !== id))
}

export const getBoard = (id) => listSaved().find((b) => b.id === id) || null
