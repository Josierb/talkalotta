import { useRef, useState } from 'react'
import { fileToThumbnail } from '../lib/customisations.js'
import { getCount } from '../lib/usage.js'

const GUARD_THRESHOLD = 25 // taps before we warn about changing a button

export default function EditSheet({ button, onSave, onRemove, onClose }) {
  const original = button.originalLabel || button.label
  const [word, setWord] = useState(button.label)
  const [image, setImage] = useState(button.image || null)
  const [error, setError] = useState(null)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const fileRef = useRef(null)

  const taps = getCount(original)
  const wellUsed = taps >= GUARD_THRESHOLD
  const renaming = word.trim() !== button.label

  async function pickFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    try {
      setImage(await fileToThumbnail(file))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet sheet--edit" onClick={(e) => e.stopPropagation()}>
        <header className="sheet__head">
          <h2 className="sheet__title">Edit “{original}”</h2>
          {taps > 0 && <span className="sheet__taps">tapped {taps} times</span>}
        </header>

        {/* The relearning guardrail. Warn, explain the cost, never block. */}
        {wellUsed && renaming && (
          <div className="guard">
            <p className="guard__t">
              This button has been tapped {taps} times.
            </p>
            <p className="guard__d">
              Changing the word means relearning what it says. Adding your own
              picture keeps the word the same and usually helps more.
            </p>
          </div>
        )}

        <label className="field__label" htmlFor="edit-word">Word</label>
        <input
          id="edit-word"
          className="sheet__field"
          value={word}
          onChange={(e) => setWord(e.target.value)}
        />

        <label className="field__label">Picture</label>
        <div className="picker">
          <div className="picker__preview">
            {image
              ? <img src={image} alt="" />
              : <span className="picker__none">Using the symbol library</span>}
          </div>
          <div className="picker__actions">
            <button type="button" className="btn btn--ghost"
              onClick={() => fileRef.current?.click()}>
              Choose a photo
            </button>
            {image && (
              <button type="button" className="btn btn--quiet" onClick={() => setImage(null)}>
                Use the symbol instead
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            id="edit-image"
            type="file"
            accept="image/*"
            hidden
            onChange={pickFile}
          />
        </div>

        {error && <p className="sheet__error">{error}</p>}

        <footer className="sheet__foot">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => onSave({ label: word.trim() || original, image })}
          >
            Done
          </button>

          {confirmRemove ? (
            <span className="removerow">
              <span className="removerow__t">Remove it?</span>
              <button type="button" className="btn btn--danger"
                onClick={() => onRemove(original)}>Remove</button>
              <button type="button" className="btn btn--quiet"
                onClick={() => setConfirmRemove(false)}>Keep</button>
            </span>
          ) : (
            <button type="button" className="btn btn--quiet"
              onClick={() => setConfirmRemove(true)}>
              Remove this button
            </button>
          )}
        </footer>

        <p className="sheet__note">
          Changes save as you go. You can undo, and removed buttons can be put
          back from Settings.
        </p>
      </div>
    </div>
  )
}
