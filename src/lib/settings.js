import { read, write } from './store.js'

const KEY = 'talkalotta.settings.v1'

const DEFAULTS = {
  buttonScale: 1,        // 0.8 - 1.4, drives cell size
  speakOnTap: true,
  requireHoldForEdit: true,
  editIdleExitMs: 120000, // auto-exit edit mode after 2 minutes idle
}

export const getSettings = () => ({ ...DEFAULTS, ...read(KEY, {}) })

export function setSetting(name, value) {
  const next = { ...getSettings(), [name]: value }
  write(KEY, next)
  return next
}

export { DEFAULTS }
