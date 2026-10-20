// Shows a status image (anger.png for a work-to-rule bishop, zzz.png for a
// sitting-out rook) in the top-right of a piece's square, sized as a
// percentage of the square so it scales with the board. Purely decorative:
// the union card and news feed carry the same information as text.
export function PieceStatusIcon({ src, sizePercent }) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className="piece-status-icon"
      style={{ width: `${sizePercent}%` }}
    />
  )
}
