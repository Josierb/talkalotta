import HoldButton from './HoldButton.jsx'

/**
 * The hamburger panel. Four items.
 *
 * It covers part of the board, which means while it is open the communicator
 * cannot talk - so it closes on a tap anywhere outside and is never modal.
 */
export default function MenuPanel({
  editMode, onEnterEdit, onExitEdit, onOpen, onClose, currentBoardName, requireHold,
}) {
  return (
    <div className="menu-backdrop" onClick={onClose}>
      <aside className="menu" onClick={(e) => e.stopPropagation()}>
        <header className="menu__head">
          <h2>Caregiver</h2>
          <button type="button" className="menu__close" onClick={onClose} aria-label="Close">
            &#10005;
          </button>
        </header>

        <p className="menu__now">Showing: <b>{currentBoardName}</b></p>

        <section className="menu__edit">
          <div className="menu__editrow">
            <span className="menu__editlabel">Edit mode</span>
            <span className={`pill ${editMode ? 'pill--on' : ''}`}>
              {editMode ? 'On' : 'Off'}
            </span>
          </div>
          <p className="menu__hint">
            Change a word or add your own picture to any button.
          </p>

          {editMode ? (
            <button type="button" className="btn btn--ghost" onClick={onExitEdit}>
              Turn editing off
            </button>
          ) : requireHold ? (
            <HoldButton className="btn btn--primary" onComplete={onEnterEdit}>
              Hold to turn on
            </HoldButton>
          ) : (
            <button type="button" className="btn btn--primary" onClick={onEnterEdit}>
              Turn editing on
            </button>
          )}
        </section>

        <nav className="menu__nav">
          <button type="button" className="menu__item" onClick={() => onOpen('boards')}>
            <span className="menu__itemname">Saved boards</span>
            <span className="menu__itemsub">Keep a board for a place you go often</span>
          </button>
          <button type="button" className="menu__item" onClick={() => onOpen('analytics')}>
            <span className="menu__itemname">Analytics</span>
            <span className="menu__itemsub">What is being used, and what to add next</span>
          </button>
          <button type="button" className="menu__item" onClick={() => onOpen('settings')}>
            <span className="menu__itemname">Settings</span>
            <span className="menu__itemsub">Button size, voice, removed words</span>
          </button>
        </nav>
      </aside>
    </div>
  )
}
