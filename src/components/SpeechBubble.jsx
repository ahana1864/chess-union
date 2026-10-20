// Shown briefly over a piece that just refused to move. Purely decorative,
// same as PicketSign -- the blocked-move toast carries the real text.
export function SpeechBubble() {
  return (
    <div className="speech-bubble" aria-hidden="true">
      No.
    </div>
  )
}
