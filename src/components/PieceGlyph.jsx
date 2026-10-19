import { PIECE_GLYPHS } from '../lib/pieceGlyphs'

const GLYPH_STYLE_BASE = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: "'Noto Sans Symbols 2', serif",
  fontSize: '90%',
  lineHeight: 1,
  userSelect: 'none',
}

export function PieceGlyph({ pieceType, isWhite }) {
  return (
    <div
      style={
        isWhite
          ? {
              ...GLYPH_STYLE_BASE,
              color: 'var(--panel)',
              WebkitTextStroke: '1.5px var(--ink)',
            }
          : { ...GLYPH_STYLE_BASE, color: 'var(--ink)' }
      }
    >
      {PIECE_GLYPHS[pieceType]}
    </div>
  )
}
