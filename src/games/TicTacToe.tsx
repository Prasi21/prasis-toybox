import { useState } from 'react'

type Player = 'X' | 'O'
type Cell = Player | null
type Scores = { X: number; O: number; draws: number }
type Win = { player: Player; line: number[] }
type Result = Win | 'draw' | null

const LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

const EMPTY_BOARD: Cell[] = Array<Cell>(9).fill(null)

function getWinner(board: Cell[]): Win | null {
  for (const line of LINES) {
    const [a, b, c] = line
    const value = board[a]
    if (value && value === board[b] && value === board[c]) {
      return { player: value, line }
    }
  }
  return null
}

export default function TicTacToe() {
  const [board, setBoard] = useState<Cell[]>(EMPTY_BOARD)
  const [xIsNext, setXIsNext] = useState(true)
  const [scores, setScores] = useState<Scores>({ X: 0, O: 0, draws: 0 })
  const [result, setResult] = useState<Result>(null)

  const current: Player = xIsNext ? 'X' : 'O'
  const winningLine = result && result !== 'draw' ? result.line : []

  function play(index: number) {
    if (board[index] || result) return

    const next = board.slice()
    next[index] = current
    const win = getWinner(next)
    setBoard(next)

    if (win) {
      setResult(win)
      setScores((s) => (win.player === 'X' ? { ...s, X: s.X + 1 } : { ...s, O: s.O + 1 }))
    } else if (next.every((cell) => cell !== null)) {
      setResult('draw')
      setScores((s) => ({ ...s, draws: s.draws + 1 }))
    } else {
      setXIsNext((v) => !v)
    }
  }

  function newRound() {
    setBoard(EMPTY_BOARD)
    setXIsNext(true)
    setResult(null)
  }

  function resetScores() {
    newRound()
    setScores({ X: 0, O: 0, draws: 0 })
  }

  const status =
    result === 'draw'
      ? "It's a draw."
      : result
        ? `${result.player} takes the round!`
        : `${current}, your move`

  return (
    <div className="ttt">
      <div className="ttt__scoreboard">
        <div className={`ttt__score ttt__score--x${!result && current === 'X' ? ' is-active' : ''}`}>
          <span className="ttt__score-mark">X</span>
          <span className="ttt__score-num">{scores.X}</span>
        </div>
        <div className="ttt__score ttt__score--draw">
          <span className="ttt__score-mark">=</span>
          <span className="ttt__score-num">{scores.draws}</span>
        </div>
        <div className={`ttt__score ttt__score--o${!result && current === 'O' ? ' is-active' : ''}`}>
          <span className="ttt__score-mark">O</span>
          <span className="ttt__score-num">{scores.O}</span>
        </div>
      </div>

      <p className="ttt__status" aria-live="polite">
        {status}
      </p>

      <div className="ttt__board" role="grid" aria-label="Tic-Tac-Toe board">
        {board.map((cell, index) => (
          <button
            key={index}
            type="button"
            className={
              'ttt__cell' + (cell ? ' is-filled' : '') + (winningLine.includes(index) ? ' is-win' : '')
            }
            onClick={() => play(index)}
            disabled={cell !== null || result !== null}
            aria-label={cell ? `Cell ${index + 1}: ${cell}` : `Play ${current} in cell ${index + 1}`}
          >
            {cell && (
              <span className={`ttt__mark ttt__mark--${cell === 'X' ? 'x' : 'o'}`}>{cell}</span>
            )}
          </button>
        ))}
      </div>

      <div className="ttt__actions">
        <button type="button" className="btn btn--primary" onClick={newRound}>
          {result ? 'Play again' : 'Restart round'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={resetScores}>
          Reset scores
        </button>
      </div>
    </div>
  )
}
