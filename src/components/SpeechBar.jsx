import { speak } from '../lib/speech.js'

export default function SpeechBar({ message, onClear, caregiverMode, onToggleCaregiver }) {
  const text = message.join(' ')

  return (
    <div className="speechbar">
      <button
        type="button"
        className={`speechbar__mode ${caregiverMode ? 'is-on' : ''}`}
        onClick={onToggleCaregiver}
        title="Caregiver mode"
        aria-label="Caregiver mode"
      >
        <span className="dot" />
      </button>

      <button type="button" className="speechbar__text" onClick={() => speak(text)}>
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
