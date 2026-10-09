/**
 * Jeopardy board data model.
 *
 * Boards are plain JSON files stored in `public/boards/` and fetched at
 * runtime, so the game stays fully static.
 *
 * All clue/category text is the board author's own wording and is rendered
 * verbatim — never rewritten or substituted.
 */

export type Clue = {
  id: string
  value: number
  prompt: string
  answer: string
  /**
   * Extra rules / instructions shown with the clue (used by mini-game tiles).
   * Purely informational — any scoring or game logic happens off-screen.
   */
  rules?: string[]
  /** Optional image: an absolute URL, or a path relative to `public/boards/`. */
  image?: string
  /** Optional image revealed with the answer. */
  answerImage?: string
  /** Optional staged reveals shown one at a time before the answer. */
  revealSteps?: string[]
  /** Optional host note. Never shown during play. */
  note?: string
}

export type Category = {
  id: string
  title: string
  clues: Clue[]
}

/** One page of the Final round. */
export type FinalPage = {
  prompt: string
  answer?: string
  image?: string
}

export type FinalRound = {
  category: string
  /** Informational rules shown before the questions. */
  rules?: string[]
  /** Question pages, stepped through in order. */
  pages: FinalPage[]
}

export type Board = {
  id: string
  title: string
  description?: string
  /** Row values, top to bottom. Defaults to 200..1000. */
  values: number[]
  categories: Category[]
  final?: FinalRound
  updatedAt?: string
}

/** The lightweight entry listed in `public/boards/index.json`. */
export type BoardSummary = {
  id: string
  file: string
  title: string
  description?: string
  updatedAt?: string
}

export type BoardManifest = {
  boards: BoardSummary[]
}

export type Player = {
  id: string
  name: string
  score: number
}

export const DEFAULT_VALUES = [200, 400, 600, 800, 1000]
