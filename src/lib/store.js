// Tiny localStorage helpers. Everything below wraps reads/writes in try/catch
// because private-browsing and blocked site data make these throw.

export function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

export function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true }
  catch { return false }   // quota exceeded, private mode - caller decides
}

export function drop(key) {
  try { localStorage.removeItem(key) } catch { /* ignore */ }
}
