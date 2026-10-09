import type { Player } from '../types'
import { money } from '../format'

type Props = {
  players: Player[]
  activeId: string | null
  onActivate: (id: string) => void
  onRename: (id: string, name: string) => void
  onAdjust: (id: string, delta: number) => void
  onRemove: (id: string) => void
  onAdd: () => void
  onResetScores: () => void
}

export function JScoreboard({
  players,
  activeId,
  onActivate,
  onRename,
  onAdjust,
  onRemove,
  onAdd,
  onResetScores,
}: Props) {
  return (
    <div className="jscores">
      {players.map((player) => (
        <div
          key={player.id}
          className={`jscores__player${player.id === activeId ? ' is-active' : ''}`}
          onClick={() => onActivate(player.id)}
        >
          <input
            className="jscores__name"
            value={player.name}
            onChange={(event) => onRename(player.id, event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onFocus={() => onActivate(player.id)}
            aria-label={`Rename ${player.name}`}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <span className={`jscores__val${player.score < 0 ? ' is-neg' : ''}`}>
            {money(player.score)}
          </span>
          <div className="jscores__ctrl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => onAdjust(player.id, -100)}
              aria-label={`Subtract 100 from ${player.name}`}
            >
              &minus;
            </button>
            <button
              type="button"
              onClick={() => onAdjust(player.id, 100)}
              aria-label={`Add 100 to ${player.name}`}
            >
              +
            </button>
            <button
              type="button"
              className="jscores__remove"
              onClick={() => onRemove(player.id)}
              aria-label={`Remove ${player.name}`}
            >
              &times;
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="jscores__add" onClick={onAdd}>
        + Player
      </button>
      <button type="button" className="jscores__add jscores__add--quiet" onClick={onResetScores}>
        Reset scores
      </button>
    </div>
  )
}
