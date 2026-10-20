// Shows one union event (strike, work-to-rule, sit-out, or the pawns-only
// strike-break) as a dismissible banner. icon is null for the pawn cases,
// which keep the picket-sign placard instead; otherwise it's the path to a
// status icon (anger.png, zzz.png) shown in its place. Content is built by
// src/lib/bannerContent.js, not here, so this component stays a dumb
// title/subtitle/icon shell that Game.jsx can queue multiple of.
export function StrikeBanner({ title, subtitle, icon }) {
  return (
    <div className="strike-banner" role="status">
      <div className="strike-banner-sign" aria-hidden="true">
        {icon ? (
          <img src={icon} alt="" className="strike-banner-icon" />
        ) : (
          <>
            <div className="strike-banner-stick" />
            <div className="strike-banner-placard">
              <span className="picket-stripe picket-stripe-strike" />
              <span className="picket-stripe picket-stripe-ink" />
            </div>
          </>
        )}
      </div>
      <div className="strike-banner-text">
        <p className="strike-banner-title">{title}</p>
        <p className="strike-banner-detail">{subtitle}</p>
      </div>
    </div>
  )
}
