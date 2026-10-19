export function Header({ onNewGame }) {
  return (
    <header className="app-header">
      <div className="logo-badge" aria-hidden="true">
        ♟
      </div>
      <div className="header-titles">
        <h1 className="wordmark">CHESS UNION</h1>
        <p className="tagline">Chess where the pieces unionize</p>
      </div>
      <div className="header-actions">
        <button type="button" className="header-button header-button-outline">
          How unions work
        </button>
        <button type="button" className="header-button header-button-solid" onClick={onNewGame}>
          New game
        </button>
      </div>
    </header>
  )
}
