import { useRef, useState } from 'react'

/**
 * Press and hold to confirm. Used to gate Edit mode: the menu opens freely
 * because browsing it is harmless, but turning editing ON takes a deliberate
 * action so a child tapping around cannot get into it.
 */
export default function HoldButton({ ms = 600, onComplete, className = '', children }) {
  const timer = useRef(null)
  const [holding, setHolding] = useState(false)

  const start = (e) => {
    e.preventDefault()
    setHolding(true)
    timer.current = setTimeout(() => { setHolding(false); onComplete() }, ms)
  }
  const cancel = () => {
    setHolding(false)
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
  }

  return (
    <button
      type="button"
      className={`hold ${holding ? 'is-holding' : ''} ${className}`}
      style={{ '--hold-ms': `${ms}ms` }}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
    >
      <span className="hold__fill" />
      <span className="hold__label">{children}</span>
    </button>
  )
}
