import { PIECE_GLYPHS } from './pieceGlyphs'

const PIECE_TYPES = Object.keys(PIECE_GLYPHS)
const COLORS = ['w', 'b']

// `place-items: center` already centres the glyph's layout box horizontally
// (the font is symmetric enough there that no correction is needed), but
// vertically it centres the *line box* -- sized from the font's own
// ascent/descent metrics (fontBoundingBox*), not the glyph's actual ink
// (actualBoundingBox*). Noto Sans Symbols 2's declared ascent/descent are
// much taller than any single chess glyph actually draws, so the ink ends
// up sitting above the square's true centre. We work out exactly where the
// baseline lands inside the (line-height: 1) line box, then exactly where
// the ink's own vertical centre sits relative to that baseline, and nudge
// by the difference.
export function measureGlyphOffsets(fontSizePx) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx.font = `${fontSizePx}px "Noto Sans Symbols 2"`
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'

  // line-height: 1 means the line box is exactly one fontSizePx tall; the
  // font's natural (ascent + descent) is centred within that box via
  // half-leading, which can be negative (and usually is, here) when the
  // font's metrics are taller than one em.
  const lineBoxHeight = fontSizePx
  const squareSize = fontSizePx / 0.72
  const maxAbs = squareSize * 0.1

  const offsets = {}
  for (const color of COLORS) {
    for (const type of PIECE_TYPES) {
      const metrics = ctx.measureText(PIECE_GLYPHS[type])
      const halfLeading =
        (lineBoxHeight - (metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent)) / 2
      const baselineFromTop = halfLeading + metrics.fontBoundingBoxAscent
      const inkCenterFromBaseline =
        (metrics.actualBoundingBoxDescent - metrics.actualBoundingBoxAscent) / 2
      const inkCenterFromTop = baselineFromTop + inkCenterFromBaseline
      const boxCenterFromTop = lineBoxHeight / 2

      let dy = boxCenterFromTop - inkCenterFromTop
      dy = Math.max(-maxAbs, Math.min(maxAbs, dy))

      offsets[color + type] = { y: dy }
    }
  }
  return offsets
}
