import { useEffect, useReducer, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAdminConfig } from '../auth'
import { commitFiles, getFileSha, getTextFile, type FileChange } from '../github'
import { formatBytes, processImage } from '../image'
import {
  blankBoard,
  parseManifest,
  serializeManifest,
  slugifyId,
  upsertSummary,
  validateBoard,
} from '../boardUtils'
import { resolveImage } from '../../loader'
import { JBoard } from '../../components/JBoard'
import { JClueOverlay } from '../../components/JClueOverlay'
import { ListEditor } from '../components/ListEditor'
import { ImagePicker } from '../components/ImagePicker'
import type { Board, Category, Clue, FinalPage, FinalRound, Player } from '../../types'

const DRAFT_PREFIX = 'toybox:admin:draft:'

function BoardPreview({
  board,
  resolveSrc,
  onClose,
}: {
  board: Board
  resolveSrc: (path?: string) => string | undefined
  onClose: () => void
}) {
  const [used, setUsed] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState<{ catIndex: number; rowIndex: number } | null>(null)
  const players: Player[] = [{ id: 'preview', name: 'Preview player', score: 0 }]
  const clue = open ? board.categories[open.catIndex]?.clues[open.rowIndex] ?? null : null

  return (
    <div className="admin-preview">
      <header className="admin-preview__bar">
        <span className="admin-preview__title">Preview &middot; {board.title}</span>
        <button type="button" className="jbtn jbtn--sm" onClick={onClose}>
          Close preview
        </button>
      </header>
      <div className="admin-preview__body">
        <JBoard
          board={board}
          used={used}
          onPick={(catIndex, rowIndex) => {
            setUsed((prev) => {
              const next = new Set(prev)
              next.add(`${catIndex}-${rowIndex}`)
              return next
            })
            setOpen({ catIndex, rowIndex })
          }}
        />
      </div>
      {open && clue && (
        <JClueOverlay
          categoryTitle={board.categories[open.catIndex].title}
          clue={clue}
          players={players}
          onAward={() => {}}
          onClose={() => setOpen(null)}
          imageResolver={resolveSrc}
        />
      )}
    </div>
  )
}

export default function AdminEditor() {
  const config = useAdminConfig()
  const navigate = useNavigate()
  const { boardId } = useParams<{ boardId: string }>()
  const isNew = !boardId

  const [board, setBoard] = useState<Board | null>(null)
  const [originalSha, setOriginalSha] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const [dirty, setDirty] = useState(false)
  const [idTouched, setIdTouched] = useState(!isNew)
  const [showPreview, setShowPreview] = useState(false)
  const [draft, setDraft] = useState<{ board: Board; at: string } | null>(null)
  const [busyImage, setBusyImage] = useState(false)
  const [, forceRender] = useReducer((x: number) => x + 1, 0)
  const pendingRef = useRef<Map<string, { blob: Blob; url: string }>>(new Map())

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    setStatus('')
    setDraft(null)
    ;(async () => {
      try {
        if (isNew) {
          if (alive) {
            setBoard(blankBoard())
            setOriginalSha(null)
            setDirty(false)
            setLoading(false)
          }
          return
        }
        const file = await getTextFile(config, `public/boards/${boardId}.json`)
        if (!file) throw new Error(`No board file named "${boardId}.json".`)
        const loaded = JSON.parse(file.text) as Board
        let storedDraft: { board: Board; at: string } | null = null
        try {
          const raw = localStorage.getItem(DRAFT_PREFIX + loaded.id)
          if (raw) storedDraft = JSON.parse(raw) as { board: Board; at: string }
        } catch {
          /* ignore */
        }
        if (alive) {
          setBoard(loaded)
          setOriginalSha(file.sha)
          setDirty(false)
          setLoading(false)
          if (storedDraft) setDraft(storedDraft)
        }
      } catch (err) {
        if (alive) {
          setError(String(err))
          setLoading(false)
        }
      }
    })()
    return () => {
      alive = false
    }
  }, [config, boardId, isNew])

  // Autosave a draft so a refresh never loses work.
  useEffect(() => {
    if (!board || loading || !dirty) return
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_PREFIX + board.id,
          JSON.stringify({ at: new Date().toISOString(), board }),
        )
      } catch {
        /* ignore */
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [board, loading, dirty])

  useEffect(() => {
    if (!dirty) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  useEffect(
    () => () => {
      for (const entry of pendingRef.current.values()) URL.revokeObjectURL(entry.url)
    },
    [],
  )

  const patchBoard = (patch: Partial<Board>) => {
    setBoard((b) => (b ? { ...b, ...patch } : b))
    setDirty(true)
  }

  const patchCategory = (ci: number, patch: Partial<Category>) => {
    setBoard((b) =>
      b
        ? { ...b, categories: b.categories.map((c, i) => (i === ci ? { ...c, ...patch } : c)) }
        : b,
    )
    setDirty(true)
  }

  const patchClue = (ci: number, ri: number, patch: Partial<Clue>) => {
    setBoard((b) =>
      b
        ? {
            ...b,
            categories: b.categories.map((c, i) =>
              i !== ci
                ? c
                : { ...c, clues: c.clues.map((cl, r) => (r === ri ? { ...cl, ...patch } : cl)) },
            ),
          }
        : b,
    )
    setDirty(true)
  }

  const patchFinal = (patch: Partial<FinalRound>) => {
    setBoard((b) => (b && b.final ? { ...b, final: { ...b.final, ...patch } } : b))
    setDirty(true)
  }

  const patchFinalPage = (index: number, patch: Partial<FinalPage>) => {
    setBoard((b) =>
      b && b.final
        ? {
            ...b,
            final: {
              ...b.final,
              pages: b.final.pages.map((p, i) => (i === index ? { ...p, ...patch } : p)),
            },
          }
        : b,
    )
    setDirty(true)
  }

  const pickImage = async (file: File, apply: (path: string) => void) => {
    setBusyImage(true)
    setError(null)
    try {
      const processed = await processImage(file)
      const path = `images/${processed.name}`
      const existing = pendingRef.current.get(path)
      if (existing) URL.revokeObjectURL(existing.url)
      pendingRef.current.set(path, {
        blob: processed.blob,
        url: URL.createObjectURL(processed.blob),
      })
      apply(path)
      setDirty(true)
      forceRender()
      setStatus(`Image ready: ${path} (${formatBytes(processed.blob.size)}) — save to commit it.`)
    } catch (err) {
      setError(String(err))
    } finally {
      setBusyImage(false)
    }
  }

  const previewSrc = (path?: string): string | undefined => {
    if (!path) return undefined
    const pending = pendingRef.current.get(path)
    return pending ? pending.url : resolveImage(path)
  }

  const save = async () => {
    if (!board) return
    const problems = validateBoard(board)
    if (problems.length > 0) {
      setError(problems.join(' '))
      setStatus('')
      return
    }
    setError(null)
    setStatus('Saving…')
    try {
      if (!isNew && originalSha) {
        const currentSha = await getFileSha(config, `public/boards/${board.id}.json`)
        if (currentSha && currentSha !== originalSha) {
          const overwrite = window.confirm(
            'This board changed on GitHub since you opened it. Overwrite those changes?',
          )
          if (!overwrite) {
            setStatus('')
            return
          }
        }
      }

      const manifestFile = await getTextFile(config, 'public/boards/index.json')
      const manifest = manifestFile ? parseManifest(manifestFile.text) : { boards: [] }

      const changes: FileChange[] = [
        { path: `public/boards/${board.id}.json`, text: `${JSON.stringify(board, null, 2)}\n` },
        {
          path: 'public/boards/index.json',
          text: serializeManifest(upsertSummary(manifest, board)),
        },
      ]
      for (const [path, entry] of pendingRef.current) {
        changes.push({
          path: `public/boards/${path}`,
          bytes: new Uint8Array(await entry.blob.arrayBuffer()),
        })
      }

      const action = isNew ? 'create' : 'update'
      await commitFiles(config, `board: ${action} "${board.title}"`, changes)

      for (const entry of pendingRef.current.values()) URL.revokeObjectURL(entry.url)
      pendingRef.current.clear()
      localStorage.removeItem(DRAFT_PREFIX + board.id)
      setDirty(false)
      setDraft(null)
      setStatus(`Committed "${board.title}". Live in about a minute.`)

      if (isNew) {
        navigate(`/jeopardy/admin/edit/${board.id}`, { replace: true })
      } else {
        try {
          setOriginalSha(await getFileSha(config, `public/boards/${board.id}.json`))
        } catch {
          setOriginalSha(null)
        }
      }
    } catch (err) {
      setError(String(err))
      setStatus('')
    }
  }

  if (loading) return <p className="admin-hint">Loading…</p>
  if (error && !board) return <p className="admin-error">{error}</p>
  if (!board) return <p className="admin-hint">Nothing to edit.</p>

  const boardFinal = board.final

  return (
    <div className="admin-editor">
      {draft && (
        <div className="admin-banner">
          <span>You have unsaved changes from {new Date(draft.at).toLocaleString()}.</span>
          <div className="admin-banner__actions">
            <button
              type="button"
              className="jbtn jbtn--sm"
              onClick={() => {
                setBoard(draft.board)
                setDirty(true)
                setDraft(null)
              }}
            >
              Restore draft
            </button>
            <button
              type="button"
              className="jbtn jbtn--sm jbtn--quiet"
              onClick={() => {
                localStorage.removeItem(DRAFT_PREFIX + board.id)
                setDraft(null)
              }}
            >
              Discard
            </button>
          </div>
        </div>
      )}

      <div className="admin-editor__bar">
        <div className="admin-editor__status">
          {dirty && <span className="admin-flag">Unsaved changes</span>}
          {status && <span className="admin-hint">{status}</span>}
          {error && board && <span className="admin-error">{error}</span>}
        </div>
        <div className="admin-editor__actions">
          <button type="button" className="jbtn" onClick={() => setShowPreview(true)}>
            Preview
          </button>
          <button type="button" className="jbtn jbtn--primary" onClick={() => void save()}>
            Save &amp; publish
          </button>
        </div>
      </div>

      <section className="admin-card">
        <h2>Board</h2>
        <label className="admin-field">
          <span className="admin-label">Title</span>
          <input
            value={board.title}
            onChange={(event) => {
              const title = event.target.value
              setBoard((b) =>
                b ? { ...b, title, id: idTouched ? b.id : slugifyId(title) } : b,
              )
              setDirty(true)
            }}
          />
        </label>
        <label className="admin-field">
          <span className="admin-label">Id (file name)</span>
          <input
            value={board.id}
            onChange={(event) => {
              setIdTouched(true)
              patchBoard({ id: event.target.value })
            }}
          />
        </label>
        <label className="admin-field">
          <span className="admin-label">Description</span>
          <input
            value={board.description ?? ''}
            onChange={(event) => patchBoard({ description: event.target.value })}
          />
        </label>
      </section>

      <section className="admin-card">
        <h2>Final round</h2>
        {boardFinal ? (
          <>
            <label className="admin-field">
              <span className="admin-label">Category</span>
              <input
                value={boardFinal.category}
                onChange={(event) => patchFinal({ category: event.target.value })}
              />
            </label>
            <ListEditor
              label="Rules"
              items={boardFinal.rules ?? []}
              onChange={(rules) => patchFinal({ rules })}
            />
            <div className="admin-pages">
              {boardFinal.pages.map((page, pi) => (
                <div className="admin-pages__row" key={pi}>
                  <span className="admin-label">Question {pi + 1}</span>
                  <input
                    value={page.prompt}
                    placeholder="Prompt"
                    onChange={(event) => patchFinalPage(pi, { prompt: event.target.value })}
                  />
                  <input
                    value={page.answer ?? ''}
                    placeholder="Answer"
                    onChange={(event) => patchFinalPage(pi, { answer: event.target.value })}
                  />
                  <button
                    type="button"
                    className="jbtn jbtn--sm jbtn--quiet"
                    onClick={() =>
                      patchFinal({ pages: boardFinal.pages.filter((_, i) => i !== pi) })
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="jbtn jbtn--sm jbtn--quiet"
                onClick={() =>
                  patchFinal({ pages: [...boardFinal.pages, { prompt: '', answer: '' }] })
                }
              >
                + Add question
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            className="jbtn jbtn--sm"
            onClick={() =>
              patchBoard({
                final: { category: 'Final Jeopardy', rules: [], pages: [{ prompt: '', answer: '' }] },
              })
            }
          >
            + Add final round
          </button>
        )}
      </section>

      {board.categories.map((category, ci) => (
        <section className="admin-card" key={category.id}>
          <label className="admin-field">
            <span className="admin-label">Category {ci + 1}</span>
            <input
              value={category.title}
              onChange={(event) => patchCategory(ci, { title: event.target.value })}
            />
          </label>
          <div className="admin-clues">
            {category.clues.map((clue, ri) => (
              <div className="admin-clue" key={clue.id}>
                <div className="admin-clue__head">${clue.value}</div>
                <label className="admin-field">
                  <span className="admin-label">Prompt</span>
                  <textarea
                    rows={2}
                    value={clue.prompt}
                    onChange={(event) => patchClue(ci, ri, { prompt: event.target.value })}
                  />
                </label>
                <label className="admin-field">
                  <span className="admin-label">Answer</span>
                  <input
                    value={clue.answer}
                    onChange={(event) => patchClue(ci, ri, { answer: event.target.value })}
                  />
                </label>
                <ListEditor
                  label="Rules"
                  items={clue.rules ?? []}
                  onChange={(rules) => patchClue(ci, ri, { rules })}
                />
                <ListEditor
                  label="Reveal steps"
                  items={clue.revealSteps ?? []}
                  onChange={(revealSteps) => patchClue(ci, ri, { revealSteps })}
                  addLabel="Add step"
                />
                <div className="admin-clue__images">
                  <ImagePicker
                    label="Clue image"
                    value={clue.image}
                    previewSrc={previewSrc(clue.image)}
                    busy={busyImage}
                    onPick={(file) => void pickImage(file, (path) => patchClue(ci, ri, { image: path }))}
                    onClear={() => patchClue(ci, ri, { image: undefined })}
                  />
                  <ImagePicker
                    label="Answer image"
                    value={clue.answerImage}
                    previewSrc={previewSrc(clue.answerImage)}
                    busy={busyImage}
                    onPick={(file) =>
                      void pickImage(file, (path) => patchClue(ci, ri, { answerImage: path }))
                    }
                    onClear={() => patchClue(ci, ri, { answerImage: undefined })}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="admin-editor__foot">
        <button type="button" className="jbtn jbtn--primary" onClick={() => void save()}>
          Save &amp; publish
        </button>
      </div>

      {showPreview && (
        <BoardPreview board={board} resolveSrc={previewSrc} onClose={() => setShowPreview(false)} />
      )}
    </div>
  )
}
