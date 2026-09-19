import { speak } from '../lib/speech.js'

export default function SpeechBar({ message, onClear, onOpenMenu, editMode }) {
  const text = message.join(' ')

  return (
    <div className="speechbar">
      <button
        type="button"
        className={`speechbar__menu ${editMode ? 'is-editing' : ''}`}
        onClick={onOpenMenu}
        aria-label="Caregiver menu"
        title="Caregiver menu"
      >
        <span /><span /><span />
      </button>

      <button
        type="button"
        className="speechbar__text"
        onClick={() => !editMode && speak(text)}
      >
        {text || <span className="speechbar__hint">TalkALotta</span>}
      </button>

      <button
        type="button"
        className="speechbar__clear"
        onClick={onClear}
        aria-label="Clear message"
      >
        &#10005;
      </button>
    </div>
  )
}
