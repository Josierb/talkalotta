import { useState } from 'react'
import { CATEGORY } from '../data/coreVocabulary.js'

const KINDS = [
  { id: 'pronoun',     label: 'Person' },
  { id: 'verb',        label: 'Doing word' },
  { id: 'describe',    label: 'Describing word' },
  { id: 'noun',        label: 'Thing' },
  { id: 'social',      label: 'Saying' },
  { id: 'preposition', label: 'Little word' },
]

/**
 * Create a button or a folder. Plain language throughout - a parent picks
 * "Doing word", not "verb", and never sees the word "category".
 */
export default function AddSheet({ onAdd, onClose }) {
  const [isFolder, setIsFolder] = useState(false)
  const [label, setLabel] = useState('')
  const [kind, setKind] = useState('noun')
  const [error, setError] = useState(null)

  function submit(e) {
    e.preventDefault()
    const result = onAdd({ label, category: kind, isFolder })
    if (result && !result.ok) setError(result.error)
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <form className="sheet" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2 className="sheet__title">Add something new</h2>

        <div className="seg">
          <button
            type="button"
            className={`seg__opt ${!isFolder ? 'is-on' : ''}`}
            onClick={() => setIsFolder(false)}
          >
            A button
          </button>
          <button
            type="button"
            className={`seg__opt ${isFolder ? 'is-on' : ''}`}
            onClick={() => setIsFolder(true)}
          >
            A folder
          </button>
        </div>

        <label className="field__label" htmlFor="add-label">
          {isFolder ? 'Folder name' : 'Word'}
        </label>
        <input
          id="add-label"
          className="sheet__field"
          value={label}
          onChange={(e) => { setLabel(e.target.value); setError(null) }}
          placeholder={isFolder ? 'Swimming club' : 'trampoline'}
          autoFocus
        />

        {!isFolder && (
          <>
            <span className="field__label">What kind of word?</span>
            <div className="kinds">
              {KINDS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  className={`kind ${kind === k.id ? 'is-on' : ''}`}
                  style={{ background: CATEGORY[k.id].bg, color: CATEGORY[k.id].fg }}
                  onClick={() => setKind(k.id)}
                >
                  {k.label}
                </button>
              ))}
            </div>
            <p className="panel__note">
              This only sets the colour. Words of the same colour sit together,
              which makes them faster to find.
            </p>
          </>
        )}

        {error && <p className="sheet__error">{error}</p>}

        <div className="sheet__foot">
          <button type="submit" className="btn btn--primary">Add it</button>
          <button type="button" className="btn btn--quiet" onClick={onClose}>Cancel</button>
        </div>

        <p className="sheet__note">
          New things go on the last page. If that page is full, a new page is
          made. Nothing already on pages 1 or 2 ever moves.
        </p>
      </form>
    </div>
  )
}
