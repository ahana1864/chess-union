import { useState } from 'react'

const SIDES = [
  { value: 'white', label: 'White' },
  { value: 'black', label: 'Black' },
  { value: 'random', label: 'Random' },
]

export function StartScreen({ onStart, onWatchDemo }) {
  const [mode, setMode] = useState('two-players')
  const [side, setSide] = useState('white')
  const [chaos, setChaos] = useState(false)

  function handleStart() {
    const resolvedSide = side === 'random' ? (Math.random() < 0.5 ? 'white' : 'black') : side
    onStart({ mode, side: resolvedSide, chaos })
  }

  return (
    <div className="start-screen">
      <div className="start-card">
        <div className="logo-badge" aria-hidden="true">
          ♟
        </div>
        <h1 className="wordmark">CHESS UNION</h1>
        <p className="tagline">Chess where the pieces unionize</p>

        <div className="choice-row">
          <button
            type="button"
            className={`choice-card ${mode === 'two-players' ? 'choice-card-selected' : ''}`}
            onClick={() => setMode('two-players')}
          >
            Two players
          </button>
          <button
            type="button"
            className={`choice-card ${mode === 'vs-bot' ? 'choice-card-selected' : ''} ${chaos ? 'choice-card-disabled' : ''}`}
            onClick={() => !chaos && setMode('vs-bot')}
            disabled={chaos}
          >
            Vs bot
            {chaos ? <span className="choice-card-note">Not in Chaos Mode</span> : null}
          </button>
        </div>

        <div className="choice-row choice-row-side">
          {SIDES.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`choice-pill ${side === option.value ? 'choice-pill-selected' : ''}`}
              onClick={() => setSide(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`choice-card choice-card-chaos ${chaos ? 'choice-card-selected' : ''}`}
          aria-pressed={chaos}
          onClick={() => {
            const next = !chaos
            setChaos(next)
            if (next) setMode('two-players')
          }}
        >
          Chaos Mode
          <span className="choice-card-note">
            Every piece gets its own personality, fatigue, grievance and anger
          </span>
        </button>

        <button type="button" className="start-button" onClick={handleStart}>
          Start
        </button>

        {onWatchDemo ? (
          <button
            type="button"
            className="header-button header-button-outline"
            onClick={onWatchDemo}
          >
            Watch demo
          </button>
        ) : null}

        <p className="credits-line">
          Chess rules by{' '}
          <a href="https://github.com/jhlywa/chess.js" target="_blank" rel="noreferrer">
            chess.js
          </a>
          . Board by{' '}
          <a href="https://github.com/Clariity/react-chessboard" target="_blank" rel="noreferrer">
            react-chessboard
          </a>
          . Sounds synthesized in-browser.
        </p>
      </div>
    </div>
  )
}
