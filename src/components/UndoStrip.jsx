/**
 * Single-level undo, on the board rather than buried in a menu.
 * "Do the thing, then offer to take it back" - never a confirm dialog.
 */
export default function UndoStrip({ description, onUndo, onDismiss }) {
  return (
    <div className="undostrip" role="status">
      <span className="undostrip__t">{description}</span>
      <button type="button" className="undostrip__btn" onClick={onUndo}>Undo</button>
      <button type="button" className="undostrip__x" onClick={onDismiss} aria-label="Dismiss">
        &#10005;
      </button>
    </div>
  )
}
