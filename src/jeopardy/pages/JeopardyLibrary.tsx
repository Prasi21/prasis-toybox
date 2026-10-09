import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { JShell } from '../components/JShell'
import { Tessellation } from '../../components/Tessellation'
import { loadManifest } from '../loader'
import type { BoardSummary } from '../types'

export default function JeopardyLibrary() {
  const [boards, setBoards] = useState<BoardSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    loadManifest()
      .then((list) => {
        if (alive) setBoards(list)
      })
      .catch((err: unknown) => {
        if (alive) setError(String(err))
      })
    return () => {
      alive = false
    }
  }, [])

  return (
    <JShell backTo="/" backLabel="Toybox" title="Jeopardy">
      <div className="jlib">
        <div className="jlib__head">
          <h1>Pick a board</h1>
          <p>Anyone can play. Pick a tile, reveal the clue, keep score.</p>
        </div>

        {error && <p className="jnotice jnotice--error">Couldn&apos;t load boards: {error}</p>}
        {!boards && !error && <p className="jnotice">Loading boards&hellip;</p>}

        <div className="jlib__grid">
          {boards?.map((board) => (
            <Link key={board.id} to={`/jeopardy/${board.id}`} className="jboard-card">
              <div className="jboard-card__art">
                <Tessellation variant="mixed" R={30} />
              </div>
              <div className="jboard-card__body">
                <h2>{board.title}</h2>
                {board.description && <p>{board.description}</p>}
                <span className="jboard-card__cta">Play &rarr;</span>
              </div>
            </Link>
          ))}

          <div className="jboard-card is-ghost" aria-disabled="true">
            <div className="jboard-card__art">
              <Tessellation variant="navy" R={30} />
            </div>
            <div className="jboard-card__body">
              <h2>New board</h2>
              <p>The board editor is coming soon.</p>
              <span className="jboard-card__cta">Soon</span>
            </div>
          </div>
        </div>
      </div>
    </JShell>
  )
}
