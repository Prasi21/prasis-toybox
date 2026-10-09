import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminConfig } from '../auth'
import { commitFiles, getTextFile } from '../github'
import {
  parseManifest,
  removeSummary,
  serializeManifest,
  upsertSummary,
} from '../boardUtils'
import type { Board, BoardManifest, BoardSummary } from '../../types'

function uniqueId(base: string, existing: BoardSummary[]): string {
  const ids = new Set(existing.map((b) => b.id))
  if (!ids.has(base)) return base
  let n = 2
  while (ids.has(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}

export default function AdminBoards() {
  const config = useAdminConfig()
  const [manifest, setManifest] = useState<BoardManifest | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const file = await getTextFile(config, 'public/boards/index.json')
      setManifest(file ? parseManifest(file.text) : { boards: [] })
    } catch (err) {
      setError(String(err))
    }
  }, [config])

  useEffect(() => {
    void load()
  }, [load])

  const currentManifest = async (): Promise<BoardManifest> => {
    const file = await getTextFile(config, 'public/boards/index.json')
    return file ? parseManifest(file.text) : { boards: [] }
  }

  async function duplicate(summary: BoardSummary) {
    setBusy(summary.id)
    setError(null)
    try {
      const file = await getTextFile(config, `public/boards/${summary.file}`)
      if (!file) throw new Error(`Could not read ${summary.file}.`)
      const board = JSON.parse(file.text) as Board
      const base = await currentManifest()
      const newId = uniqueId(`${board.id}-copy`, base.boards)
      const copy: Board = { ...board, id: newId, title: `${board.title} (copy)` }
      await commitFiles(config, `board: duplicate "${board.title}"`, [
        { path: `public/boards/${newId}.json`, text: `${JSON.stringify(copy, null, 2)}\n` },
        { path: 'public/boards/index.json', text: serializeManifest(upsertSummary(base, copy)) },
      ])
      await load()
    } catch (err) {
      setError(String(err))
    } finally {
      setBusy(null)
    }
  }

  async function remove(summary: BoardSummary) {
    const ok = window.confirm(
      `Delete "${summary.title}"?\n\nThis commits a removal. It can still be recovered from git history, but not from here.`,
    )
    if (!ok) return
    setBusy(summary.id)
    setError(null)
    try {
      const base = await currentManifest()
      await commitFiles(config, `board: delete "${summary.title}"`, [
        { path: `public/boards/${summary.file}`, remove: true },
        { path: 'public/boards/index.json', text: serializeManifest(removeSummary(base, summary.id)) },
      ])
      await load()
    } catch (err) {
      setError(String(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="admin-boards">
      <div className="admin-head">
        <div>
          <h1>Boards</h1>
          <p className="admin-hint">
            Saving commits to <code>{config.branch}</code> and triggers a rebuild (~1 minute).
          </p>
        </div>
        <div className="admin-head__actions">
          <Link to="/jeopardy/admin/new" className="jbtn jbtn--primary">
            + New board
          </Link>
          <button type="button" className="jbtn jbtn--quiet" onClick={() => void load()}>
            Refresh
          </button>
        </div>
      </div>

      {error && <p className="admin-error">{error}</p>}
      {!manifest && !error && <p className="admin-hint">Loading boards&hellip;</p>}

      {manifest && (
        <ul className="admin-boardlist">
          {manifest.boards.map((board) => (
            <li key={board.id} className="admin-boardlist__item">
              <div className="admin-boardlist__meta">
                <strong>{board.title}</strong>
                <span className="admin-hint">
                  {board.id}
                  {board.updatedAt ? ` · updated ${board.updatedAt}` : ''}
                </span>
              </div>
              <div className="admin-boardlist__actions">
                <Link to={`/jeopardy/${board.id}`} className="jbtn jbtn--sm jbtn--quiet">
                  Play
                </Link>
                <Link to={`/jeopardy/admin/edit/${board.id}`} className="jbtn jbtn--sm">
                  Edit
                </Link>
                <button
                  type="button"
                  className="jbtn jbtn--sm jbtn--quiet"
                  disabled={busy === board.id}
                  onClick={() => void duplicate(board)}
                >
                  {busy === board.id ? '…' : 'Duplicate'}
                </button>
                <button
                  type="button"
                  className="jbtn jbtn--sm jbtn--bad"
                  disabled={busy === board.id}
                  onClick={() => void remove(board)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
          {manifest.boards.length === 0 && (
            <li className="admin-hint">No boards yet. Create one.</li>
          )}
        </ul>
      )}
    </div>
  )
}
