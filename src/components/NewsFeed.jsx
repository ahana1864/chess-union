import { headlineFor } from '../lib/headlines'

export function NewsFeed({ news }) {
  return (
    <div className="news-feed">
      <div className="news-feed-heading">
        <h2>UNION NEWS</h2>
        <span className="live-indicator">
          <span className="live-dot" aria-hidden="true" />
          LIVE
        </span>
      </div>
      <ul className="news-list" aria-live="polite">
        {news.length === 0 ? (
          <li className="news-empty">Nothing to report yet. Make a move.</li>
        ) : (
          news.map((event, index) => {
            const { text, tone } = headlineFor(event)
            return (
              <li key={index} className={`news-item news-item-${tone}`}>
                {event.moveNumber ? <span className="news-tag">M{event.moveNumber}</span> : null}
                <span className="news-text">{text}</span>
              </li>
            )
          })
        )}
      </ul>
    </div>
  )
}
