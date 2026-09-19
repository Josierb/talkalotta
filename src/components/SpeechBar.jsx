import { useRef } from 'react'
import { speak } from '../lib/speech.js'

export const MESSAGE_CAP = 12

/**
 * The message bar.
 *
 * Jake's dad, on the real device: "he'll get 30 words up here and then
 * accidentally hit this so it'll just say gibberish... you double tap the
 * backspace bar and it stops the process."
 *
 * So: a hard cap on sentence length, and the clear key behaves the way Jake
 * already has motor memory for - one tap takes the last word back, two taps
 * clear the whole thing. We match the interaction he already knows rather than
 * inventing our own.
 */
export default function SpeechBar({
  message, onBackspace, onClear, onOpenMenu, editMode,
}) {
  const text = message.join(' ')
  const lastTap = useRef(0)
  const timer = useRef(null)
  const nearFull = message.length >= MESSAGE_CAP - 3

  function handleClearKey() {
    const now = Date.now()
    if (now - lastTap.current < 350) {       // double tap - clear everything
      if (timer.current) { clearTimeout(timer.current); timer.current = null }
      lastTap.current = 0
      onClear()
      return
    }
    lastTap.current = now
    timer.current = setTimeout(() => { timer.current = null; onBackspace() }, 350)
  }

  return (
    <div className="speechbar">
      <button
        type="button"
        className={`speechbar__menu ${editMode ? 'is-editing' : ''}`}
        onClick={onOpenMenu}
        aria-label="Caregiver menu"
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

      {nearFull && (
        <span className={`speechbar__count ${message.length >= MESSAGE_CAP ? 'is-full' : ''}`}>
          {message.length}/{MESSAGE_CAP}
        </span>
      )}

      <button
        type="button"
        className="speechbar__clear"
        onClick={handleClearKey}
        aria-label="Delete last word, or tap twice to clear"
        title="Tap to delete the last word · tap twice to clear"
      >
        &#9003;
      </button>
    </div>
  )
}
