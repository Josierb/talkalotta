import { useEffect, useState } from 'react'
import { CATEGORY } from '../data/coreVocabulary.js'
import { symbolFor } from '../lib/symbols.js'

export default function Button({ button, onPress, remembered = false, showDebug = false }) {
  const [img, setImg] = useState(null)
  const palette = CATEGORY[button.category] || CATEGORY.noun

  useEffect(() => {
    let alive = true
    symbolFor(button.label).then((url) => { if (alive) setImg(url) })
    return () => { alive = false }
  }, [button.label])

  return (
    <button
      type="button"
      className={`cell cell--${button.category}`}
      style={{ background: palette.bg, color: palette.fg }}
      onClick={() => onPress(button)}
    >
      {showDebug && remembered && <span className="cell__dot" title="same slot as last visit" />}
      {img
        ? <img className="cell__img" src={img} alt="" draggable="false" />
        : <span className="cell__placeholder" aria-hidden="true" />}
      <span className="cell__label">{button.label}</span>
    </button>
  )
}
