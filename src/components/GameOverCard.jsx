import { statusText } from '../lib/statusText'
import { gameOverSignOff } from '../lib/gameOverLines'

export function GameOverCard({ chess, onNewGame }) {
  return (
    <div className="modal-backdrop">
      <div className="game-over-card" role="alertdialog" aria-labelledby="game-over-title">
        <h2 id="game-over-title" className="game-over-result">
          {statusText(chess)}
        </h2>
        <p className="game-over-signoff">{gameOverSignOff(chess)}</p>
        <button type="button" className="header-button header-button-solid" onClick={onNewGame}>
          New game
        </button>
      </div>
    </div>
  )
}
