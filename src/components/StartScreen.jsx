import { useState } from 'react'

const SIDES = [
  { value: 'white', label: 'White' },
  { value: 'black', label: 'Black' },
  { value: 'random', label: 'Random' },
]

export function StartScreen({ onStart }) {
  const [mode, setMode] = useState('two-players')
  const [side, setSide] = useState('white')

  function handleStart() {
    const resolvedSide = side === 'random' ? (Math.random() < 0.5 ? 'white' : 'black') : side
    onStart({ mode, side: resolvedSide })
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
            className="choice-card choice-card-disabled"
            disabled
            title="Coming in a later step"
          >
            Vs bot
            <span className="choice-card-note">(soon)</span>
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

        <button type="button" className="start-button" onClick={handleStart}>
          Start
        </button>
      </div>
    </div>
  )
}
