import { PIECE_GLYPHS } from '../lib/pieceGlyphs'

// capturedColor is the colour of the captured pieces themselves (trophies),
// not the side whose tray this is -- white's tray holds the black pieces
// white has captured, and vice versa.
export function CapturedTray({ capturedColor, pieces }) {
  const isWhitePiece = capturedColor === 'white'
  return (
    <div className="captured-tray" aria-hidden="true">
      {pieces.map((pieceType, index) => (
        <span
          key={index}
          className="captured-glyph"
          style={
            isWhitePiece
              ? { color: 'var(--panel)', WebkitTextStroke: '1px var(--ink)', paintOrder: 'stroke fill' }
              : { color: 'var(--ink)' }
          }
        >
          {PIECE_GLYPHS[pieceType]}
        </span>
      ))}
    </div>
  )
}
