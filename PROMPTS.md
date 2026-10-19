# Chess Union build prompts

## How to run this file

Paste this once to Claude Code, then just say "next":

> Read PROMPTS.md. Do the first unchecked step only. Run `npm run build`, `npm run lint` and `npm test` (once they exist). Tick the step's box, `git commit` with a clear message, then STOP with a summary of 5 lines or fewer: what changed, anything you were unsure about, and exactly what I should check by hand (screen, interaction, viewport). Do not start the next step until I say "next". If something is ambiguous and costly to redo, ask me before building.

Rules for every step:
- ChessUnion-PRD.md wins on behaviour; UI-SPEC.md wins on visuals. Read both fully before step 0.
- The game rules come from chess.js. Read the installed version's README or types before using its API, and read react-chessboard's docs for the installed version before using its props. Never rely on memory for either.
- Keep code simple. Add a short comment only where the *why* is not obvious, so I can explain any piece to judges.
- Finish all P0 before any P1 or P2. Both layouts matter: mobile (under 900px) and desktop (900px and up, the primary demo view).
- Never cut the pawn strike, strike-break, the union panel or the news ticker.
- No paid APIs, no backend, no AI services. Plain JavaScript, plain CSS with variables, no Tailwind.

---

## Steps

- [x] **0. Kickoff and scaffold**
  Read ChessUnion-PRD.md and UI-SPEC.md. Create CLAUDE.md summarising: what the project is, the stack, the feature checklist F1 to F18 with priorities, the union rules (unpaid loss, grievance, strike, cooldown, strike-break, thresholds), the file layout, and these working rules. Scaffold Vite + React (JavaScript). Install chess.js, react-chessboard, vitest and oxlint. Add scripts `dev`, `build`, `lint`, `test`. Write a smoke test that plays a short legal game with chess.js and checks check and checkmate detection (fool's mate). Make the first git commit.
  Done when: `npm run build`, `npm run lint` and `npm test` all pass, `npm run dev` shows an empty page, and CLAUDE.md exists.

- [x] **1. Plain chess** (F1)
  Build the board with react-chessboard: drag and drop plus click-to-move, legal-move dots, capture rings, last-move highlight, selected square, coordinates, and a promotion picker (the player must choose). Show check, checkmate, stalemate and draw states and a New game button. Render pieces as text glyphs in Noto Sans Symbols 2 per UI-SPEC (white pieces `--panel` with an ink stroke, black pieces ink), which also avoids a piece-licence question. Use the UI-SPEC board colours. No unions yet.
  Done when: two people can play a full legal game including castling, en passant, promotion and checkmate; layout does not need to be final.

- [ ] **2. Union rules engine** (F2, F3)
  Create `src/lib/rulesConfig.js` (all thresholds and durations as one exported object) and `src/lib/unionRules.js` as pure functions with no React: `createUnionState()`, `legalMoves(chess, unions)`, `applyMove(state, move)`, plus news events returned as data (event type and parameters, no text). Implement the Game design section of the PRD for the pawn union: unpaid loss detection, grievance up on unpaid pawn loss and down on any capture, strike at 3 for 3 of that side's turns, cooldown of 5 turns, strike-break when the filtered list is empty but chess.js still has legal moves. Write Vitest tests for: an unpaid loss, a paid loss (immediate recapture), grievance falling on capture, strike trigger and expiry, cooldown blocks a new strike, strike-break when in check, en passant and promotion blocked during a strike, fool's mate still ends correctly. No UI in this step.
  Done when: all tests pass and the test names read like the rules.

- [ ] **3. Wire the rules into the game** (F2, F3)
  Create a `useGame` hook that holds the chess.js game, the union state and a snapshot stack for undo. Legal-move dots and drops come from `legalMoves` (filtered). A blocked pawn move shows a plain message and does not change the game. Add a temporary debug line showing each side's grievance and status.
  Done when: by hand you can sacrifice three pawns without capturing, see the strike start, fail to move a pawn, and see it end on schedule; strike-break works when you are in check.

- [ ] **4. Union panel, strike visuals, news** (F4, F5, F6)
  Build `UnionPanel` and `UnionCard` (meters and status chips per UI-SPEC), `StrikeBanner` ("PAWNS ON STRIKE" and "The King crosses the picket line"), picket signs on striking pawns, the blocked-move toast with a pawn shake, and `NewsFeed` with a headline function that turns events into text. Write at least three funny headline variants per event type (grievance filed, grumbling, strike, strike ends, cooldown, strike-break, capture calms things down) and choose deterministically so tests stay stable. Use an `aria-live="polite"` region for news. Match the "Desktop · pawns on strike" mockup.
  Done when: the strike screen looks like the mockup at 1440 × 900.

- [ ] **5. Layouts** (F8, F9)
  Desktop at 900px and up: header, then three columns (unions, board, news and moves), no page scroll, board size `min(640px, 100dvh - 68px - 160px)`. Compact desktop at 900 to 1199px as in UI-SPEC. Mobile below 900px: single column per the "Mobile · pawns on strike" mockup with the compact union chips, one news card and the action bar. Add the move list.
  Done when: at 390 × 844, 1024 × 768, 1280 × 720 and 1440 × 900 nothing overflows or clips; report what each looks like.

- [ ] **6. Start screen, Rules modal, game over, hot-seat** (F7, F10)
  Start screen (Two players or Vs bot disabled until step 7, side choice, Start). Rules modal with three short cards (unpaid loss, strike, strike-break), shown on first visit (remember in `localStorage` inside try/catch) and from the header. Game-over card with a union-flavoured sign-off. Clear turn indicator for hot-seat.
  Done when: a stranger can open the site, read the modal and play a game with a strike without help.

> **Checkpoint, about hour 13:** steps 0 to 6 are all of P0. If behind, stop adding scope and fix what is rough. Then continue.

- [ ] **7. Bot opponent** (F11)
  `src/lib/bot.js`: pick from the filtered legal moves. Start with random; add a greedy mode that prefers captures by piece value and avoids hanging pieces. Inject the RNG so it is testable. The bot's unions strike too. Add a 600ms thinking delay with a "Black is thinking" indicator. Enable "Vs bot" on the Start screen.
  Done when: you can play a whole game against the bot and see it get a strike.

- [ ] **8. Demo mode** (F13)
  `?demo=1` loads a fixed position with White to move and pawn grievance already at 2, where a natural-looking pawn push hangs a pawn so the third unpaid loss is one or two moves away. `?demo=2` loads a position where White is on strike and in check with only a striking pawn able to capture, to show strike-break. Make each sequence a Vitest test that replays the moves and asserts the result. Mention both in the README later.
  Done when: opening each URL always reproduces the described sequence.

- [ ] **9. Bishop and rook unions, captured pieces** (F12, F14)
  Add the bishop work-to-rule (at most 2 squares for 3 turns after 2 unpaid bishop losses) and the rook union break (same rook 4 moves in a row, rooks sit out 1 turn) to the engine with tests first, then the UI (meters, chips, news, banners). Add captured-piece trays per side.
  Done when: tests pass and both unions show up correctly in the panel; if this runs long, cut the rook union first.

- [ ] **10. PWA** (F15)
  Web manifest (name "Chess Union", short_name, `display: standalone`, theme colour `#F6F1E7`, 192 and 512 icons plus a maskable one), `apple-touch-icon` 180 × 180, the `apple-mobile-web-app-capable` and status-bar meta tags, `viewport-fit=cover` with safe-area padding. A small service worker that caches the app shell only. Draw the icon from a simple pawn glyph on a cardboard badge, no copyrighted logos.
  Done when: `npm run build` and `npm run preview` work, Lighthouse PWA checks pass, and the README says "Share > Add to Home Screen" for iPhone.

- [ ] **11. Polish and optional features** (F16, F17, F18)
  In this order, stopping when time runs short: reduced-motion support, keyboard play (arrow keys move a cursor over the board, Enter selects, Escape cancels), focus order and aria labels, undo that restores union state, resume a game from `localStorage`, strictness setting, sound effects with a mute toggle, dark variant.
  Done when: no console errors; Lighthouse accessibility is 90 or more on both layouts.

> **Checkpoint, about hour 19:** stop building features. Do steps 12 to 14 only.

- [ ] **12. Deploy prep and README**
  Clean `vite build`, a deploy config if needed, page title and Open Graph tags. README: a screenshot or GIF first, the live link, "What I changed" (the union rule layer, the UI, the news system, the bot; credit chess as the original and Lichess and Chess.com as inspiration only), how the rules work, the `?demo=1` and `?demo=2` links, how to run and test, and licences (chess.js BSD-2-Clause, react-chessboard MIT, fonts and icon licences). Add a LICENSE file and an in-app credits line.
  Done when: a stranger can clone, run and understand it from the README alone.

- [ ] **13. Demo video script**
  `scripts/record-demo.mjs` using Playwright (dev dependency only): 1440 × 900, opens `/?demo=1`, then runs the shot list in DEMO.md with natural pauses and saves a WebM; an ffmpeg step adds captions and the end card and produces `demo.mp4` of 90 seconds or less.
  Done when: `node scripts/record-demo.mjs` produces a watchable video from a clean run.

- [ ] **14. Final check**
  Run build, lint, tests; open the deployed link at the four layout sizes and on a phone; check `?demo=1` and `?demo=2`; confirm the README links work. List anything broken.
  Done when: the list is empty or knowingly accepted.

---

## Checkpoints

- **About hour 13:** all of P0 (steps 0 to 6) done. If behind, cut in this order: sounds, undo and resume, strictness, rook union, bishop union, bot.
- **About hour 19:** no new features.
- **Last 2 hours:** deploy, record, submit (repo link plus a short showcase video). Ask the organisers whether pre-written code is allowed before the clock, and start step 0 at kickoff.
