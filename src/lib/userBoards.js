// ---------------------------------------------------------------------------
// The page chains, the folders, and everything the caregiver creates.
//
// Three kinds of board:
//   core pages   'core-1' ... 'core-N'   pages 1-2 fixed, 3+ grow
//   folder pages 'f:food' , 'f:food:2'   every folder can run to many pages
//   directory    '__directory'           the list of all folders
//
// Growth is always APPEND-ONLY. Nothing anyone has already learned changes
// position when the vocabulary expands - the same guarantee AssistiveWare's
// Progressive Language makes.
// ---------------------------------------------------------------------------

import { read, write } from './store.js'
import {
  buildBoard, nav, folder, BOTTOM_MIDDLE, CELLS_PER_PAGE,
  CORE_1_CELLS, CORE_2_CELLS, CORE_3_SEED, FOLDER_SEEDS, FOLDER_ORDER, CORE_ROW,
} from '../data/boards.js'

const KEY = 'talkalotta.pages.v2'
const DIRECTORY = '__directory'

const FIXED = [
  { id: 'core-1', name: 'Page 1', cells: CORE_1_CELLS },
  { id: 'core-2', name: 'Page 2', cells: CORE_2_CELLS },
]

const clone = (cells) => cells.map((c) => (c ? { ...c } : null))
const padTo = (cells, n) => {
  const out = clone(cells).slice(0, n)
  while (out.length < n) out.push(null)
  return out
}

function emptyState() {
  const folders = {}
  for (const id of FOLDER_ORDER) {
    folders[id] = { name: FOLDER_SEEDS[id].name, pages: [padTo(FOLDER_SEEDS[id].cells, CELLS_PER_PAGE)] }
  }
  return { growth: [padTo(CORE_3_SEED, CELLS_PER_PAGE)], folders, order: [...FOLDER_ORDER] }
}

function load() {
  const s = read(KEY, null)
  if (!s || !Array.isArray(s.growth) || !s.folders || !s.order) return emptyState()
  return s
}
const save = (s) => write(KEY, s)

/* ------------------------------------------------------------------- ids */

const coreId = (i) => `core-${i + 1}`
const folderId = (fid, page) => (page > 0 ? `f:${fid}:${page + 1}` : `f:${fid}`)

/** Parse any board id into { kind, folder?, page } */
export function parseId(boardId) {
  if (boardId === DIRECTORY) return { kind: 'directory', page: 0 }
  if (boardId.startsWith('f:')) {
    const [, fid, page] = boardId.split(':')
    return { kind: 'folder', folder: fid, page: page ? Number(page) - 1 : 0 }
  }
  const n = Number(boardId.split('-')[1])
  return { kind: 'core', page: Number.isFinite(n) ? n - 1 : 0 }
}

/* ----------------------------------------------------------------- chains */

/** The page chain a board belongs to, as an array of board ids. */
export function chainOf(boardId) {
  const s = load()
  const at = parseId(boardId)
  if (at.kind === 'core') {
    const total = FIXED.length + s.growth.length
    return Array.from({ length: total }, (_, i) => coreId(i))
  }
  if (at.kind === 'folder') {
    const f = s.folders[at.folder]
    if (!f) return [boardId]
    return f.pages.map((_, i) => folderId(at.folder, i))
  }
  return directoryPages(s).map((_, i) => (i === 0 ? DIRECTORY : `${DIRECTORY}:${i + 1}`))
}

const step = (boardId, delta) => {
  const chain = chainOf(boardId)
  const i = chain.indexOf(boardId)
  if (i === -1) return chain[0]
  return chain[(i + delta + chain.length) % chain.length]
}

export const nextBoard = (boardId) => step(boardId, 1)
export const prevBoard = (boardId) => step(boardId, -1)

export function pagePosition(boardId) {
  const chain = chainOf(boardId)
  return { index: chain.indexOf(boardId) + 1, total: chain.length }
}

/* --------------------------------------------------------------- resolve */

function directoryPages(s) {
  const cells = s.order
    .filter((id) => s.folders[id])
    .map((id) => folder(s.folders[id].name, `f:${id}`))
  const pages = []
  for (let i = 0; i < Math.max(1, Math.ceil(cells.length / CELLS_PER_PAGE)); i++) {
    pages.push(padTo(cells.slice(i * CELLS_PER_PAGE, (i + 1) * CELLS_PER_PAGE), CELLS_PER_PAGE))
  }
  return pages
}

function bottomRow(boardId) {
  const { total } = pagePosition(boardId)
  const back = total > 1 ? nav('Back', prevBoard(boardId)) : nav('Back', 'core-1')
  const next = total > 1 ? nav('Next', nextBoard(boardId)) : nav('Next', nextBoard(boardId))
  return [back, ...BOTTOM_MIDDLE, next]
}

/** Get a renderable OBF board by id, or null. */
export function resolveBoard(boardId) {
  const s = load()
  const at = parseId(boardId)

  if (at.kind === 'core') {
    const fixed = FIXED[at.page]
    const cells = fixed ? fixed.cells : s.growth[at.page - FIXED.length]
    if (!cells) return null
    const name = fixed ? fixed.name : `Page ${at.page + 1}`
    return buildBoard({ id: boardId, name, cells: padTo(cells, CELLS_PER_PAGE), bottom: bottomRow(boardId) })
  }

  if (at.kind === 'folder') {
    const f = s.folders[at.folder]
    if (!f || !f.pages[at.page]) return null
    const name = f.pages.length > 1 ? `${f.name} ${at.page + 1}` : f.name
    return buildBoard({ id: boardId, name, cells: padTo(f.pages[at.page], CELLS_PER_PAGE), bottom: bottomRow(boardId) })
  }

  const pages = directoryPages(s)
  const page = at.page || 0
  if (!pages[page]) return null
  return buildBoard({
    id: boardId, name: 'Folders',
    cells: pages[page], bottom: bottomRow(boardId),
  })
}

/* -------------------------------------------------------------- creating */

const slugify = (label) => label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/**
 * Add a button or a folder.
 *
 * On a folder page it goes into that folder. Anywhere else it goes on the last
 * core growth page. Either way, when the page is full a new one is created and
 * nothing already placed moves.
 */
export function addItem(item, into = null) {
  const s = load()
  const label = String(item.label || '').trim()
  if (!label) return { ok: false, error: 'Give it a word first.' }

  const cell = { label, category: item.isFolder ? 'folder' : (item.category || 'noun') }
  if (item.image) cell.image = item.image

  let newFolderId = null
  if (item.isFolder) {
    newFolderId = slugify(label)
    if (!newFolderId) return { ok: false, error: 'Give the folder a name.' }
    if (s.folders[newFolderId]) return { ok: false, error: `There is already a folder called “${label}”.` }
    cell.loadBoard = `f:${newFolderId}`
  }

  const at = into ? parseId(into) : { kind: 'core' }
  let target, pages

  if (at.kind === 'folder' && s.folders[at.folder]) {
    target = at.folder
    pages = s.folders[at.folder].pages
  } else {
    target = null
    pages = s.growth
  }

  let pageIndex = pages.length - 1
  let slot = pages[pageIndex].indexOf(null)
  let newPage = false
  if (slot === -1) {
    // A new page inside a folder opens with the same core row as every other
    // folder page - otherwise page 2 of Food would drop `yes`, `no` and `like`
    // and the communicator would be stuck navigating home again.
    pages.push(target ? [...clone(CORE_ROW), ...new Array(CELLS_PER_PAGE - CORE_ROW.length).fill(null)]
                      : new Array(CELLS_PER_PAGE).fill(null))
    pageIndex = pages.length - 1
    slot = pages[pageIndex].indexOf(null)
    newPage = true
  }
  pages[pageIndex][slot] = cell

  if (newFolderId) {
    s.folders[newFolderId] = {
      name: label,
      pages: [[...clone(CORE_ROW), ...new Array(CELLS_PER_PAGE - CORE_ROW.length).fill(null)]],
    }
    s.order.push(newFolderId)
  }
  save(s)

  const boardId = target ? folderId(target, pageIndex) : coreId(FIXED.length + pageIndex)
  return { ok: true, boardId, slot, newPage, folderId: newFolderId }
}

/** Undo a create. */
export function removeItemAt(boardId, slot) {
  const s = load()
  const at = parseId(boardId)
  const pages = at.kind === 'folder' ? s.folders[at.folder]?.pages : s.growth
  if (!pages) return
  const index = at.kind === 'folder' ? at.page : at.page - FIXED.length
  if (!pages[index]) return

  const removed = pages[index][slot]
  pages[index][slot] = null
  if (removed?.loadBoard?.startsWith('f:')) {
    const fid = removed.loadBoard.slice(2)
    delete s.folders[fid]
    s.order = s.order.filter((x) => x !== fid)
  }
  // drop an empty trailing page, but never the first
  while (pages.length > 1 && pages[pages.length - 1].every((c) => !c)) pages.pop()
  save(s)
}

export const listFolders = () =>
  load().order.filter((id) => load().folders[id]).map((id) => ({ id, name: load().folders[id].name }))

export function resetPages() { write(KEY, emptyState()) }
export { DIRECTORY }
