import { Panel } from './SavedBoardsPanel.jsx'
import { topWords, totalTaps, getSuggestions } from '../lib/usage.js'
import { getVisits } from '../lib/slotMemory.js'
import { savedIds } from '../lib/savedBoards.js'

export default function AnalyticsPanel({ onClose, onAction }) {
  const words = topWords(8)
  const total = totalTaps()
  const max = words[0]?.count || 1
  const suggestions = getSuggestions({ visits: getVisits, savedIds: savedIds() })

  return (
    <Panel title="Analytics" onClose={onClose}>
      {total === 0 ? (
        <p className="panel__empty">
          Nothing to show yet. Tap some words and come back.
        </p>
      ) : (
        <>
          <p className="panel__lede">
            {total} taps so far. These are the buttons being used most — useful
            to know before you change or move any of them.
          </p>
          <ul className="rows rows--bare">
            {words.map(({ word, count }) => (
              <li key={word} className="row row--meter">
                <span className="row__word">{word}</span>
                <span className="meter">
                  <i style={{ width: `${Math.round((count / max) * 100)}%` }} />
                </span>
                <span className="row__count">{count}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {suggestions.length > 0 && (
        <>
          <h3 className="panel__sub">Suggestions</h3>
          <ul className="rows rows--bare">
            {suggestions.map((s) => (
              <li key={s.id} className="sugg">
                <span className="sugg__t">{s.text}</span>
                {s.action && (
                  <button type="button" className="btn btn--primary btn--sm"
                    onClick={() => onAction(s)}>{s.actionLabel}</button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  )
}
