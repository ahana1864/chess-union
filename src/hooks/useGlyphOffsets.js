import { useEffect, useState } from 'react'
import { measureGlyphOffsets } from '../lib/glyphCentering'

// Measures each piece glyph's ink-box offset once on startup, after web
// fonts finish loading and the board has its real pixel size, so every
// piece can be nudged onto the square's true visual centre.
export function useGlyphOffsets(boardRef) {
  const [offsets, setOffsets] = useState(null)

  useEffect(() => {
    let cancelled = false

    document.fonts.ready.then(() => {
      if (cancelled) return
      const boardEl = boardRef.current
      if (!boardEl) return
      const squareSize = boardEl.getBoundingClientRect().width / 8
      setOffsets(measureGlyphOffsets(squareSize * 0.72))
    })

    return () => {
      cancelled = true
    }
  }, [boardRef])

  return offsets
}
