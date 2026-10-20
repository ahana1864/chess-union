import { useState } from 'react'
import { Game } from './components/Game'
import { DemoGame } from './components/DemoGame'
import { StartScreen } from './components/StartScreen'
import { RulesModal } from './components/RulesModal'

const RULES_SEEN_KEY = 'chess-union-rules-seen'

function wantsDemoFromUrl() {
  try {
    return new URLSearchParams(window.location.search).get('demo') === '1'
  } catch {
    return false
  }
}

function hasSeenRules() {
  try {
    return localStorage.getItem(RULES_SEEN_KEY) === '1'
  } catch {
    return false
  }
}

function markRulesSeen() {
  try {
    localStorage.setItem(RULES_SEEN_KEY, '1')
  } catch {
    // Private browsing or storage disabled: just skip remembering.
  }
}

function App() {
  const [screen, setScreen] = useState(() => (wantsDemoFromUrl() ? 'demo' : 'start'))
  const [config, setConfig] = useState(null)
  const [rulesOpen, setRulesOpen] = useState(() => !hasSeenRules() && !wantsDemoFromUrl())

  function closeRules() {
    setRulesOpen(false)
    markRulesSeen()
  }

  function startGame(newConfig) {
    setConfig(newConfig)
    setScreen('game')
  }

  function startDemo() {
    setScreen('demo')
  }

  function returnToStart() {
    setScreen('start')
  }

  return (
    <>
      {screen === 'start' ? <StartScreen onStart={startGame} onWatchDemo={startDemo} /> : null}
      {screen === 'game' ? (
        <Game
          config={config}
          onReturnToStart={returnToStart}
          onShowRules={() => setRulesOpen(true)}
        />
      ) : null}
      {screen === 'demo' ? <DemoGame onExit={returnToStart} /> : null}
      {rulesOpen ? <RulesModal onClose={closeRules} /> : null}
    </>
  )
}

export default App
