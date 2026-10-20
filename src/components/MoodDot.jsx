import { CHAOS_CONFIG } from '../lib/chaos/chaosConfig'

// Green/yellow/red dot on every piece in Chaos Mode, the one always-on
// signal of a piece's mood (sleeping/striking get their own icon on top of
// it). Purely visual -- the news feed carries the same information as text.
export function MoodDot({ anger, status }) {
  let mood = 'calm'
  if (status === 'rebel') mood = 'angry'
  else if (anger >= CHAOS_CONFIG.furiousThreshold / 2) mood = 'uneasy'

  return <span className={`mood-dot mood-dot-${mood}`} aria-hidden="true" />
}
