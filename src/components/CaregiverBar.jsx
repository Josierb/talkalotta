import { maturity, getVisits, resetMemory } from '../lib/slotMemory.js'

export default function CaregiverBar({ scenario }) {
  const id = scenario?.id
  return (
    <div className="carebar">
      <span className="carebar__tag">Caregiver mode</span>
      {id ? (
        <span className="carebar__stat">
          <b>{scenario.label}</b> &middot; visit {getVisits(id)} &middot; {maturity(id)}
        </span>
      ) : (
        <span className="carebar__stat">Teal dots mark words that returned to the same slot</span>
      )}
      <button
        type="button"
        className="carebar__reset"
        onClick={() => { resetMemory(); window.location.reload() }}
      >
        Reset slot memory
      </button>
    </div>
  )
}
