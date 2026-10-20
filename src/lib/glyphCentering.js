import { PIECE_GLYPHS } from './pieceGlyphs'

const PIECE_TYPES = Object.keys(PIECE_GLYPHS)
const COLORS = ['w', 'b']

// `place-items: center` centres the glyph's layout box (driven by the
// font's own ascent/descent and side bearings), not its actual ink -- which
// is why the symbols drift off-centre depending on the glyph. Canvas
// measureText gives the true ink bounding box relative to the draw anchor,
// so we can compute, per glyph, exactly how far to nudge it back.
export function measureGlyphOffsets(fontSizePx) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx.font = `${fontSizePx}px "Noto Sans Symbols 2"`
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'

  const offsets = {}
  for (const color of COLORS) {
    for (const type of PIECE_TYPES) {
      const metrics = ctx.measureText(PIECE_GLYPHS[type])
      offsets[color + type] = {
        x: (metrics.actualBoundingBoxLeft - metrics.actualBoundingBoxRight) / 2,
        y: (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2,
      }
    }
  }
  return offsets
}
