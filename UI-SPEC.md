# Chess Union — UI spec (light theme)

Source: the "Chess Union UI" design mockups (Desktop · game in progress, Desktop · pawns on strike) — the Mobile board in the canvas is out of scope for the build. This file turns them into exact values for the build. Where it differs from the PRD on visual details, **this file wins**. Behaviour and rules come from the PRD.

The product name is "Chess Union". The logo is a cardboard badge with a pawn glyph plus the wordmark.

## Layouts

Desktop only. The mobile layout and PWA were dropped from scope; the Mobile mockup in the canvas is ignored.

| Layout | Breakpoint | Reference size | Structure |
| --- | --- | --- | --- |
| Desktop | 900px and up | 1440 × 900 | Header (68px), then three columns: unions 320px, board centre, news and moves 360px. No page scroll. |
| Compact desktop | 900 to 1199px | 1024 × 768 | Same three columns, with the side columns narrowed to 260px and 280px and the board sized to fit (see Board). |

Page background is `--paper`. All text meets 4.5:1 contrast on the surface it sits on.

## Tokens

CSS variables; names are suggestions.

| Token | Value | Used for |
| --- | --- | --- |
| `--paper` | `#F6F1E7` | page background |
| `--panel` | `#FFFDF8` | header, cards, buttons, white pieces |
| `--ink` | `#1B1A17` | text, 2px borders, black pieces, primary button |
| `--ink-2` | `#5B5648` | secondary text, captions, notes |
| `--cardboard` | `#D9B27C` | picket signs, logo badge |
| `--strike` | `#D7263D` | strike banner, strike chip, alert accents, LIVE dot |
| `--strike-tint` | `#FBE0E3` | alert news item background |
| `--strike-deep` | `#B3162B` | strike text on light backgrounds |
| `--warn` | `#F2B705` | grievance meter fill while grumbling |
| `--warn-tint` | `#FFF6D6` | warning news item background |
| `--warn-line` | `#E0B84A` | warning news item border |
| `--calm-bg` / `--calm-fg` | `#DDEBDD` / `#1F4D2F` | "Calm" chip |
| `--grum-bg` / `--grum-fg` | `#FBE7A1` / `#5C4300` | "Grumbling" chip |
| `--cool-bg` / `--cool-fg` | `#DCE4F2` / `#1E3A66` | "Cooldown" chip |
| `--meter-empty` | `#E4DCCB` | empty meter segment, normal news border |
| `--sq-light` | `#EFE6CF` | light squares |
| `--sq-dark` | `#7A9A7E` | dark squares |
| `--sq-light-hl` / `--sq-dark-hl` | `#F4DE86` / `#C9C25A` | last-move highlight |
| `--sq-selected` | `#F2C94C` | selected square |
| `--coord-on-light` / `--coord-on-dark` | `#5E7A62` / `#EFE6CF` | board coordinates |

Fonts (Google Fonts): **Anton** for headings, the logo and the strike banner (uppercase, letter-spacing 1px); **Barlow** 400/500/600/700 for all other text; **Noto Sans Symbols 2** for chess piece glyphs (this keeps pieces as text and stops the system from swapping in emoji). Use the filled glyphs for both sides: `♚ ♛ ♜ ♝ ♞ ♟`.

Radii: cards 14, buttons 10, news items 10, chips and pills 999, board square 0, small signs 3 to 6. Borders on cards and buttons are 2px `--ink` (a poster look); news items use 1.5px.

Icons: Lucide-style outline, stroke 2, rounded caps. Icon-only buttons need an `aria-label`. Tap targets are at least 44px.

## Pieces and board

- Board is an 8 × 8 grid of equal squares, no gaps. Outer outline: 3px `--ink` (box-shadow).
- Piece glyph size is 0.9 × the square (58px on 64px squares, 34px on 48.75px squares), centred.
- **White pieces:** fill `--panel`, `-webkit-text-stroke` 1.5px `--ink`. **Black pieces:** fill `--ink`, no stroke.
- **Coordinates:** rank numbers in the top-left of the a-file squares, file letters in the bottom-right of the first-rank squares, 12px/700, colour `--coord-on-light` or `--coord-on-dark` by square colour.
- **Legal-move dot:** 24px circle (on 80px squares), `rgba(27,26,23,0.3)`, centred on empty target squares.
- **Capture ring:** circle inset 4px with a 6px border `rgba(215,38,61,0.6)`.
- **Last move:** both squares use the `-hl` colours. **Selected piece:** `--sq-selected`.
- **Board size:** computed as `min(820px, 100dvh - 68px - 170px, 100vw - unions column - news column - 64px)` — a cap of 820px, header (68px) plus room for the status line, the player bars above and below the board, and padding (170px), and the width left over after the two side columns and their gutters (64px). That's about 662px at 1440 × 900, about 482px at 1280 × 720, and about 420px at 1024 × 768 (where the side columns narrow to 260px/280px, and the width term binds instead).
- **Picket sign (on striking pawns):** a small cardboard placard on a stick in the top-right of the pawn's square, rotated 8°. Placard 30 × 20, `--cardboard`, 2px `--ink` border, two stripes inside (3px `--strike`, 3px `--ink`); stick 3 × 16, `--ink`. Decorative, so `aria-hidden="true"`.

## Header

- Desktop: 68px tall, `--panel` background, 2px bottom border `--ink`, padding 0 28px.
- Left: logo badge (40 × 40, `--cardboard`, 2px `--ink` border, radius 6, rotated −5°, a ♟ glyph in Noto Sans Symbols 2 at 26px), wordmark "CHESS UNION" in Anton 34px/1, letter-spacing 1px, then the tagline "Chess where the pieces unionize" in 14px `--ink-2`.
- Right: "How unions work" (outline button) and "New game" (solid `--ink` button, `--paper` text). Both 44px tall, padding 0 18px, 15px/700.

## Desktop: left column, "The Unions" (320px)

- Padding 20, right border 2px `--ink`, gap 14. Heading "THE UNIONS" in Anton 22px.
- Two union cards, opponent (Black) on top, you (White) below, matching the board orientation. Each card: `--panel` background, 2px `--ink` border, radius 14, padding 14 16, gap 14.
- Card header: a 14px circle in the side colour (2px `--ink` border) plus the side name 16px/700. The side to move shows a "TO MOVE" pill (`--ink` background, `--paper` text, 12px/700, padding 3 10).
- Each union row (Pawns, Minors, Rooks), gap 6: name 15px/600 on the left, status chip on the right (12px/700, padding 2 10, pill); below it a meter; below that a note in 12px `--ink-2`.
- **Meter:** a row of segments, gap 4, each flex-grow 1, 8px tall, radius 4. Pawns have 3 segments, Minors 2, Rooks 4. Filled segments are `--warn` while grumbling and `--strike` during a strike; empty ones are `--meter-empty`.
- **Status chips:** Calm (`--calm-*`), Grumbling (`--grum-*`), On strike (`--strike` background, white text), Cooldown (`--cool-*`).
- **Notes:** "{n} of {limit} unpaid losses", "{n} of 4 moves in a row" (rooks), "Back at work in {n} turns" (strike), "Cooling off for {n} turns" (cooldown).
- A 13px `--ink-2` explainer paragraph sits under the cards.

## Desktop: centre column

- Content is vertically centred, gap 12. Player bars (640px wide) sit above and below the board: a 28px side circle (2px `--ink` border), side name 16px/700, a 14px `--ink-2` caption ("Bot · greedy", "You"), and on the right that side's captured pieces as glyphs at 22px (white pieces keep the stroke).
- **Work-to-rule icon (Minors union):** the red anger-vein image (public/icons/anger.png) at about 40% of the square size, top-right of each restricted bishop's square. No picket sign and no strike banner for this union. The union card shows the same chip style as other unions ("On work-to-rule", turns left).
- **Rook sit-out icon:** the sleeping "zzz" thought bubble (public/icons/zzz.png) at about 45% of the square size, top-right of each rook's square while rooks sit out. No banner. Both icons are `aria-hidden="true"`; the news feed and union card carry the same information as text.
- **Strike banner:** overlays the top of the board, full board width, `--strike` background, white text, padding 14 22, box-shadow `0 3px 0 --ink`, `role="status"`. Left: a large picket sign (64 × 42 placard, rotated −6°). Right: "PAWNS ON STRIKE" in Anton 40px/1.05 (letter-spacing 1.5px) and a 15px/500 line "White's pawns won't move or capture for 3 turns. Capture something to cool things down." It appears for about 2 seconds, then collapses to the status chips and picket signs, which stay for the whole strike.
- **Blocked-move toast:** bottom centre of the board, `--ink` background, `--paper` text, 15px/600, padding 10 18, radius 10: "Pawns are on strike (3 turns left)". The pawn shakes (translateX ±4px, 200ms) when the player tries to move it.

## Desktop: right column, "Union News" and moves (360px)

- Padding 20, left border 2px `--ink`, gap 14.
- Heading row: "UNION NEWS" in Anton 22px and a "LIVE" label (12px/700 `--strike`) with an 8px dot.
- **News items** (newest first, gap 8): padding 10 12, radius 10, border 1.5px. A tag pill (`M{move}`, 12px/700, `--ink` background, `--paper` text, radius 6) followed by 14px/1.35 text. Three tones: normal (`--panel`, border `--meter-empty`, weight 500), warning (`--warn-tint`, `--warn-line`, weight 600), alert (`--strike-tint`, `--strike`, weight 700). Keep the last 5 visible; the rest scroll inside the column.
- **Moves:** heading "MOVES" (Anton 22px), then a 3-column grid (`36px 1fr 1fr`, gap 4 8, 15px/500): move number in `--ink-2`, White's move, Black's move.
- **Bottom buttons:** Undo and Resign, two columns, 44px, 2px `--ink` border, radius 10.

## Start screen and Rules modal (not mocked up; build from the PRD with these tokens)

- **Start screen:** centred card on `--paper`, max-width 480px. Logo and tagline, then "Two players" and "Vs bot" as large selectable cards (2px border; selected = `--ink` background, `--paper` text), a side choice (White, Black, Random), and a full-width "Start" button (`--ink`, 52px tall).
- **Rules modal:** first visit and from "How unions work". Centred, max-width 560px. Three short cards with a tiny illustration each: "Unpaid loss", "Strike", "King crosses the picket line". Primary button "Got it". Escape closes.
- **Game over:** centred card with the result in Anton 40px, a one-line union sign-off, and "New game".
- **Promotion picker:** four piece glyphs in a row over the promotion square; the player must choose.

## Motion and interaction

- Piece move: 150ms transform ease-out. Strike banner slides down 250ms and auto-dismisses. New news item fades in 200ms.
- All motion respects `prefers-reduced-motion` (no slides or shakes; use a plain fade or none).
- Hover: buttons darken their border or fill by 8%; focus-visible: 3px outline `--strike` with 2px offset.
- Keyboard: Tab reaches the board, buttons and modals in reading order. Arrow keys move a keyboard cursor over the board; Enter selects and confirms; Escape cancels or closes. Announce moves and union events through an `aria-live="polite"` region (the news feed doubles as it).

## Dark variant (derived, not mocked up, P2)

Suggested starting values for `prefers-color-scheme: dark`; untested, so check contrast of 4.5:1 for text.

| Token | Dark value |
| --- | --- |
| `--paper` | `#14120F` |
| `--panel` | `#1F1C17` |
| `--ink` | `#F6F1E7` |
| `--ink-2` | `#B7AF9D` |
| `--meter-empty` | `#3A352C` |
| `--strike` | `#E5495C` (check white text on it) |

Board colours, pieces and picket signs stay the same in both themes, except that the white-piece stroke and black-piece fill must remain `#1B1A17` and `#FFFDF8` respectively, not the swapped `--ink` and `--panel`.
