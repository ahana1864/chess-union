# Chess Union — project notes for Claude

## What this is

Chess Union is a real, playable chess game (React, frontend-only) with one extra
rule: pieces form unions, and if you keep throwing them away for nothing, they
go on strike. Built solo for the Neura AI Club STEAL//REMAKE 24-hour hackathon.
Desktop-only, runs locally — no mobile layout, no PWA, no deployment.
Full behaviour spec: `ChessUnion-PRD.md` (wins on behaviour). Full visual spec:
`UI-SPEC.md` (wins on visuals). Build steps: `PROMPTS.md`.

## Stack

- React + Vite, plain JavaScript (no TypeScript, no Tailwind).
- Plain CSS with CSS variables, tokens from UI-SPEC.md.
- [chess.js](https://github.com/jhlywa/chess.js) (BSD-2-Clause) — rules engine,
  move generation, check/mate/stalemate/draw detection. Source of truth for the
  board. Read the installed version's README/types before using its API —
  don't rely on memory, the API has changed across versions.
- [react-chessboard](https://github.com/Clariity/react-chessboard) (MIT) —
  board UI, drag/drop, highlights. Read the installed version's docs before
  using its props.
- Vitest — unit tests for the union rules engine.
- oxlint — linting.
- No backend, no database, no paid APIs, no AI services.

## Feature checklist (F1–F18)

Desktop only (900px+, laptop browser). No mobile layout, no PWA, no deployment
— the app runs locally with `npm run dev`. F9 (mobile layout) and F15
(installable PWA) are dropped from scope.

P0 — the whole joke working on desktop; the project stands on P0 alone.

- F1 Playable chess — drag/drop + click-to-move, legal-move dots, check/mate/stalemate/draw
- F2 Pawn union rules — 3 unpaid pawn losses → 3-turn strike; captures lower grievance; cooldown
- F3 Strike-break — a strike that would leave no legal move breaks automatically
- F4 Union panel — grievance meter + status chip (Calm, Grumbling, On strike, Cooldown) per union
- F5 Strike visuals — picket signs, strike banner, blocked-move toast
- F6 Union News ticker — funny headline per union event
- F7 Hot-seat two players — clear turn indicator
- F8 Desktop layout (900px+) — unions / board / news+moves, no page scroll
- F10 Rules modal — plain-English explainer, opens from header and on first visit

P1 — stretch, after all P0 is done.

- F11 Bot opponent — random or greedy legal-move bot; its unions strike too
- F12 Minors (bishops/knights) and rook unions — work-to-rule and union break
- F13 Demo position (`?demo=1`, `?demo=2`) — repeatable scripted scenarios
- F14 Move list and captured-piece trays

P2 — optional polish, cut first if time runs short.

- F16 Sound effects with mute toggle
- F17 Undo and resume (undo restores union state; resume via localStorage)
- F18 Strictness setting — relaxed (4) / default (3) / militant (2)

## Union rules (the game's twist)

- **Unpaid loss:** a piece is captured and the very next move by that side is
  not a capture.
- **Grievance:** per-union counter. +1 per unpaid loss of that piece type;
  every capture made lowers *all* that side's grievance counters by 1 (min 0).
- **Strike:** when a union's grievance hits its limit, that union can't move
  or capture for a fixed number of that side's turns. Striking pieces stay on
  the board and can still be captured (and striking pawns still attack
  squares, so they can give check).
- **Cooldown:** after a strike ends, that union can't strike again for 5 of
  that side's turns; grievance resets to 0.
- **Strike-break ("the King crosses the picket line"):** if the striking
  union leaves the side with zero legal moves (e.g. in check, only a striking
  pawn can capture the attacker), the strike breaks immediately — the union
  returns to work, enters cooldown, and a news headline reports it. This
  guarantees chess.js's checkmate/stalemate detection stays correct, since a
  side always has a legal move unless the game is truly over.
- **Thresholds (P0 pawns, from `rulesConfig.js`):** 3 unpaid losses → strike;
  strike lasts 3 turns; cooldown lasts 5 turns.
- **Stretch unions (P1):** Minors — bishop and knight unpaid losses share one
  grievance counter; at 2, remaining bishops work to rule (max 2-square
  moves) for 3 turns (knights are never restricted, even though a knight
  loss counts toward the grievance). If no bishop is left, nothing is
  restricted. Shown with the anger icon over each restricted bishop — no
  picket sign, no strike banner. Rooks — same rook moved 4 times in a row →
  sits out 1 turn, shown with the zzz icon over each rook, no banner.
- En passant and promotion count as pawn moves, so both are blocked during a
  pawn strike. Castling, check, checkmate, stalemate, threefold repetition
  and the 50-move rule are unchanged, straight from chess.js.
- Both sides, including the bot, are symmetrical and follow the same rules.

## File layout

```
ChessUnion-PRD.md       behaviour spec (wins on behaviour)
UI-SPEC.md              visual spec (wins on visuals)
PROMPTS.md              step-by-step build prompts, run one at a time
DEMO.md                 demo video shot list
CLAUDE.md               this file
index.html
vite.config.js
src/
  main.jsx              React entry point
  App.jsx               root component
  index.css             global styles / CSS variable tokens
  lib/                  pure, React-free logic
    rulesConfig.js       union thresholds/durations (P0 step 2)
    unionRules.js        union state machine: createUnionState, legalMoves,
                          applyMove (P0 step 2)
    bot.js                bot move picker (P1 step 7)
    *.test.js             Vitest unit tests next to the code they test
  components/            React components (Board, UnionPanel, UnionCard,
                          NewsFeed, MoveList, StrikeBanner, RulesModal,
                          GameOverModal, ...) — added from step 3 onward
  hooks/
    useGame.js            holds chess.js game + union state + undo snapshots
                          (added step 3)
```

## Working rules

- ChessUnion-PRD.md wins on behaviour; UI-SPEC.md wins on visuals. Read both
  fully before changing either rules or UI.
- The game rules come from chess.js. Read the installed version's README or
  types before using its API, and read react-chessboard's docs for the
  installed version before using its props. Never rely on memory for either.
- Keep code simple. Add a short comment only where the *why* is not obvious,
  so any piece can be explained to judges on the spot.
- Finish all P0 before any P1 or P2. Desktop only (900px and up); no mobile
  layout, no PWA, no deployment — the app runs locally with `npm run dev`.
- Never cut the pawn strike, strike-break, the union panel or the news
  ticker — in that order, those four are non-negotiable even under time
  pressure.
- No paid APIs, no backend, no AI services. Plain JavaScript, plain CSS with
  variables, no Tailwind.
- Build steps are run one at a time from PROMPTS.md: do only the first
  unchecked step, run build/lint/test, tick its box, commit, then stop for
  review before starting the next step.
