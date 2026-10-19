import { useState } from 'react'
import { Game } from './components/Game'
import { StartScreen } from './components/StartScreen'
import { RulesModal } from './components/RulesModal'

const RULES_SEEN_KEY = 'chess-union-rules-seen'

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
  const [screen, setScreen] = useState('start')
  const [config, setConfig] = useState(null)
  const [rulesOpen, setRulesOpen] = useState(() => !hasSeenRules())

  function closeRules() {
    setRulesOpen(false)
    markRulesSeen()
  }

  function startGame(newConfig) {
    setConfig(newConfig)
    setScreen('game')
  }

  function returnToStart() {
    setScreen('start')
  }

  return (
    <>
      {screen === 'start' ? (
        <StartScreen onStart={startGame} />
      ) : (
        <Game
          config={config}
          onReturnToStart={returnToStart}
          onShowRules={() => setRulesOpen(true)}
        />
      )}
      {rulesOpen ? <RulesModal onClose={closeRules} /> : null}
    </>
  )
}

export default App
