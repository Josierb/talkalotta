import { useState } from 'react'
import { Panel } from './SavedBoardsPanel.jsx'
import { getSettings, setSetting } from '../lib/settings.js'
import { listRemoved, restoreButton, resetAll } from '../lib/customisations.js'
import { resetMemory } from '../lib/slotMemory.js'

export default function SettingsPanel({ onClose, onChanged }) {
  const [settings, setSettings] = useState(getSettings())
  const [removed, setRemoved] = useState(listRemoved())
  const [confirmReset, setConfirmReset] = useState(false)

  const change = (name, value) => { setSettings(setSetting(name, value)); onChanged?.() }

  return (
    <Panel title="Settings" onClose={onClose}>
      <h3 className="panel__sub">Button size</h3>
      <div className="sizerow">
        <input
          id="set-scale"
          type="range"
          min="0.8" max="1.4" step="0.05"
          value={settings.buttonScale}
          onChange={(e) => change('buttonScale', Number(e.target.value))}
        />
        <span className="sizerow__v">{Math.round(settings.buttonScale * 100)}%</span>
      </div>
      <p className="panel__note">
        Bigger buttons mean fewer on screen. Choose what can be seen and
        touched comfortably — never fewer words than someone can handle.
      </p>

      <h3 className="panel__sub">Speaking</h3>
      <label className="check" htmlFor="set-speak">
        <input
          id="set-speak"
          type="checkbox"
          checked={settings.speakOnTap}
          onChange={(e) => change('speakOnTap', e.target.checked)}
        />
        <span>Say each word when it is tapped</span>
      </label>

      <h3 className="panel__sub">Getting into edit mode</h3>
      <label className="check" htmlFor="set-hold">
        <input
          id="set-hold"
          type="checkbox"
          checked={settings.requireHoldForEdit}
          onChange={(e) => change('requireHoldForEdit', e.target.checked)}
        />
        <span>Hold the button to turn editing on</span>
      </label>
      <p className="panel__note">
        Leave this on if the iPad is ever in someone else’s hands.
      </p>

      <h3 className="panel__sub">Removed words</h3>
      {removed.length === 0 ? (
        <p className="panel__empty">Nothing has been removed.</p>
      ) : (
        <ul className="rows">
          {removed.map((r) => (
            <li key={r.key} className="row">
              <span className="row__main"><span className="row__name">{r.label}</span></span>
              <button
                type="button" className="btn btn--primary btn--sm"
                onClick={() => { restoreButton(r.key); setRemoved(listRemoved()); onChanged?.() }}
              >
                Put it back
              </button>
            </li>
          ))}
        </ul>
      )}

      <h3 className="panel__sub">Start over</h3>
      {confirmReset ? (
        <div className="removerow">
          <span className="removerow__t">
            This undoes every change and forgets every remembered slot.
          </span>
          <button type="button" className="btn btn--danger btn--sm"
            onClick={() => { resetAll(); resetMemory(); window.location.reload() }}>
            Reset everything
          </button>
          <button type="button" className="btn btn--quiet btn--sm"
            onClick={() => setConfirmReset(false)}>Cancel</button>
        </div>
      ) : (
        <button type="button" className="btn btn--ghost" onClick={() => setConfirmReset(true)}>
          Restore the original board
        </button>
      )}
    </Panel>
  )
}
