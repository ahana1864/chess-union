// Maps Chaos Mode's own news events (src/lib/chaos/chaosEngine.js) onto
// src/lib/sound.js's synthesized sounds, the same way src/lib/gameSounds.js
// does for classic unions -- kept as its own file, reusing only the
// low-level tone functions from sound.js, so neither classic mode's sound
// mapping nor sound.js itself ever changes.
import {
  playCaptureSound,
  playCheckSound,
  playGameOverSound,
  playGrievanceSound,
  playMoveSound,
  playRookNapSound,
  playStrikeBreakSound,
  playStrikeSound,
  playWorkToRuleSound,
} from '../sound'

// One chaos news event -> the sound it should play. Quiet/neutral events
// (wakes-up, strike-ends, calms-down, capture-calms) are silently ignored,
// same as classic mode ignores its own equivalents.
export function playSoundForChaosEvent(event) {
  if (event.type === 'falls-asleep') {
    playRookNapSound()
    return
  }
  if (event.type === 'walks-out' || event.type === 'chaos-strike-break') {
    playStrikeSound()
    return
  }
  if (event.type === 'furious') {
    playWorkToRuleSound()
    return
  }
  if (event.type === 'grievance-nearby') {
    playGrievanceSound()
    return
  }
  if (event.type === 'refusal') {
    playGrievanceSound()
    return
  }
  if (event.type === 'rebel-move') {
    playStrikeBreakSound()
  }
}

// The move/capture/check sounds aren't news items, but they're decided at
// the exact same point a move is applied -- identical to
// gameSounds.js's playMoveResultSound, duplicated here (rather than
// imported from there) so chaos mode's sound wiring doesn't reach into a
// classic-mode file.
export function playChaosMoveResultSound({ isCapture, isCheck }) {
  if (isCapture) playCaptureSound()
  else playMoveSound()
  if (isCheck) playCheckSound()
}

export function playChaosGameOverSoundIfOver(chess) {
  if (chess.isGameOver()) playGameOverSound()
}
