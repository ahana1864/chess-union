import { useEffect } from 'react'

const CARDS = [
  {
    title: 'Unpaid loss',
    body: "Lose a piece and your very next move isn't a capture, and that piece's union files a grievance. Example: your pawn is taken; you develop a knight instead of recapturing — one grievance.",
  },
  {
    title: 'Strike',
    body: "Three unpaid pawn losses and the pawns walk out for 3 of your turns. They still block squares and can still be captured — they just won't move or capture themselves until the strike runs its course.",
  },
  {
    title: 'King crosses the picket line',
    body: 'If a strike would leave you with no legal move at all, it breaks immediately. Example: you are in check and only a striking pawn can capture the attacker — it does, and the union heads straight into cooldown.',
  },
  {
    title: 'Minors',
    body: 'Lose two bishops or knights for nothing and your remaining bishops go on work-to-rule: 2 squares at most, for 3 turns.',
    icon: '/icons/anger.png',
    note: 'Any capture you make calms every union by one.',
  },
  {
    title: 'Rooks',
    body: 'Move the same rook 4 times in a row and your rooks take a nap for one turn.',
    icon: '/icons/zzz.png',
  },
]

export function RulesModal({ onClose }) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="rules-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rules-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="rules-modal-title" className="rules-modal-heading">
          How unions work
        </h2>
        <div className="rules-cards">
          {CARDS.map((card) => (
            <div className="rules-card" key={card.title}>
              <div className="rules-card-head">
                <h3>{card.title}</h3>
                {card.icon ? (
                  <img src={card.icon} alt="" aria-hidden="true" className="rules-card-icon" />
                ) : null}
              </div>
              <p>{card.body}</p>
              {card.note ? <p className="rules-card-note">{card.note}</p> : null}
            </div>
          ))}
        </div>
        <button type="button" className="header-button header-button-solid" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  )
}
