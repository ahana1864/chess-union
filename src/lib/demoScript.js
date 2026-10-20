// The six scripted cases for demo mode (?demo=1 / "Watch demo"), each a
// short, self-contained position -- not one long game -- played through
// the real engine (see demoRunner.js). unionOverrides sets union state
// directly only where it saves otherwise-reachable scripted moves; each
// case says why. blockedAttempt names a move that should be refused after
// the scripted moves play, proving the restriction visually without
// actually playing it.
export const DEMO_CASES = [
  {
    id: 'grievance',
    title: 'Unpaid loss',
    caption: 'Lose a pawn for nothing and the union files a grievance.',
    // White king e1, pawn e4; black king e8, pawn d5.
    fen: '4k3/8/8/3p4/4P3/8/8/4K3 b - - 0 1',
    moves: [
      'dxe4', // Black captures White's pawn for free.
      'Ke2', // White's reply doesn't recapture -> unpaid loss #1.
    ],
  },
  {
    id: 'pawn-strike',
    title: 'Pawn strike',
    caption: 'Three strikes and the pawns walk out.',
    // Same shape as "grievance", plus a second White pawn on a2 so one
    // survives the exchange to demonstrate the strike on.
    fen: '4k3/8/8/3p4/4P3/8/P7/4K3 b - - 0 1',
    // White's pawns already have 2 unpaid losses on the books -- saves
    // scripting two more capture-then-quiet-reply cycles just to prime
    // the counter before the one that actually trips the strike.
    unionOverrides: { white: { pawns: { grievance: 2, status: 'grumbling' } } },
    moves: [
      'dxe4', // Unpaid loss #3 -> triggers the strike.
      'Ke2',
      'Kd8', // Black passes so it's White's turn again, pawns still on strike.
    ],
    blockedAttempt: { square: 'a2' },
  },
  {
    id: 'capture-calms',
    title: 'A capture calms things down',
    caption: 'Any capture calms every union.',
    // White king e1, knight d3 (about to capture); black king e8, pawn e5.
    fen: '4k3/8/8/4p3/8/3N4/8/4K3 w - - 0 1',
    // Primes both pawns and minors grievance to 1 so a single capture
    // visibly lowers two meters at once, instead of scripting two
    // separate unpaid-loss cycles first.
    unionOverrides: {
      white: {
        pawns: { grievance: 1, status: 'grumbling' },
        minors: { grievance: 1, status: 'grumbling' },
      },
    },
    moves: ['Nxe5'],
  },
  {
    id: 'minors-work-to-rule',
    title: 'Minors work-to-rule',
    caption: 'Lose two minor pieces for free and your bishops cut corners.',
    // White king e1, knight d4 (about to be lost), bishop c1 (open
    // diagonal to h6); black king e8, pawn e5.
    fen: '4k3/8/8/4p3/3N4/8/8/2B1K3 b - - 0 1',
    // One unpaid minor-piece loss already on the books -- saves scripting
    // an earlier knight-or-bishop loss cycle before the one that trips it.
    unionOverrides: { white: { minors: { grievance: 1, status: 'grumbling' } } },
    moves: [
      'exd4', // Black captures White's knight for free -> unpaid loss #2.
      'Kf1', // White's reply doesn't recapture; doesn't block the c1-h6 diagonal.
      'Kd8', // Black passes so it's White's turn again, minors still restricted.
    ],
    blockedAttempt: { from: 'c1', to: 'f4' }, // 3 squares -- past the 2-square limit.
  },
  {
    id: 'rook-nap',
    title: 'Rook nap',
    caption: 'Overwork a rook and the rooks take a nap.',
    // White king e1, rook a1, plenty of room to shuttle; black king e8.
    fen: '4k3/8/8/8/8/8/8/R3K3 w - - 0 1',
    moves: [
      'Ra4', // 1st consecutive move by this rook.
      'Ke7',
      'Ra1', // 2nd.
      'Kd8',
      'Ra4', // 3rd.
      'Ke7',
      'Ra1', // 4th -> triggers the sit-out.
      'Kd8', // Black passes so it's White's turn again, rook still asleep.
    ],
    blockedAttempt: { square: 'a1' },
  },
  {
    id: 'strike-break',
    title: 'Strike-break',
    caption: 'Even kings cross picket lines.',
    // White boxed in by its own pieces (king e1, queen d1, bishop f1,
    // pawns d2/e2/f2) so every adjacent square is occupied; black knight
    // d3 checks e1 and is only capturable by the e2 pawn -- the single
    // legal response in the whole position.
    fen: '4k3/8/8/8/8/3n4/3PPP2/3QKB2 w - - 0 1',
    // Sets the position AND the union state directly, as the trickiest
    // case to script: White's pawns start already on strike, so the one
    // legal move (the e2 pawn capturing the checking knight) is initially
    // refused by the union -- which is exactly what forces the
    // strike-break the instant this position is evaluated, before any
    // move is scripted. Only the single resulting capture is then played.
    unionOverrides: { white: { pawns: { grievance: 3, status: 'strike', turnsLeft: 3 } } },
    moves: ['exd3'],
  },
]

export const DEMO_END_CARD = {
  title: 'CHESS UNION',
  caption: 'The pieces have a union.',
}
