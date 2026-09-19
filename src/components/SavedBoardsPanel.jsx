import { useState } from 'react'
import { listSaved, saveBoard, deleteBoard } from '../lib/savedBoards.js'

export default function SavedBoardsPanel({ scenario, onLoad, onClose, onChanged }) {
  const [boards, setBoards] = useState(listSaved())
  const [name, setName] = useState(scenario ? scenario.label : '')
  const [confirmId, setConfirmId] = useState(null)

  const refresh = () => { setBoards(listSaved()); onChanged?.() }

  function save() {
    if (!scenario) return
    saveBoard({ name, scenarioId: scenario.id, slots: scenario.slots })
    setName('')
    refresh()
  }

  return (
    <Panel title="Saved boards" onClose={onClose}>
      <p className="panel__lede">
        Keep a board for a place you go often — this restaurant’s menu, this
        park. Saved boards stay exactly as you left them.
      </p>

      {scenario ? (
        <div className="savebox">
          <label className="field__label" htmlFor="save-name">
            Save the board you’re on
          </label>
          <div className="savebox__row">
            <input
              id="save-name"
              className="sheet__field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Flour Bakery"
            />
            <button type="button" className="btn btn--primary" onClick={save}>Save</button>
          </div>
        </div>
      ) : (
        <p className="panel__empty">
          Open a scenario board first, then come back here to save it.
        </p>
      )}

      {boards.length === 0 ? (
        <p className="panel__empty">Nothing saved yet.</p>
      ) : (
        <ul className="rows">
          {boards.map((b) => (
            <li key={b.id} className="row">
              <span className="row__main">
                <span className="row__name">{b.name}</span>
                <span className="row__sub">
                  {b.slots.filter(Boolean).length} words ·
                  saved {new Date(b.savedAt).toLocaleDateString()}
                </span>
              </span>
              <button type="button" className="btn btn--primary btn--sm"
                onClick={() => onLoad(b)}>Open</button>
              {confirmId === b.id ? (
                <>
                  <button type="button" className="btn btn--danger btn--sm"
                    onClick={() => { deleteBoard(b.id); setConfirmId(null); refresh() }}>
                    Delete
                  </button>
                  <button type="button" className="btn btn--quiet btn--sm"
                    onClick={() => setConfirmId(null)}>Keep</button>
                </>
              ) : (
                <button type="button" className="btn btn--quiet btn--sm"
                  onClick={() => setConfirmId(b.id)}>Delete</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

export function Panel({ title, onClose, children }) {
  return (
    <div className="panel">
      <header className="panel__head">
        <h2>{title}</h2>
        <button type="button" className="panel__close" onClick={onClose}>Done</button>
      </header>
      <div className="panel__body">{children}</div>
    </div>
  )
}
