// Per-button overrides: a changed word, an uploaded picture, a removal.
//
// Keyed by context + the button's ORIGINAL label, so ids regenerating on
// reload can never orphan someone's edit.
//
// Deletion is soft. Removed buttons go to a list in Settings and can be put
// back, which turns the scariest action in the app into a safe one.

import { read, write, drop } from './store.js'

const KEY = 'talkalotta.custom.v1'
const empty = () => ({ overrides: {}, removed: [], lastChange: null })

export const buttonKey = (context, originalLabel) => `${context}::${originalLabel}`

export const getCustom = (key) => read(KEY, empty()).overrides[key] || null

/** Apply any override to a button object before rendering. */
export function decorate(button, context) {
  const key = buttonKey(context, button.label)
  const custom = getCustom(key)
  if (!custom) return { ...button, key }
  return {
    ...button,
    key,
    label: custom.label ?? button.label,
    image: custom.image ?? null,
    originalLabel: button.label,
  }
}

export const isRemoved = (key) =>
  read(KEY, empty()).removed.some((r) => r.key === key)

/**
 * Change a button. `patch` is { label?, image? }.
 * Records a single level of undo - a description plus the previous value.
 */
export function applyChange(key, patch, description) {
  const state = read(KEY, empty())
  const before = state.overrides[key] ? { ...state.overrides[key] } : null
  state.overrides[key] = { ...(state.overrides[key] || {}), ...patch }
  state.lastChange = { kind: 'override', key, before, description }
  const ok = write(KEY, state)
  return ok
    ? { ok: true, description }
    : { ok: false, error: 'Out of storage. Try a smaller picture.' }
}

export function removeButton(key, label, context) {
  const state = read(KEY, empty())
  if (!state.removed.some((r) => r.key === key)) {
    state.removed.push({ key, label, context, at: Date.now() })
  }
  state.lastChange = { kind: 'remove', key, description: `Removed "${label}"` }
  write(KEY, state)
  return { ok: true, description: `Removed "${label}"` }
}

export function restoreButton(key) {
  const state = read(KEY, empty())
  state.removed = state.removed.filter((r) => r.key !== key)
  state.lastChange = null
  write(KEY, state)
}

export const listRemoved = () => read(KEY, empty()).removed

/** Single-level undo. Returns a description of what was undone, or null. */
export function undoLast() {
  const state = read(KEY, empty())
  const change = state.lastChange
  if (!change) return null

  if (change.kind === 'override') {
    if (change.before) state.overrides[change.key] = change.before
    else delete state.overrides[change.key]
  } else if (change.kind === 'remove') {
    state.removed = state.removed.filter((r) => r.key !== change.key)
  }
  state.lastChange = null
  write(KEY, state)
  return change.description
}

export const pendingUndo = () => read(KEY, empty()).lastChange

/** The panic button in Settings. */
export function resetAll() { drop(KEY) }

/**
 * Shrink an uploaded photo before it goes into localStorage. Without this,
 * five full-size camera images blow the storage quota.
 */
export function fileToThumbnail(file, max = 200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that file'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That file is not an image'))
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
