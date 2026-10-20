import { DEMO_CASES } from './demoScript'
import { playCase } from './demoRunner'

const MOVE_INTERVAL_MS = 1200 // "about 1.2 seconds between moves"
const CAPTION_HOLD_MS = 2500 // extra pause on a case's first frame, so the caption can be read
const BANNER_HOLD_MS = 2500 // time to read a strike/work-to-rule/sit-out banner
const BLOCKED_HOLD_MS = 2500 // time to read a blocked-move toast
const CASE_END_HOLD_MS = 2000 // extra pause on a case's last frame, before cutting to the next

function hasBannerEvent(frame) {
  return frame.news.some((event) => event.type === 'strike' || event.type === 'strike-break')
}

function delayFor(frame, isFirstFrameOfCase, isLastFrameOfCase) {
  let delay = MOVE_INTERVAL_MS
  if (frame.kind === 'blocked-attempt') delay = BLOCKED_HOLD_MS
  else if (hasBannerEvent(frame)) delay = BANNER_HOLD_MS
  if (isFirstFrameOfCase) delay = Math.max(delay, CAPTION_HOLD_MS)
  if (isLastFrameOfCase) delay += CASE_END_HOLD_MS
  return delay
}

// Flattens every case into one timeline of {caseIndex, frame, delayMs}
// items, computed once at module load (the cases are static data, and
// playCase() is pure) so the player component just advances an index
// instead of re-running the engine on every tick.
export const DEMO_TIMELINE = DEMO_CASES.flatMap((demoCase, caseIndex) => {
  const frames = playCase(demoCase)
  return frames.map((frame, frameIndex) => ({
    caseIndex,
    frame,
    delayMs: delayFor(frame, frameIndex === 0, frameIndex === frames.length - 1),
  }))
})

export function totalDemoDurationMs() {
  return DEMO_TIMELINE.reduce((sum, item) => sum + item.delayMs, 0)
}
