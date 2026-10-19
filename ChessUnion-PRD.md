# Chess Union PRD

Oct 19, 2026 · Ahana

## Overview

Chess Union is a real, playable chess game in the browser with one absurd extra rule: each side's pieces form unions, and if you keep throwing them away for nothing, they go on strike.

The original is chess itself, as played on sites like Lichess and Chess.com. Chess Union keeps the full rules and adds a labour-relations layer on top: grievance meters, strikes, a union rep who narrates the game, and a "Union News" ticker. The twist is also a real strategic trade-off. Sacrificing pawns early buys tempo but costs you your pawns later.

- **What it is:** a desktop website (React) that runs locally. No deployment and no mobile layout.
- **Event:** Neura AI Club STEAL//REMAKE, a solo 24-hour remix hackathon. Judges score originality, functionality, creative value and attribution. Submission: the git repo plus a short video focused on what was built (a showcase, not plain explanations).
- **Constraints met:** no paid APIs or services, no backend, no AI needed (the optional bot is a plain move-picking algorithm), libraries are open source and credited.

## Problem, goals and non-goals

A hackathon "remake" has to be more than a reskin, and a judge has about two minutes to understand it. Chess is instantly recognisable, so the remix has to be visible in the first ten seconds of play.

**Problem**

- A plain chess clone with a new theme would count as a lazy copy.
- Chess knowledge varies among judges, so the new rule must be explained on screen in plain words.
- The demo must show the twist happening, not describe it.

**Goals**

1. A complete, correct game of chess that can be played start to finish.
2. The pawn union strike works reliably and is understood at a glance (meters, banner, picket signs, news line).
3. Desktop only: a laptop browser is the demo view.
4. Works for one person on one laptop (hot-seat) and against a simple bot, with no accounts and no server.

**Non-goals**

- Online multiplayer, accounts, ratings or matchmaking.
- A strong chess engine. The bot only needs to play legal, plausible moves.
- Reproducing Lichess or Chess.com features (analysis, puzzles, clocks).
- Real labour-law accuracy. The unions are a joke, not a simulation.

## Target users

The primary user is a hackathon judge who opens the link or watches the video and decides within a minute or two. The secondary user is a casual player who knows the basic chess rules.

| User | What they need | How Chess Union serves them |
| --- | --- | --- |
| Judge | Understand the remix fast, see it working | Union panel and news ticker visible next to the board; `?demo=1` loads a position where a strike is one move away |
| Casual player | Play without reading a manual | Legal-move dots, plain-English rules modal, funny narration |
| Chess regular | Trust the chess is correct | Full rules from chess.js, with the extra rule clearly separated and explained |

## Game design: the unions

Standard chess rules apply. On top, every piece type can form a union, and both players (and the bot) follow the same rules. These numbers are a first proposal; they live in one config file so they can be tuned in play-testing.

**Key terms**

- **Unpaid loss:** one of your pieces is captured and your very next move does not capture anything.
- **Grievance:** a per-union counter. It goes up by 1 for each unpaid loss of that piece type, and every capture you make lowers all your grievance counters by 1 (minimum 0).
- **Strike:** when a union's grievance reaches its limit, it stops working for a fixed number of your turns. Striking pieces cannot move or capture, but they stay on the board and can be captured.
- **Cooldown:** after a strike ends, the union cannot strike again for 5 of your turns and its grievance resets to 0.

| Union | Trigger | Effect | Priority |
| --- | --- | --- | --- |
| Pawns | 3 unpaid pawn losses | Strike: no pawn moves or captures for 3 of your turns | Core (P0) |
| Bishops | 2 unpaid bishop losses | Work-to-rule: bishops move at most 2 squares for 3 of your turns | Stretch (P1) |
| Rooks | Same rook moves 4 times in a row | Union break: rooks sit out 1 turn | Stretch (P1) |

**Strike-break (the "King crosses the picket line")**

If a strike would leave you with no legal move at all (for example, you are in check and only a striking pawn could capture the attacker), the strike breaks automatically. The union returns to work, goes into cooldown, and the news ticker reports it. This also keeps chess.js's checkmate and stalemate detection correct, because a player always has a legal move unless the game is truly over.

**Decisions to confirm while building**

- Striking pawns still attack squares, so they can give check. They simply cannot move.
- En passant and promotion count as pawn moves, so they are blocked during a strike.
- Castling, check, checkmate, stalemate, threefold repetition and the 50-move rule come straight from chess.js and are unchanged.
- Both sides are symmetrical, and the bot's unions strike too.

## Features

P0 is the whole joke working on both layouts; the project stands on P0 alone. Finish all P0 before any P1.

| ID | Feature | Priority | Done when |
| --- | --- | --- | --- |
| F1 | Playable chess | P0 | Drag-and-drop and click-to-move, legal-move dots, check, checkmate, stalemate and draw detection all work |
| F2 | Pawn union rules | P0 | 3 unpaid pawn losses trigger a 3-turn strike; capturing lowers grievance; cooldown works |
| F3 | Strike-break | P0 | When a strike leaves no legal move, it breaks automatically and the game never gets stuck |
| F4 | Union panel | P0 | Each side shows its unions with a grievance meter and a status chip (Calm, Grumbling, On strike, Cooldown) |
| F5 | Strike visuals | P0 | Striking pawns show a picket sign, a banner announces the strike, and blocked moves explain why |
| F6 | Union News ticker | P0 | Every union event produces a funny headline in a scrolling feed |
| F7 | Hot-seat two players | P0 | Two people can play on one screen with a clear turn indicator |
| F8 | Desktop layout | P0 | At 900px and up: board in the centre, union panel left, news and move list right, no page scroll |
| F9 | ~~Mobile layout~~ | Dropped | Out of scope |
| F10 | Rules modal | P0 | A plain-English "How unions work" explainer opens from the header and on first visit |
| F11 | Bot opponent | P1 | Random or greedy legal-move bot; its unions strike too |
| F12 | Bishop and rook unions | P1 | Work-to-rule and union break behave as in Game design |
| F13 | Demo position (`?demo=1`) | P1 | Loads a position where one more unpaid pawn loss triggers a strike, so the demo is repeatable |
| F14 | Move list and captured pieces | P1 | Algebraic move list and captured-piece trays per side |
| F15 | ~~Installable PWA~~ | Dropped | Out of scope |
| F16 | Sound effects | P2 | Short strike chant and move sounds, with a mute toggle |
| F17 | Undo and resume | P2 | Undo restores union state too; game state survives reload via localStorage |
| F18 | Strictness setting | P2 | Choose strike thresholds: relaxed (4), default (3), militant (2) |

## UI design

Desktop only (900px and up, 1440 × 900 reference); a compact desktop range of 900–1199px must also fit. Exact colours, type and spacing are in UI-SPEC.md, which wins on visuals.

**Visual style**

- Protest-poster look: warm paper background, bold condensed headings, picket-sign cardboard for banners, one strong strike red as the accent.
- A calm, readable board (sage and cream squares) so the chess stays legible and the jokes sit around it.
- Light theme by default. The board and pieces do not change between themes.
- Icon-only buttons need an `aria-label`; all text meets 4.5:1 contrast.

**Desktop layout (three columns, full height, no page scroll)**

| Column | Contents |
| --- | --- |
| Left, about 320px: "The Unions" | Two stacked cards, one per side. Each lists Pawns, Bishops and Rooks with a grievance meter and a status chip (Calm, Grumbling, On strike with turns left, Cooldown). The side to move is highlighted. |
| Centre | Board, as large as fits (up to about 640px), with a player bar above and below (name, side, captured pieces). Strike banner slides over the top of the board. |
| Right, about 360px: "Union News" | Scrolling headline feed (newest first), then the move list, then Undo and Resign buttons. |

**Screens and states**

- **Start screen:** choose Two players or Vs bot, choose your side, Start. The first visit also shows the Rules modal.
- **Game screen:** as above. A move that is blocked by a strike shakes the piece and shows "Pawns are on strike (2 turns left)."
- **Strike banner:** "PAWNS ON STRIKE" with a picket-sign graphic, shown for about 2 seconds, and the pawns wear signs until they return.
- **Game over:** result, a union-flavoured sign-off line, and New game.
- **Rules modal:** three short cards (what is an unpaid loss, what is a strike, what is strike-break) with one tiny example each.

## User flows

The core loop is move, notice the union reaction, adapt. Every flow ends in a visible chess or union result.

**Flow 1: First game**

1. Open the site. The Rules modal explains unions in three short cards.
2. Pick Two players or Vs bot, pick a side, press Start.
3. Play normally. Legal-move dots show where a piece can go.
4. The Union News ticker posts its first headline after the first capture.

**Flow 2: Causing a strike**

1. You lose a pawn and your next move is not a capture. Pawn grievance goes to 1 and a headline appears.
2. It happens twice more. The meter fills and the status changes to Grumbling, then On strike.
3. The banner "PAWNS ON STRIKE" appears and your pawns wear picket signs for 3 of your turns.
4. You try to move a pawn. It shakes and the message "Pawns are on strike (2 turns left)" appears.
5. You capture something with another piece. Grievance drops, the strike ends on schedule, and the union enters cooldown.

**Flow 3: Strike-break**

1. Your pawns are on strike and your king is in check.
2. The only way out is a striking pawn capturing the attacker.
3. The strike breaks. The banner reads "The King crosses the picket line" and a news headline calls it a scandal.
4. The union returns to work in cooldown and you make the move.

**Flow 4: Game end**

1. Checkmate, stalemate or a draw is detected by chess.js.
2. A game-over card shows the result and a union-flavoured sign-off.
3. New game returns to the start screen.

## Technical spec

Chess Union is a frontend-only React app. All game state lives in memory, with optional saving to `localStorage`. There is no backend, no database and no paid service.

**Stack**

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | React + Vite, plain JavaScript | Runs locally with `npm run dev`; no deployment |
| Styling | Plain CSS with CSS variables | Tokens come from UI-SPEC.md; no Tailwind |
| Chess rules | [chess.js](https://github.com/jhlywa/chess.js) | Move generation, validation, check, mate, stalemate, draws. BSD-2-Clause |
| Board UI | [react-chessboard](https://github.com/Clariity/react-chessboard) | Drag and drop, square highlights, custom pieces. MIT. Check its docs for the exact props of the installed version |
| Tests | Vitest | Unit tests for the union rules |
| Icons and fonts | Lucide, Google Fonts (Anton, Barlow, Noto Sans Symbols 2) | Free to use; check each font's licence file |

**Where the rule layer sits**

chess.js knows nothing about unions and will happily accept a pawn move during a strike. So the app keeps its own union state beside the chess.js game and filters moves before they are played:

1. Ask chess.js for the legal moves of the side to move.
2. Remove moves by pieces whose union is on strike (or that break work-to-rule).
3. If that list is empty but chess.js still has legal moves, trigger strike-break for that side and use the full list.
4. Only moves from the filtered list can be played or chosen by the bot. If chess.js reports no legal moves at all, the game is truly over.
5. After each move, update unpaid losses, grievance, strike counters and cooldowns, then emit news events.

**State model**

```
GameState {
  chess: Chess                       // chess.js instance, source of truth for the board
  unions: { white: SideUnions, black: SideUnions }
  news: NewsItem[]                   // newest first
  lastCaptureBy: 'white' | 'black' | null   // for the unpaid-loss check
}
SideUnions {
  pawns:   { grievance, status: 'calm'|'grumbling'|'strike'|'cooldown', turnsLeft }
  bishops: { ... }                   // P1
  rooks:   { ... , consecutiveMoves } // P1
}
```

- **Rules config:** thresholds and durations in one `rulesConfig.js` constants object, so play-testing can change numbers without touching logic.
- **Pure logic:** `applyMove(state, move)` and `legalMoves(state)` are pure functions that return news events as data, so they are easy to test.
- **Undo:** keep a stack of state snapshots (copy of the FEN plus union state) rather than relying on chess.js `undo()`.

**Bot (P1)**

- Random legal move from the filtered list, or a greedy pick that prefers captures and safe squares. It uses the same filter, so its unions strike too.
- No external engine. A stronger engine such as Stockfish is a non-goal; its licence terms have not been checked.

**Component tree**

`App` → `StartScreen`, `Game` (`Board`, `PlayerBar`, `UnionPanel`, `UnionCard`, `NewsFeed`, `MoveList`, `StrikeBanner`), `RulesModal`, `GameOverModal`.

**Edge cases**

- Promotion needs a piece-choice popup; the player must choose.
- Castling and en passant are tested explicitly, since striking pawns affect en passant.
- A striking pawn can still be captured and still counts as attacking squares.
- Fool's mate and other short games must still end correctly with unions in play.
- `localStorage` access is wrapped in try/catch so the game works in private windows.
- Layout is tested at 1024 × 768, 1280 × 720 and 1440 × 900 with no overflow.

## Success criteria and demo

Chess Union succeeds if a judge sees a strike within the first minute and finishes understanding the rule without reading anything.

| Judging criterion | What we show |
| --- | --- |
| Originality | A familiar game with a new, readable rule layer and a strategic trade-off, not a reskin |
| Functionality | A full game with correct chess rules, a bot, the strike, strike-break and checkmate all working; tests pass; runs from the repo with two commands |
| Creative value | Picket signs, banner, union rep narration, news ticker, a funny rules modal |
| Attribution | README credits chess, chess.js, react-chessboard and any assets; "What I changed" section is explicit |

**90-second showcase video (1440 × 900, captions instead of voice-over explanations)**

| Time | Show | Caption |
| --- | --- | --- |
| 0:00–0:08 | Board with the union panel and news ticker visible | Chess, but your pieces have a union |
| 0:08–0:30 | Open `?demo=1`; sacrifice a pawn without capturing; meter rises; headline appears | Waste your pawns and they notice |
| 0:30–0:50 | Third unpaid loss; banner "PAWNS ON STRIKE"; picket signs; try to move a pawn and it refuses | Three strikes and they walk out |
| 0:50–1:10 | Capture with a knight; grievance drops; then a check forces strike-break | Even kings cross picket lines |
| 1:10–1:25 | Quick game against the bot ending in checkmate; game-over card | A real game of chess underneath |
| 1:25–1:30 | End card with repo link | Chess Union · built with chess.js |

## Build plan, risks and cut list

All P0 work is scheduled before any P1. Hour counts are estimates, not measurements. The step-by-step prompts are in PROMPTS.md.

| Hours | Work | Done when |
| --- | --- | --- |
| 0–2 | Scaffold, install chess.js and react-chessboard, board renders, moves play | A full legal game can be played |
| 2–5 | Rules engine + tests: grievance, pawn strike, cooldown, strike-break | Tests pass for the scripted scenarios |
| 5–9 | Union panel, strike banner, picket signs, news ticker, Rules modal | Strike is visible and understandable |
| 9–13 | Desktop layout at all three test sizes | No overflow or clipping |
| 13–16 | Bot, demo position, move list, captured pieces | `?demo=1` always shows a strike within three moves |
| 16–19 | Bishop and rook unions, sounds, polish | Optional features stable or cut |
| 19–21 | README, attribution | A stranger can clone and run it |
| 21–24 | Record the demo video, final check, submit | Repo link and video sent |

**Risks**

| Risk | Mitigation |
| --- | --- |
| Reads as "chess with a gimmick" | Make the rule visible in ten seconds: meters, banner, picket signs, news ticker, funny rules modal |
| Union rules break chess edge cases (check, en passant, promotion) | Strike-break guarantees a legal move; explicit tests for each edge case |
| react-chessboard props differ by version | Read the installed version's docs first; keep board code in one component |
| Judges unfamiliar with chess | Rules modal, legal-move dots, plain-English messages |
| Originality unverified | A quick web search found no obvious existing chess variant with this mechanic, but it was shallow; check the Steal-A-Thon gallery and chessvariants.com before claiming it is new |
| Piece artwork licence | Render pieces as text glyphs (Noto Sans Symbols 2) per UI-SPEC, which avoids the question |

**Cut list (in this order)**

Sound effects, undo and resume, strictness setting, rook union, bishop union, bot. Never cut the pawn strike, strike-break, the union panel or the news ticker.

## Attribution and licensing

Chess Union credits its original and every dependency in the README and on an in-app credits line.

| Item | Role | Licence / note |
| --- | --- | --- |
| Chess | The original game being remixed | An ancient game; no one owns it |
| Lichess, Chess.com | Familiar online chess UIs (inspiration only) | No code or assets copied |
| [chess.js](https://github.com/jhlywa/chess.js) | Rules engine | BSD-2-Clause |
| [react-chessboard](https://github.com/Clariity/react-chessboard) | Board UI | MIT |
| Piece glyphs | Pieces on the board | Rendered from the Noto Sans Symbols 2 font; check its licence file |
| Lucide icons, Google Fonts | UI | Free to use; check each font's licence file |

- The README's "What I changed" section lists the rule layer, the UI, the news system and the bot as the original work.
- Nothing in this project uses paid APIs, AI services or a backend.
