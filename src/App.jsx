import { useMemo, useState } from 'react'
import SpeechBar from './components/SpeechBar.jsx'
import CaregiverBar from './components/CaregiverBar.jsx'
import ScenarioSheet from './components/ScenarioSheet.jsx'
import Button from './components/Button.jsx'
import EmptyCell from './components/EmptyCell.jsx'

import { BOARDS, SCENARIO_PINNED_ROW, GRID_COLUMNS, SCENARIO_SLOTS } from './data/boards.js'
import { placeWords, recordVisit } from './lib/slotMemory.js'
import { resolveScenario, suggestFromLocation, getScenario } from './lib/scenarioEngine.js'
import { speak } from './lib/speech.js'

export default function App() {
  const [boardId, setBoardId] = useState('core-1')
  const [scenario, setScenario] = useState(null)   // { id, label, slots }
  const [message, setMessage] = useState([])
  const [caregiverMode, setCaregiverMode] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  const board = BOARDS[boardId]
  const byId = useMemo(() => {
    const map = {}
    for (const b of board.buttons) map[b.id] = b
    return map
  }, [board])

  function say(word) {
    setMessage((m) => [...m, word])
    speak(word)
  }

  async function loadScenario(input) {
    const found = typeof input === 'string' && getScenario(input)
      ? getScenario(input)
      : await resolveScenario(input)
    if (!found) return

    recordVisit(found.id)
    const slots = placeWords(found.id, found.words, SCENARIO_SLOTS)
    setScenario({ ...found, slots })
    setSheetOpen(false)
  }

  function handlePress(button) {
    if (button.loadBoard) {
      if (BOARDS[button.loadBoard]) {
        setBoardId(button.loadBoard)
        setScenario(null)
      }
      return
    }
    if (button.scenario === 'typed') { setSheetOpen(true); return }
    if (button.scenario === 'context') { suggestFromLocation().then((s) => loadScenario(s.id)); return }
    say(button.label)
  }

  const inScenario = Boolean(scenario)

  return (
    <div className="app">
      <SpeechBar
        message={message}
        onClear={() => setMessage([])}
        caregiverMode={caregiverMode}
        onToggleCaregiver={() => setCaregiverMode((v) => !v)}
      />

      {caregiverMode && <CaregiverBar scenario={scenario} />}

      <div className="board" style={{ '--cols': GRID_COLUMNS }}>
        {inScenario ? (
          <>
            <p className="board__zone">
              {scenario.label} &middot; core words stay pinned
            </p>
            <div className="board__grid">
              {SCENARIO_PINNED_ROW.map((cell, i) =>
                cell.category === 'nav' ? (
                  <Button
                    key={`pin-${i}`}
                    button={{ ...cell, id: `pin-${i}` }}
                    onPress={() => setScenario(null)}
                  />
                ) : (
                  <Button key={`pin-${i}`} button={{ ...cell, id: `pin-${i}` }} onPress={handlePress} />
                )
              )}
            </div>

            <div className="board__rule" />

            <p className="board__zone">
              scenario words &middot; slots remembered between visits
            </p>
            <div className="board__grid">
              {scenario.slots.map((slot, i) =>
                slot ? (
                  <Button
                    key={`slot-${i}`}
                    button={{ id: `slot-${i}`, label: slot.word, category: 'noun' }}
                    onPress={handlePress}
                    remembered={slot.remembered}
                    showDebug={caregiverMode}
                  />
                ) : (
                  <EmptyCell key={`slot-${i}`} reserved />
                )
              )}
            </div>
          </>
        ) : (
          <div className="board__grid">
            {board.grid.order.flat().map((id, i) =>
              id ? (
                <Button key={id} button={byId[id]} onPress={handlePress} />
              ) : (
                <EmptyCell key={`empty-${i}`} />
              )
            )}
          </div>
        )}
      </div>

      {sheetOpen && (
        <ScenarioSheet onPick={loadScenario} onClose={() => setSheetOpen(false)} />
      )}
    </div>
  )
}
