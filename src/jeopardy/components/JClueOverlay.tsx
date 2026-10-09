import { useEffect, useState } from 'react'
import type { Card, Clue, Player } from '../types'
import { resolveAsset } from '../loader'
import { money } from '../format'
import { RandomRoller } from './RandomRoller'

type Props = {
  categoryTitle: string
  clue: Clue
  players: Player[]
  onAward: (playerId: string, delta: number) => void
  /** keepTile = true keeps the tile used; false returns it to the board unused. */
  onClose: (keepTile: boolean) => void
  /** Optional override so the editor can preview un-committed assets. */
  assetResolver?: (src?: string) => string | undefined
}

function Countdown({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState(seconds)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false)
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [running])

  const mm = Math.floor(remaining / 60)
  const ss = String(remaining % 60).padStart(2, '0')

  return (
    <div className="jcard__timer">
      <span className={`jcard__clock${running ? ' is-running' : ''}`}>
        {mm}:{ss}
      </span>
      <button
        type="button"
        className="jbtn jbtn--sm"
        onClick={() => setRunning((r) => !r)}
        disabled={remaining === 0}
      >
        {running ? 'Pause' : remaining === seconds ? 'Start timer' : 'Resume'}
      </button>
      <button
        type="button"
        className="jbtn jbtn--sm jbtn--quiet"
        onClick={() => {
          setRunning(false)
          setRemaining(seconds)
        }}
      >
        Reset
      </button>
    </div>
  )
}

function CardView({
  card,
  resolve,
}: {
  card: Card
  resolve: (src?: string) => string | undefined
}) {
  const image = resolve(card.image)
  const audio = resolve(card.audio)
  return (
    <div className="jcard">
      {card.title && <h3 className="jcard__title">{card.title}</h3>}
      {card.text && <p className="jcard__text">{card.text}</p>}
      {image && <img className="joverlay__img" src={image} alt="" />}
      {audio && <audio className="jcard__audio" controls src={audio} />}
      {card.link && card.link.href && (
        <a
          className="jbtn jbtn--primary jcard__link"
          href={card.link.href}
          target="_blank"
          rel="noreferrer"
        >
          {card.link.label || 'Open link'}
        </a>
      )}
      {card.random && <RandomRoller spec={card.random} />}
      {typeof card.timerSeconds === 'number' && card.timerSeconds > 0 && (
        <Countdown seconds={card.timerSeconds} />
      )}
    </div>
  )
}

export function JClueOverlay({
  categoryTitle,
  clue,
  players,
  onAward,
  onClose,
  assetResolver = resolveAsset,
}: Props) {
  const cards = clue.cards && clue.cards.length > 0 ? clue.cards : null
  const steps = clue.revealSteps ?? []
  const stepCount = cards ? cards.length : steps.length
  const minProgress = cards ? 1 : 0

  const [progress, setProgress] = useState(minProgress)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const image = assetResolver(clue.image)
  const answerImage = assetResolver(clue.answerImage)
  const audio = assetResolver(clue.audio)
  const answerAudio = assetResolver(clue.answerAudio)
  const hasAnswer = clue.answer.trim().length > 0
  const stepsDone = progress >= stepCount
  // The answer always requires a click to reveal.
  const showAnswer = stepsDone && hasAnswer && revealed
  const showAwards = stepsDone && (revealed || !hasAnswer)
  const canGoBack = revealed || progress > minProgress

  const goBack = () => {
    if (revealed) {
      setRevealed(false)
      return
    }
    setProgress((p) => Math.max(minProgress, p - 1))
  }

  return (
    <div
      className="joverlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${categoryTitle} for ${money(clue.value)}`}
    >
      <div className="joverlay__panel">
        <div className="joverlay__top">
          <span className="joverlay__meta">{categoryTitle}</span>
          <span className="joverlay__value">{money(clue.value)}</span>
        </div>

        <p className="joverlay__prompt">{clue.prompt}</p>

        {clue.rules && clue.rules.length > 0 && (
          <ul className="joverlay__rules">
            {clue.rules.map((rule, index) => (
              <li key={index}>{rule}</li>
            ))}
          </ul>
        )}

        {image && <img className="joverlay__img" src={image} alt="" />}
        {audio && <audio className="jcard__audio" controls src={audio} />}

        {cards ? (
          cards[progress - 1] && (
            <CardView key={progress} card={cards[progress - 1]} resolve={assetResolver} />
          )
        ) : (
          steps.slice(0, progress).map((step, index) => (
            <p className="joverlay__step" key={index}>
              {step}
            </p>
          ))
        )}

        {showAnswer && (
          <div className="jclue__answer">
            <span className="jlabel">Correct response</span>
            <p className="joverlay__answer">{clue.answer}</p>
            {answerImage && (
              <img className="joverlay__img joverlay__img--answer" src={answerImage} alt="" />
            )}
            {answerAudio && (
              <audio className="jcard__audio jcard__audio--answer" controls src={answerAudio} />
            )}
          </div>
        )}

        {showAwards && (
          <div className="jaward">
            <span className="jlabel">Award {money(clue.value)}</span>
            {players.map((player) => (
              <div className="jaward__row" key={player.id}>
                <span className="jaward__name">{player.name}</span>
                <span className="jaward__score">{money(player.score)}</span>
                <button
                  type="button"
                  className="jbtn jbtn--good jbtn--sm"
                  onClick={() => onAward(player.id, clue.value)}
                >
                  +{money(clue.value)}
                </button>
                <button
                  type="button"
                  className="jbtn jbtn--bad jbtn--sm"
                  onClick={() => onAward(player.id, -clue.value)}
                >
                  &minus;{money(clue.value)}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="joverlay__actions joverlay__actions--bar">
          <button type="button" className="jbtn jbtn--quiet" onClick={() => onClose(false)}>
            Exit card
          </button>
          <span className="joverlay__grow" />
          {canGoBack && (
            <button type="button" className="jbtn" onClick={goBack}>
              Back
            </button>
          )}
          {!stepsDone ? (
            <button
              type="button"
              className="jbtn jbtn--primary"
              onClick={() => setProgress((p) => Math.min(stepCount, p + 1))}
            >
              Continue
            </button>
          ) : !revealed && hasAnswer ? (
            <button
              type="button"
              className="jbtn jbtn--primary"
              onClick={() => setRevealed(true)}
            >
              Reveal answer
            </button>
          ) : (
            <button type="button" className="jbtn jbtn--primary" onClick={() => onClose(true)}>
              Back to board
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
