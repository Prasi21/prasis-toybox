import type { Board } from '../types'

type Props = {
  board: Board
  used: Set<string>
  onPick: (categoryIndex: number, clueIndex: number) => void
}

export function JBoard({ board, used, onPick }: Props) {
  return (
    <div className="jboard">
      <div className="jboard__cats">
        {board.categories.map((category) => (
          <div className="jcat" key={category.id}>
            <span>{category.title}</span>
          </div>
        ))}
      </div>

      {board.values.map((value, rowIndex) => (
        <div className="jboard__row" key={value}>
          {board.categories.map((category, catIndex) => {
            const clue = category.clues[rowIndex]
            const key = `${catIndex}-${rowIndex}`
            const isUsed = used.has(key)
            return (
              <button
                key={key}
                type="button"
                className={`jcell${isUsed ? ' is-used' : ''}`}
                onClick={() => onPick(catIndex, rowIndex)}
                disabled={isUsed || !clue}
                aria-label={clue ? `${category.title} for ${value}` : 'Empty tile'}
              >
                {clue ? `$${clue.value}` : ''}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
