import { useEffect, useState } from 'react'
import { CATEGORY } from '../data/coreVocabulary.js'
import { symbolFor } from '../lib/symbols.js'

export default function Button({
  button, onPress, remembered = false, showDebug = false, editMode = false,
}) {
  const [fetched, setFetched] = useState(null)
  const palette = CATEGORY[button.category] || CATEGORY.noun
  const custom = button.image || null

  useEffect(() => {
    if (custom) return                 // a caregiver's own photo always wins
    let alive = true
    symbolFor(button.label).then((url) => { if (alive) setFetched(url) })
    return () => { alive = false }
  }, [button.label, custom])

  const img = custom || fetched

  return (
    <button
      type="button"
      className={`cell cell--${button.category} ${editMode ? 'is-editable' : ''}`}
      style={{ background: palette.bg, color: palette.fg }}
      onClick={() => onPress(button)}
    >
      {showDebug && remembered && <span className="cell__dot" title="same slot as last visit" />}
      {editMode && <span className="cell__pencil" aria-hidden="true">&#9998;</span>}
      {img
        ? <img className="cell__img" src={img} alt="" draggable="false" />
        : <span className="cell__placeholder" aria-hidden="true" />}
      <span className="cell__label">{button.label}</span>
    </button>
  )
}
