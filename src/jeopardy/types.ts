/**
 * Jeopardy board data model.
 *
 * Boards are plain JSON files stored in `public/boards/` and fetched at
 * runtime, so the game stays fully static.
 *
 * All clue/category text is the board author's own wording and is rendered
 * verbatim — never rewritten or substituted.
 */

export type CardLink = {
  label: string
  href: string
}

export type CardRandom =
  | { type: 'number'; min: number; max: number }
  | { type: 'letter' }

/**
 * One step in a clue's "card stack". Cards let a clue carry a richer,
 * host-driven sequence (images, audio, a timer, a link out) without any
 * game logic — the scuffed-minigame primitive.
 */
export type Card = {
  title?: string
  text?: string
  /** Image URL or a path relative to `public/boards/`. */
  image?: string
  /** Audio URL or a path relative to `public/boards/`. */
  audio?: string
  link?: CardLink
  /** Optional countdown shown on this card, in seconds. */
  timerSeconds?: number
  /** Optional random generator (a die roll or a random letter). */
  random?: CardRandom
}

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
  /** Optional audio played with the clue (a path or an absolute URL). */
  audio?: string
  /** Optional audio played when the answer is revealed. */
  answerAudio?: string
  /** Optional staged reveals shown one at a time before the answer. */
  revealSteps?: string[]
  /** Optional richer sequence. When present, this replaces `revealSteps`. */
  cards?: Card[]
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
  /** Optional random generator shown on this page. */
  random?: CardRandom
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
