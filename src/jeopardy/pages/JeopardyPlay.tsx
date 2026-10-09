import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { JShell } from '../components/JShell'
import { JBoard } from '../components/JBoard'
import { JScoreboard } from '../components/JScoreboard'
import { JClueOverlay } from '../components/JClueOverlay'
import { JFinal } from '../components/JFinal'
import { loadBoard, loadManifest } from '../loader'
import type { Board, Player } from '../types'

const STORAGE_PREFIX = 'toybox:jeopardy:players:'

function defaultPlayers(): Player[] {
  return [
    { id: 'p1', name: 'Player 1', score: 0 },
    { id: 'p2', name: 'Player 2', score: 0 },
    { id: 'p3', name: 'Player 3', score: 0 },
  ]
}

function loadPlayers(boardId: string | undefined): Player[] | null {
  if (!boardId) return null
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + boardId)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    const cleaned: Player[] = parsed
      .filter((p): p is Record<string, unknown> => typeof p === 'object' && p !== null)
      .map((p, index) => ({
        id: typeof p.id === 'string' ? p.id : `p${index + 1}`,
        name: typeof p.name === 'string' ? p.name : `Player ${index + 1}`,
        score: typeof p.score === 'number' && Number.isFinite(p.score) ? p.score : 0,
      }))
    return cleaned.length > 0 ? cleaned : null
  } catch {
    return null
  }
}

function nextPlayerNumber(players: Player[]): number {
  let max = 0
  for (const player of players) {
    const match = /^p(\d+)$/.exec(player.id)
    if (match) max = Math.max(max, Number(match[1]))
  }
  return max + 1
}

export default function JeopardyPlay() {
  const { boardId } = useParams<{ boardId: string }>()

  const initialPlayers = useRef<Player[]>(loadPlayers(boardId) ?? defaultPlayers())
  const [players, setPlayers] = useState<Player[]>(initialPlayers.current)
  const nextIdRef = useRef(nextPlayerNumber(initialPlayers.current))
  const [activeId, setActiveId] = useState<string | null>(initialPlayers.current[0]?.id ?? null)

  const [board, setBoard] = useState<Board | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const [used, setUsed] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState<{ catIndex: number; rowIndex: number } | null>(null)
  const [showFinal, setShowFinal] = useState(false)

  // Persist players (names + scores) per board in the browser.
  useEffect(() => {
    if (!boardId) return
    try {
      localStorage.setItem(STORAGE_PREFIX + boardId, JSON.stringify(players))
    } catch {
      /* storage unavailable — ignore */
    }
  }, [boardId, players])

  useEffect(() => {
    let alive = true
    setBoard(null)
    setError(null)
    setNotFound(false)
    ;(async () => {
      try {
        const manifest = await loadManifest()
        const summary = manifest.find((b) => b.id === boardId)
        if (!summary) {
          if (alive) setNotFound(true)
          return
        }
        const loaded = await loadBoard(summary.file)
        if (alive) setBoard(loaded)
      } catch (err) {
        if (alive) setError(String(err))
      }
    })()
    return () => {
      alive = false
    }
  }, [boardId])

  const adjust = useCallback((id: string, delta: number) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, score: p.score + delta } : p)))
  }, [])

  const renamePlayer = useCallback((id: string, name: string) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)))
  }, [])

  const resetScores = useCallback(() => {
    setPlayers((prev) => prev.map((p) => ({ ...p, score: 0 })))
  }, [])

  const addPlayer = useCallback(() => {
    const id = `p${nextIdRef.current++}`
    setPlayers((prev) => [...prev, { id, name: `Player ${prev.length + 1}`, score: 0 }])
  }, [])

  const removePlayer = useCallback((id: string) => {
    setPlayers((prev) => (prev.length <= 1 ? prev : prev.filter((p) => p.id !== id)))
    setActiveId((cur) => (cur === id ? null : cur))
  }, [])

  const openClue = useCallback((catIndex: number, rowIndex: number) => {
    setUsed((prev) => {
      const key = `${catIndex}-${rowIndex}`
      if (prev.has(key)) return prev
      const next = new Set(prev)
      next.add(key)
      return next
    })
    setOpen({ catIndex, rowIndex })
  }, [])

  // keepTile=false returns the tile to the board (used when a card is dismissed by mistake).
  const closeClue = useCallback(
    (keepTile: boolean) => {
      if (!keepTile && open) {
        const key = `${open.catIndex}-${open.rowIndex}`
        setUsed((prev) => {
          if (!prev.has(key)) return prev
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      }
      setOpen(null)
    },
    [open],
  )

  const resetBoard = useCallback(() => {
    setUsed(new Set())
    setOpen(null)
    setShowFinal(false)
  }, [])

  if (notFound) return <Navigate to="/jeopardy" replace />

  const openClueData =
    board && open ? board.categories[open.catIndex]?.clues[open.rowIndex] ?? null : null
  const openCategoryTitle = board && open ? board.categories[open.catIndex]?.title ?? '' : ''

  return (
    <JShell
      backTo="/jeopardy"
      backLabel="Boards"
      title={board?.title}
      actions={
        board ? (
          <>
            <button type="button" className="jbtn jbtn--ghost jbtn--sm" onClick={resetBoard}>
              Reset board
            </button>
            {board.final && (
              <button
                type="button"
                className="jbtn jbtn--primary jbtn--sm"
                onClick={() => setShowFinal(true)}
              >
                Final Jeopardy
              </button>
            )}
          </>
        ) : null
      }
    >
      <div className="jplay">
        <JScoreboard
          players={players}
          activeId={activeId}
          onActivate={setActiveId}
          onRename={renamePlayer}
          onAdjust={adjust}
          onRemove={removePlayer}
          onAdd={addPlayer}
          onResetScores={resetScores}
        />

        {error && <p className="jnotice jnotice--error">Couldn&apos;t load this board: {error}</p>}
        {!board && !error && <p className="jnotice">Loading board&hellip;</p>}

        {board && <JBoard board={board} used={used} onPick={openClue} />}
      </div>

      {board && open && openClueData && (
        <JClueOverlay
          key={`${open.catIndex}-${open.rowIndex}`}
          categoryTitle={openCategoryTitle}
          clue={openClueData}
          players={players}
          onAward={adjust}
          onClose={closeClue}
        />
      )}

      {board && showFinal && board.final && (
        <JFinal
          final={board.final}
          players={players}
          maxValue={board.values[board.values.length - 1] ?? 1000}
          onApply={adjust}
          onClose={() => setShowFinal(false)}
        />
      )}
    </JShell>
  )
}
