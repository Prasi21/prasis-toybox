import { useEffect, useState } from 'react'
import type { FinalRound, Player } from '../types'
import { resolveImage } from '../loader'
import { money } from '../format'

type Props = {
  final: FinalRound
  players: Player[]
  maxValue: number
  onApply: (playerId: string, delta: number) => void
  onClose: () => void
}

type Phase = 'rules' | 'wager' | 'pages' | 'apply'

export function JFinal({ final, players, maxValue, onApply, onClose }: Props) {
  const rules = final.rules ?? []
  const pages = final.pages

  const [phase, setPhase] = useState<Phase>(rules.length > 0 ? 'rules' : 'wager')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageRevealed, setPageRevealed] = useState(false)
  const [wagers, setWagers] = useState<Record<string, number>>({})
  const [applied, setApplied] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const wagerFor = (player: Player) => {
    const max = Math.max(player.score, maxValue)
    const raw = wagers[player.id]
    if (raw === undefined || Number.isNaN(raw)) return 0
    return Math.max(0, Math.min(raw, max))
  }

  const page = pages[pageIndex]
  const isLastPage = pageIndex >= pages.length - 1

  const canGoBack =
    (phase === 'wager' && rules.length > 0) ||
    (phase === 'pages' && (pageRevealed || pageIndex > 0)) ||
    phase === 'apply'

  const goBack = () => {
    if (phase === 'wager') {
      if (rules.length > 0) setPhase('rules')
      return
    }
    if (phase === 'pages') {
      if (pageRevealed) {
        setPageRevealed(false)
      } else if (pageIndex > 0) {
        setPageIndex((i) => i - 1)
        setPageRevealed(true)
      }
      return
    }
    if (phase === 'apply') {
      if (pages.length > 0) {
        setPageIndex(pages.length - 1)
        setPageRevealed(true)
        setPhase('pages')
      } else {
        setPhase('wager')
      }
    }
  }

  return (
    <div className="joverlay" role="dialog" aria-modal="true" aria-label="Final Jeopardy">
      <div className="joverlay__panel">
        <div className="joverlay__top">
          <span className="joverlay__meta">{final.category}</span>
          <span className="joverlay__value joverlay__value--final">
            {phase === 'pages' && pages.length > 0
              ? `Question ${pageIndex + 1} / ${pages.length}`
              : 'Final'}
          </span>
        </div>

        {phase === 'rules' && (
          <>
            <ul className="joverlay__rules">
              {rules.map((rule, index) => (
                <li key={index}>{rule}</li>
              ))}
            </ul>
            <div className="joverlay__actions joverlay__actions--bar">
              <button type="button" className="jbtn jbtn--quiet" onClick={onClose}>
                Exit
              </button>
              <span className="joverlay__grow" />
              <button
                type="button"
                className="jbtn jbtn--primary"
                onClick={() => setPhase('wager')}
              >
                Continue
              </button>
            </div>
          </>
        )}

        {phase === 'wager' && (
          <>
            <p className="joverlay__hint">
              Each player locks in a wager — up to their score, or {money(maxValue)}.
            </p>
            <div className="jwager">
              {players.map((player) => (
                <label className="jwager__row" key={player.id}>
                  <span className="jwager__name">{player.name}</span>
                  <span className="jwager__score">{money(player.score)}</span>
                  <input
                    className="jwager__input"
                    type="number"
                    min={0}
                    max={Math.max(player.score, maxValue)}
                    value={wagers[player.id] ?? ''}
                    placeholder="0"
                    onChange={(event) =>
                      setWagers((w) => ({ ...w, [player.id]: Number(event.target.value) }))
                    }
                  />
                </label>
              ))}
            </div>
            <div className="joverlay__actions joverlay__actions--bar">
              <button type="button" className="jbtn jbtn--quiet" onClick={onClose}>
                Exit
              </button>
              <span className="joverlay__grow" />
              {canGoBack && (
                <button type="button" className="jbtn" onClick={goBack}>
                  Back
                </button>
              )}
              <button
                type="button"
                className="jbtn jbtn--primary"
                onClick={() => (pages.length > 0 ? setPhase('pages') : setPhase('apply'))}
              >
                {pages.length > 0 ? 'Begin' : 'Reveal'}
              </button>
            </div>
          </>
        )}

        {phase === 'pages' && page && (
          <>
            {resolveImage(page.image) && (
              <img className="joverlay__img" src={resolveImage(page.image)} alt="" />
            )}
            <p className="joverlay__prompt">{page.prompt}</p>

            {pageRevealed && page.answer && (
              <div className="jclue__answer">
                <span className="jlabel">Correct response</span>
                <p className="joverlay__answer">{page.answer}</p>
              </div>
            )}

            <div className="joverlay__actions joverlay__actions--bar">
              <button type="button" className="jbtn jbtn--quiet" onClick={onClose}>
                Exit
              </button>
              <span className="joverlay__grow" />
              {canGoBack && (
                <button type="button" className="jbtn" onClick={goBack}>
                  Back
                </button>
              )}
              {page.answer && !pageRevealed ? (
                <button
                  type="button"
                  className="jbtn jbtn--primary"
                  onClick={() => setPageRevealed(true)}
                >
                  Reveal answer
                </button>
              ) : (
                <button
                  type="button"
                  className="jbtn jbtn--primary"
                  onClick={() => {
                    if (isLastPage) {
                      setPhase('apply')
                    } else {
                      setPageIndex((i) => i + 1)
                      setPageRevealed(false)
                    }
                  }}
                >
                  {isLastPage ? 'Settle wagers' : 'Next question'}
                </button>
              )}
            </div>
          </>
        )}

        {phase === 'apply' && (
          <>
            <p className="joverlay__hint">Settle each wager: did they win it or lose it?</p>
            <div className="jaward">
              {players.map((player) => {
                const wager = wagerFor(player)
                const isApplied = applied[player.id]
                return (
                  <div className="jaward__row" key={player.id}>
                    <span className="jaward__name">{player.name}</span>
                    <span className="jaward__score">{money(player.score)}</span>
                    <button
                      type="button"
                      className="jbtn jbtn--good jbtn--sm"
                      disabled={isApplied}
                      onClick={() => {
                        onApply(player.id, wager)
                        setApplied((a) => ({ ...a, [player.id]: true }))
                      }}
                    >
                      +{money(wager)}
                    </button>
                    <button
                      type="button"
                      className="jbtn jbtn--bad jbtn--sm"
                      disabled={isApplied}
                      onClick={() => {
                        onApply(player.id, -wager)
                        setApplied((a) => ({ ...a, [player.id]: true }))
                      }}
                    >
                      &minus;{money(wager)}
                    </button>
                  </div>
                )
              })}
            </div>
            <div className="joverlay__actions joverlay__actions--bar">
              <button type="button" className="jbtn jbtn--quiet" onClick={onClose}>
                Exit
              </button>
              <span className="joverlay__grow" />
              {canGoBack && (
                <button type="button" className="jbtn" onClick={goBack}>
                  Back
                </button>
              )}
              <button type="button" className="jbtn jbtn--primary" onClick={onClose}>
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
