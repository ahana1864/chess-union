// Noto Sans Symbols 2 filled glyphs, shared by both colours per UI-SPEC.
// Colour comes from CSS (fill + stroke), not from picking different glyphs.
//
// Each glyph is suffixed with U+FE0E (VARIATION SELECTOR-15, "text
// presentation"). Without it, some engines render ♝ ♛ ♚ using a coloured
// emoji-style glyph that ignores text color/stroke entirely (the other
// pieces happen to default to text presentation already, which is why only
// the bishop/queen/king looked wrong).
const VS15 = '︎'

export const PIECE_GLYPHS = {
  p: `♟${VS15}`,
  n: `♞${VS15}`,
  b: `♝${VS15}`,
  r: `♜${VS15}`,
  q: `♛${VS15}`,
  k: `♚${VS15}`,
}
