export default function EmptyCell({ reserved = false }) {
  return <div className={reserved ? 'cell cell--reserved' : 'cell cell--blank'} aria-hidden="true" />
}
