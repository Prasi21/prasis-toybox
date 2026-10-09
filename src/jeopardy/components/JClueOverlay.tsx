import { useEffect, useState } from 'react'
import type { Clue, Player } from '../types'
import { resolveImage } from '../loader'
import { money } from '../format'

type Props = {
  categoryTitle: string
  clue: Clue
  players: Player[]
  onAward: (playerId: string, delta: number) => void
  /** keepTile = true keeps the tile used; false returns it to the board unused. */
  onClose: (keepTile: boolean) => void
  /** Optional override so the editor can preview un-committed images. */
  imageResolver?: (src?: string) => string | undefined
}

export function JClueOverlay({
  categoryTitle,
  clue,
  players,
  onAward,
  onClose,
  imageResolver = resolveImage,
}: Props) {
  const steps = clue.revealSteps ?? []
  const [progress, setProgress] = useState(0)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const image = imageResolver(clue.image)
  const answerImage = imageResolver(clue.answerImage)
  const hasAnswer = clue.answer.trim().length > 0
  const stepsDone = progress >= steps.length
  // The answer always requires a click to reveal.
  const showAnswer = stepsDone && hasAnswer && revealed
  const showAwards = stepsDone && (revealed || !hasAnswer)
  const canGoBack = revealed || progress > 0

  const goBack = () => {
    if (revealed) {
      setRevealed(false)
      return
    }
    setProgress((p) => Math.max(0, p - 1))
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

        {image && <img className="joverlay__img" src={image} alt="" />}

        <p className="joverlay__prompt">{clue.prompt}</p>

        {clue.rules && clue.rules.length > 0 && (
          <ul className="joverlay__rules">
            {clue.rules.map((rule, index) => (
              <li key={index}>{rule}</li>
            ))}
          </ul>
        )}

        {steps.slice(0, progress).map((step, index) => (
          <p className="joverlay__step" key={index}>
            {step}
          </p>
        ))}

        {showAnswer && (
          <div className="jclue__answer">
            <span className="jlabel">Correct response</span>
            <p className="joverlay__answer">{clue.answer}</p>
            {answerImage && (
              <img className="joverlay__img joverlay__img--answer" src={answerImage} alt="" />
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
              onClick={() => setProgress((p) => p + 1)}
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
