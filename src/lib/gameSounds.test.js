import { describe, expect, it, vi } from 'vitest'

vi.mock('./sound', () => ({
  playMoveSound: vi.fn(),
  playCaptureSound: vi.fn(),
  playCheckSound: vi.fn(),
  playGrievanceSound: vi.fn(),
  playStrikeSound: vi.fn(),
  playWorkToRuleSound: vi.fn(),
  playRookNapSound: vi.fn(),
  playStrikeBreakSound: vi.fn(),
  playGameOverSound: vi.fn(),
}))

const sound = await import('./sound')
const { playMoveResultSound, playGameOverSoundIfOver, playSoundForNewsEvent } = await import(
  './gameSounds'
)

function resetAllMocks() {
  for (const fn of Object.values(sound)) fn.mockClear()
}

describe('playSoundForNewsEvent', () => {
  it('plays the grievance sound for a grievance-filed event', () => {
    resetAllMocks()
    playSoundForNewsEvent({ type: 'grievance-filed', side: 'white', union: 'pawns' })
    expect(sound.playGrievanceSound).toHaveBeenCalledTimes(1)
  })

  it('plays the strike sound for a pawns strike event', () => {
    resetAllMocks()
    playSoundForNewsEvent({ type: 'strike', side: 'white', union: 'pawns' })
    expect(sound.playStrikeSound).toHaveBeenCalledTimes(1)
    expect(sound.playWorkToRuleSound).not.toHaveBeenCalled()
    expect(sound.playRookNapSound).not.toHaveBeenCalled()
  })

  it('plays the work-to-rule sound for a minors strike event', () => {
    resetAllMocks()
    playSoundForNewsEvent({ type: 'strike', side: 'white', union: 'minors' })
    expect(sound.playWorkToRuleSound).toHaveBeenCalledTimes(1)
    expect(sound.playStrikeSound).not.toHaveBeenCalled()
  })

  it('plays the rook-nap sound for a rooks strike event', () => {
    resetAllMocks()
    playSoundForNewsEvent({ type: 'strike', side: 'white', union: 'rooks' })
    expect(sound.playRookNapSound).toHaveBeenCalledTimes(1)
  })

  it('plays the strike-break sound for a strike-break event, regardless of union', () => {
    resetAllMocks()
    playSoundForNewsEvent({ type: 'strike-break', side: 'black', union: 'minors' })
    expect(sound.playStrikeBreakSound).toHaveBeenCalledTimes(1)
  })

  it('plays nothing for an event it has no sound for', () => {
    resetAllMocks()
    playSoundForNewsEvent({ type: 'capture-calms', side: 'white', union: 'pawns' })
    for (const fn of Object.values(sound)) expect(fn).not.toHaveBeenCalled()
  })
})

describe('playMoveResultSound', () => {
  it('plays the move sound for a quiet move', () => {
    resetAllMocks()
    playMoveResultSound({ isCapture: false, isCheck: false })
    expect(sound.playMoveSound).toHaveBeenCalledTimes(1)
    expect(sound.playCaptureSound).not.toHaveBeenCalled()
    expect(sound.playCheckSound).not.toHaveBeenCalled()
  })

  it('plays the capture sound instead of the move sound for a capture', () => {
    resetAllMocks()
    playMoveResultSound({ isCapture: true, isCheck: false })
    expect(sound.playCaptureSound).toHaveBeenCalledTimes(1)
    expect(sound.playMoveSound).not.toHaveBeenCalled()
  })

  it('also plays the check sound when the move gives check', () => {
    resetAllMocks()
    playMoveResultSound({ isCapture: true, isCheck: true })
    expect(sound.playCaptureSound).toHaveBeenCalledTimes(1)
    expect(sound.playCheckSound).toHaveBeenCalledTimes(1)
  })
})

describe('playGameOverSoundIfOver', () => {
  it('plays the game-over sound when the game is over', () => {
    resetAllMocks()
    playGameOverSoundIfOver({ isGameOver: () => true })
    expect(sound.playGameOverSound).toHaveBeenCalledTimes(1)
  })

  it('plays nothing when the game is still going', () => {
    resetAllMocks()
    playGameOverSoundIfOver({ isGameOver: () => false })
    expect(sound.playGameOverSound).not.toHaveBeenCalled()
  })
})
