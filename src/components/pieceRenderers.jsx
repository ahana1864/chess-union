import { PIECE_GLYPHS } from '../lib/pieceGlyphs'
import { PieceGlyph } from './PieceGlyph'

function buildPieceRenderers() {
  const renderers = {}
  for (const pieceType of Object.keys(PIECE_GLYPHS)) {
    renderers[`w${pieceType.toUpperCase()}`] = () => (
      <PieceGlyph pieceType={pieceType} isWhite={true} />
    )
    renderers[`b${pieceType.toUpperCase()}`] = () => (
      <PieceGlyph pieceType={pieceType} isWhite={false} />
    )
  }
  return renderers
}

// Keyed like "wP", "bK" etc. to match react-chessboard's PieceRenderObject.
export const pieceRenderers = buildPieceRenderers()
