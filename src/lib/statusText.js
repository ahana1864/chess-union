export function statusText(chess) {
  const toMove = chess.turn() === 'w' ? 'White' : 'Black'
  if (chess.isCheckmate()) {
    return `Checkmate — ${toMove === 'White' ? 'Black' : 'White'} wins`
  }
  if (chess.isStalemate()) return 'Stalemate — draw'
  if (chess.isDraw()) return 'Draw'
  if (chess.isGameOver()) return 'Game over'
  return chess.isCheck() ? `${toMove} to move — check!` : `${toMove} to move`
}
