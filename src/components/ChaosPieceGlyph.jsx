import { PIECE_GLYPHS } from '../lib/pieceGlyphs'
import { iconUrl } from '../lib/assetPath'
import { MoodDot } from './MoodDot'
import { PicketSign } from './PicketSign'
import { PieceStatusIcon } from './PieceStatusIcon'
import { SpeechBubble } from './SpeechBubble'

// Chaos Mode's equivalent of PieceGlyph.jsx: same glyph rendering, but a
// piece can carry a mood dot plus a status badge (sleeping/striking/
// refusing) at once, which the classic badge prop (one badge at a time)
// doesn't support -- kept as its own file rather than extending PieceGlyph
// so classic mode's component never changes.
const CONTAINER_STYLE = {
  position: 'relative',
  width: '100%',
  height: '100%',
  containerType: 'inline-size',
}

const GLYPH_STYLE_BASE = {
  width: '100%',
  height: '100%',
  display: 'grid',
  placeItems: 'center',
  fontFamily: '"Noto Sans Symbols 2", "Segoe UI Symbol", serif',
  fontSize: '72cqi',
  lineHeight: 1,
  fontVariantEmoji: 'text',
  userSelect: 'none',
}

export function ChaosPieceGlyph({ pieceType, isWhite, piece, shake = false, refusing = false, offset = null }) {
  const transform = offset ? `translateY(${offset.y}px)` : undefined
  const status = piece?.status ?? 'calm'

  return (
    <div className={shake ? 'piece-shake' : undefined} style={CONTAINER_STYLE}>
      <div
        style={
          isWhite
            ? { ...GLYPH_STYLE_BASE, color: 'var(--panel)', WebkitTextStroke: '1.5px var(--ink)', paintOrder: 'stroke fill', transform }
            : { ...GLYPH_STYLE_BASE, color: 'var(--ink)', transform }
        }
      >
        {PIECE_GLYPHS[pieceType]}
      </div>
      {piece ? <MoodDot anger={piece.anger} status={status} /> : null}
      {status === 'striking' ? <PicketSign /> : null}
      {status === 'sleeping' ? <PieceStatusIcon src={iconUrl('zzz.png')} sizePercent={45} /> : null}
      {refusing ? <SpeechBubble /> : null}
    </div>
  )
}
