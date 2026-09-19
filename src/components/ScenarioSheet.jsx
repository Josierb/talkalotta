import { useState } from 'react'
import { RECENT_SCENARIOS, getScenario } from '../lib/scenarioEngine.js'

export default function ScenarioSheet({ onPick, onClose }) {
  const [text, setText] = useState('')

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h2 className="sheet__title">What are you doing?</h2>

        <form
          onSubmit={(e) => { e.preventDefault(); if (text.trim()) onPick(text) }}
        >
          <input
            id="scenario-input"
            className="sheet__field"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="getting ready for swimming..."
            autoFocus
          />
        </form>

        <p className="sheet__label">Recent</p>
        <div className="sheet__chips">
          {RECENT_SCENARIOS.map((id) => (
            <button key={id} type="button" className="chip" onClick={() => onPick(id)}>
              {getScenario(id).label}
            </button>
          ))}
        </div>

        <button type="button" className="sheet__cancel" onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}
