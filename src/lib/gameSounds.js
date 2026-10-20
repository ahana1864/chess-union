// Maps game events onto src/lib/sound.js's synthesized sounds. Called
// from the exact places those events are already produced (useGame.js's
// makeMove/settle, which is also where the news feed and the strike
// banners get their events), so sound, news and banners never drift out
// of sync with each other.
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
} from './sound'

// One union news event (as produced by unionRules.js's applyMove or
// legalMoves' strike-break) -> the sound it should play. Events this
// module doesn't have a sound for (capture-calms, grumbling, cooldown)
// are silently ignored.
export function playSoundForNewsEvent(event) {
  if (event.type === 'grievance-filed') {
    playGrievanceSound()
    return
  }
  if (event.type === 'strike') {
    if (event.union === 'pawns') playStrikeSound()
    else if (event.union === 'minors') playWorkToRuleSound()
    else if (event.union === 'rooks') playRookNapSound()
    return
  }
  if (event.type === 'strike-break') {
    playStrikeBreakSound()
  }
}

// The move/capture/check sounds aren't news items, but they're decided at
// the exact same point a move is applied.
export function playMoveResultSound({ isCapture, isCheck }) {
  if (isCapture) playCaptureSound()
  else playMoveSound()
  if (isCheck) playCheckSound()
}

export function playGameOverSoundIfOver(chess) {
  if (chess.isGameOver()) playGameOverSound()
}
