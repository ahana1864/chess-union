import { Chess } from 'chess.js'

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

// The bot only ever promotes to a queen. Under-promoting needs a specific
// tactical reason it doesn't reason about, so it's never a good default —
// drop the non-queen promotion options chess.js also offers for the same
// from/to square.
function preferredMoves(moves) {
  const hasQueenChoice = moves.some((move) => move.promotion === 'q')
  if (!hasQueenChoice) return moves
  return moves.filter((move) => !move.promotion || move.promotion === 'q')
}

function pickRandom(list, rng) {
  return list[Math.floor(rng() * list.length)]
}

// Captures by piece value, then penalises moves that leave the moved piece
// hanging (attacked by the opponent and undefended) by that piece's own
// value. One ply of lookahead, not a real search — just enough to avoid the
// most obvious blunders and look like a plausible opponent.
function scoreMove(chess, move) {
  const captureValue = move.captured ? PIECE_VALUES[move.captured] : 0

  const after = new Chess(chess.fen())
  after.move(move)

  const opponentColor = move.color === 'w' ? 'b' : 'w'
  const isHanging =
    after.isAttacked(move.to, opponentColor) && !after.isAttacked(move.to, move.color)
  const hangingPenalty = isHanging ? PIECE_VALUES[move.promotion ?? move.piece] : 0

  return captureValue - hangingPenalty
}

// Picks a move for the side to move from an already union-filtered move
// list (the same legalMoves() result the human player's board uses), so
// the bot's own unions strike too — it just never gets offered a move a
// striking piece would have to make.
export function pickBotMove(chess, moves, { mode = 'greedy', rng = Math.random } = {}) {
  if (moves.length === 0) return null

  const candidates = preferredMoves(moves)
  if (mode === 'random') return pickRandom(candidates, rng)

  let bestScore = -Infinity
  let best = []
  for (const move of candidates) {
    const score = scoreMove(chess, move)
    if (score > bestScore) {
      bestScore = score
      best = [move]
    } else if (score === bestScore) {
      best.push(move)
    }
  }
  return pickRandom(best, rng)
}
