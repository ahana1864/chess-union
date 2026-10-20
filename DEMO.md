# Chess Union demo video script

~75–90 seconds, 1440 × 900, showcase not explanation. The demo mode does
most of the work: it's a scripted tour of every union mechanic, played on
the real engine (not a recording), with its own on-screen captions — so
record it running rather than narrating gameplay by hand. Record against
`http://localhost:5173/?demo=1` (run `npm run dev` first), or click **Watch
demo** from the start screen. Window at 1440 × 900, notifications off, dry
run once before recording for real.

This replaces the old shot list in this file, which described a `?demo=2`
URL and a hand-played pawn sacrifice that no longer match what's built —
see the note on `src/lib/demoScript.js` in the README.

## Shot list

Timings below come straight from `src/lib/demoTimeline.js` (run the
`DEMO_TIMELINE` total if the pacing constants ever change), so they won't
drift from what the demo actually does. The on-screen caption is the
built-in one from `src/lib/demoScript.js` — read it aloud if you're adding
voiceover, or just let the on-screen text and the union-panel/news-feed
motion carry it for a muted viewer.

| Time | Show | On-screen caption |
| --- | --- | --- |
| 0:00–0:05 | Intro: start screen, click **Watch demo** | Chess Union — chess where the pieces unionize |
| 0:05–0:07 | Case 1 begins (0:00 on the demo's own clock) | Lose a pawn for nothing and the union files a grievance. |
| ~0:12 | Grievance meter fills one step, news item appears | — |
| 0:12–0:24 | Case 2: third unpaid pawn loss | Three strikes and the pawns walk out. |
| ~0:16 | "PAWNS ON STRIKE" banner, picket signs | — |
| ~0:22 | Blocked-move toast: a struck pawn refuses to move | — |
| 0:24–0:30 | Case 3: a capture lowers two grievance meters at once | Any capture calms every union. |
| 0:30–0:41 | Case 4: second unpaid minor-piece loss | Lose two minor pieces for free and your bishops cut corners. |
| ~0:34 | "BISHOPS ON WORK-TO-RULE" banner, anger icon on the restricted bishop | — |
| ~0:39 | Blocked-move toast: the bishop can't move past 2 squares | — |
| 0:41–0:59 | Case 5: same rook moves 4 times in a row | Overwork a rook and the rooks take a nap. |
| ~0:53 | "ROOKS TAKE A NAP" banner, zzz icon on the rook | — |
| 0:59–1:07 | Case 6: pawns are already on strike and in check — the strike breaks | Even kings cross picket lines. |
| ~1:01 | "THE KING CROSSES THE PICKET LINE" banner, then the capture plays, check resolved | — |
| 1:07–1:10 | End card | Chess Union. The pieces have a union. |
| 1:10–1:15 | Click **Back to start**, cut to repo link / GitHub Pages URL | Built with chess.js and react-chessboard |

That's ~70 seconds end to end. If you want closer to 90s, add a ~15–20s
beat before the end card: exit the demo, start a quick **Vs bot** game,
play a couple of moves and cut to a checkmate already in progress (or let
the bot finish one), showing the game-over card — "A real game of chess
underneath."

## Recording tips

- Dry-run once with Pause/Resume to learn the exact beats before recording
  for real; the demo auto-plays at a fixed pace (about 62.5s end to end),
  so there's no need to pause during the actual take unless you're adding
  a live-bot-game segment.
- If a take goes wrong partway through, use **Exit demo** then **Watch
  demo** again rather than refreshing — it resets to case 1 either way,
  but avoids a visible page reload in the recording.
- Record with the OS recorder, OBS, or the Playwright script from
  PROMPTS.md step 12 (`scripts/record-demo.mjs`, not yet built).
- Keep captions on screen long enough to read at 1.0x — they already are
  (the demo holds each case's opening caption for longer than the move
  pacing, see `CAPTION_HOLD_MS` in `demoTimeline.js`), so this only
  matters if you add your own overlay captions on top.
