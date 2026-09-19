import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import SpeechBar, { MESSAGE_CAP } from './components/SpeechBar.jsx'
import MenuPanel from './components/MenuPanel.jsx'
import EditSheet from './components/EditSheet.jsx'
import AddSheet from './components/AddSheet.jsx'
import UndoStrip from './components/UndoStrip.jsx'
import ScenarioSheet from './components/ScenarioSheet.jsx'
import SavedBoardsPanel from './components/SavedBoardsPanel.jsx'
import AnalyticsPanel from './components/AnalyticsPanel.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import Button from './components/Button.jsx'
import EmptyCell from './components/EmptyCell.jsx'

import { SCENARIO_PINNED_ROW, GRID_COLUMNS, SCENARIO_SLOTS } from './data/boards.js'
import { resolveBoard, addItem, removeItemAt, pagePosition } from './lib/userBoards.js'
import { placeWords, recordVisit } from './lib/slotMemory.js'
import { resolveScenario, suggestFromLocation, getScenario } from './lib/scenarioEngine.js'
import { speak } from './lib/speech.js'
import { recordUse } from './lib/usage.js'
import { getSettings } from './lib/settings.js'
import { saveBoard } from './lib/savedBoards.js'
import {
  decorate, isRemoved, applyChange, removeButton, undoLast, buttonKey,
} from './lib/customisations.js'

export default function App() {
  const [boardId, setBoardId] = useState('core-1')
  const [scenario, setScenario] = useState(null)
  const [message, setMessage] = useState([])

  const [menuOpen, setMenuOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [panel, setPanel] = useState(null)
  const [editing, setEditing] = useState(null)
  const [adding, setAdding] = useState(false)
  const [undo, setUndo] = useState(null)      // { description, action }
  const [sheetOpen, setSheetOpen] = useState(false)
  const [revision, setRevision] = useState(0)

  const [settings, setSettings] = useState(getSettings())
  const bump = useCallback(() => setRevision((r) => r + 1), [])

  const board = useMemo(() => resolveBoard(boardId) || resolveBoard('core-1'), [boardId, revision])
  const context = scenario ? `scn:${scenario.id}` : boardId

  /* ---- edit mode auto-exits when left alone -------------------------- */
  const idleTimer = useRef(null)
  const touchEdit = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => setEditMode(false), settings.editIdleExitMs)
  }, [settings.editIdleExitMs])

  useEffect(() => {
    if (!editMode) { if (idleTimer.current) clearTimeout(idleTimer.current); return }
    touchEdit()
    return () => { if (idleTimer.current) clearTimeout(idleTimer.current) }
  }, [editMode, touchEdit])

  const decorated = useMemo(() => {
    const map = {}
    for (const b of board.buttons) {
      const d = decorate(b, boardId)
      if (!isRemoved(d.key)) map[b.id] = d
    }
    return map
  }, [board, boardId, revision])

  /* ---- actions ------------------------------------------------------- */
  function say(word) {
    // Hard cap. Without one the bar fills with dozens of words and speaks
    // gibberish - the exact failure Jake's dad demonstrated on the real device.
    setMessage((m) => (m.length >= MESSAGE_CAP ? m : [...m, word]))
    recordUse(word, scenario?.id || null)
    if (settings.speakOnTap) speak(word)
  }

  async function loadScenario(input) {
    const found = typeof input === 'string' && getScenario(input)
      ? getScenario(input)
      : await resolveScenario(input)
    if (!found) return
    recordVisit(found.id)
    setScenario({ ...found, slots: placeWords(found.id, found.words, SCENARIO_SLOTS) })
    setSheetOpen(false)
  }

  function loadSavedBoard(saved) {
    setScenario({
      id: saved.scenarioId,
      label: saved.name,
      words: saved.slots.filter(Boolean),
      slots: saved.slots.map((w) => (w ? { word: w, remembered: true } : null)),
      saved: true,
    })
    setPanel(null)
  }

  function handlePress(button) {
    if (editMode) { touchEdit(); setEditing(button); return }
    if (button.loadBoard) {
      if (resolveBoard(button.loadBoard)) { setBoardId(button.loadBoard); setScenario(null) }
      return
    }
    if (button.scenario === 'typed') { setSheetOpen(true); return }
    if (button.scenario === 'context') {
      suggestFromLocation().then((r) => loadScenario(r.scenario.id))
      return
    }
    say(button.label)
  }

  function saveEdit({ label, image }) {
    const key = editing.key || buttonKey(context, editing.label)
    const original = editing.originalLabel || editing.label
    const result = applyChange(key, { label, image },
      label !== original ? `Changed “${original}” to “${label}”` : `Updated “${original}”`)
    if (!result.ok) { window.alert(result.error); return }
    setUndo({ description: result.description, action: () => { undoLast(); bump() } })
    setEditing(null); touchEdit(); bump()
  }

  function removeEdited(originalLabel) {
    const key = editing.key || buttonKey(context, originalLabel)
    const result = removeButton(key, originalLabel, context)
    setUndo({ description: result.description, action: () => { undoLast(); bump() } })
    setEditing(null); touchEdit(); bump()
  }

  /** Create a button or folder. Lands on the last page, making one if needed. */
  function handleAdd({ label, category, isFolder }) {
    const result = addItem({ label, category, isFolder }, boardId)
    if (!result.ok) return result

    setAdding(false)
    setScenario(null)
    setBoardId(result.boardId)          // go to where it landed
    setUndo({
      description: result.newPage
        ? `Added “${label}” on a new page`
        : `Added “${label}”`,
      action: () => { removeItemAt(result.boardId, result.slot); bump() },
    })
    touchEdit()
    bump()
    return result
  }

  function runSuggestion(s) {
    if (s.action === 'save-board' && scenario && scenario.id === s.payload) {
      saveBoard({ name: scenario.label, scenarioId: scenario.id, slots: scenario.slots })
      setPanel(null)
    } else if (s.action === 'save-board') setPanel('boards')
  }

  const inScenario = Boolean(scenario)
  const { index: pageNumber, total: pageTotal } = pagePosition(boardId)
  const boardName = inScenario ? scenario.label : board.name

  return (
    <div className={`app ${editMode ? 'is-editing' : ''}`}
         style={{ '--scale': settings.buttonScale }}>
      <SpeechBar
        message={message}
        onBackspace={() => setMessage((m) => m.slice(0, -1))}
        onClear={() => setMessage([])}
        onOpenMenu={() => setMenuOpen(true)}
        editMode={editMode}
      />

      {editMode && (
        <div className="editbanner">
          <span>
            Editing{!inScenario && pageTotal > 1
              ? ` — ${board.name}, page ${pageNumber} of ${pageTotal}` : ''} — tap any button to change it
          </span>
          {!inScenario && (
            <button type="button" className="btn btn--onbanner" onClick={() => setAdding(true)}>
              + Add
            </button>
          )}
          <button type="button" className="btn btn--onbanner" onClick={() => setEditMode(false)}>
            Done
          </button>
        </div>
      )}

      <div className="board" style={{ '--cols': GRID_COLUMNS }}>
        {inScenario ? (
          <>
            <p className="board__zone">{scenario.label} · core words stay pinned</p>
            <div className="board__grid">
              {SCENARIO_PINNED_ROW.map((cell, i) => (
                <Button
                  key={`pin-${i}`}
                  button={{ ...cell, id: `pin-${i}` }}
                  editMode={editMode}
                  onPress={cell.category === 'nav' && !editMode
                    ? () => setScenario(null) : handlePress}
                />
              ))}
            </div>
            <div className="board__rule" />
            <p className="board__zone">scenario words · slots remembered between visits</p>
            <div className="board__grid">
              {scenario.slots.map((slot, i) => {
                if (!slot) return <EmptyCell key={`slot-${i}`} reserved />
                const d = decorate({ id: `slot-${i}`, label: slot.word, category: 'noun' }, context)
                if (isRemoved(d.key)) return <EmptyCell key={`slot-${i}`} reserved />
                return (
                  <Button key={`slot-${i}`} button={d} onPress={handlePress}
                          remembered={slot.remembered} showDebug={editMode} editMode={editMode} />
                )
              })}
            </div>
          </>
        ) : (
          <div className="board__grid">
            {board.grid.order.flat().map((id, i) => {
              const d = id ? decorated[id] : null
              return d
                ? <Button key={id} button={d} onPress={handlePress} editMode={editMode} />
                : <EmptyCell key={`empty-${i}`} reserved={editMode} />
            })}
          </div>
        )}
      </div>

      {undo && (
        <UndoStrip
          description={undo.description}
          onUndo={() => { undo.action(); setUndo(null) }}
          onDismiss={() => setUndo(null)}
        />
      )}

      {menuOpen && (
        <MenuPanel
          editMode={editMode}
          currentBoardName={boardName}
          requireHold={settings.requireHoldForEdit}
          onEnterEdit={() => { setEditMode(true); setMenuOpen(false) }}
          onExitEdit={() => setEditMode(false)}
          onOpen={(which) => { setPanel(which); setMenuOpen(false) }}
          onClose={() => setMenuOpen(false)}
        />
      )}

      {editing && (
        <EditSheet button={editing} onSave={saveEdit} onRemove={removeEdited}
                   onClose={() => setEditing(null)} />
      )}
      {adding && <AddSheet onAdd={handleAdd} onClose={() => setAdding(false)} />}
      {sheetOpen && <ScenarioSheet onPick={loadScenario} onClose={() => setSheetOpen(false)} />}

      {panel === 'boards' && (
        <SavedBoardsPanel scenario={scenario} onLoad={loadSavedBoard}
                          onClose={() => setPanel(null)} onChanged={bump} />
      )}
      {panel === 'analytics' && (
        <AnalyticsPanel onClose={() => setPanel(null)} onAction={runSuggestion} />
      )}
      {panel === 'settings' && (
        <SettingsPanel onClose={() => { setSettings(getSettings()); setPanel(null) }}
                       onChanged={() => { setSettings(getSettings()); bump() }} />
      )}
    </div>
  )
}
