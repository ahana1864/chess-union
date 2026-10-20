import { useEffect, useState } from 'react'
import { isMuted, primeAudioOnFirstGesture, toggleMuted } from '../lib/sound'

function SpeakerIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="4,9 8,9 13,4 13,20 8,15 4,15" />
      <path d="M17 8a5 5 0 0 1 0 8" />
      <path d="M19.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  )
}

function MutedIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="4,9 8,9 13,4 13,20 8,15 4,15" />
      <line x1="16" y1="9" x2="22" y2="15" />
      <line x1="22" y1="9" x2="16" y2="15" />
    </svg>
  )
}

// Speaker icon button: mutes/unmutes every sound in src/lib/sound.js.
// Also arms the "first gesture unlocks audio" listener on mount, since
// this button is itself part of the header every screen shows.
export function SoundToggle() {
  const [muted, setMutedState] = useState(() => isMuted())

  useEffect(() => {
    primeAudioOnFirstGesture()
  }, [])

  function handleClick() {
    setMutedState(toggleMuted())
  }

  return (
    <button
      type="button"
      className="icon-button"
      onClick={handleClick}
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
      aria-pressed={muted}
    >
      {muted ? <MutedIcon /> : <SpeakerIcon />}
    </button>
  )
}
