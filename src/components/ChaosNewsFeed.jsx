import { chaosHeadlineFor } from '../lib/chaos/chaosHeadlines'

// Chaos Mode's equivalent of NewsFeed.jsx, reading chaos events instead of
// union events -- kept separate so classic mode's news feed never changes.
export function ChaosNewsFeed({ news }) {
  return (
    <div className="news-feed">
      <div className="news-feed-heading">
        <h2>CHAOS NEWS</h2>
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
            const { text, tone } = chaosHeadlineFor(event)
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
