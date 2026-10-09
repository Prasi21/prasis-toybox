import {
  DEFAULT_VALUES,
  type Board,
  type BoardManifest,
  type BoardSummary,
  type Category,
} from '../types'

export function slugifyId(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'board'
  )
}

function blankCategory(index: number): Category {
  return {
    id: `cat-${index + 1}`,
    title: `Category ${index + 1}`,
    clues: DEFAULT_VALUES.map((value) => ({
      id: `cat-${index + 1}-${value}`,
      value,
      prompt: '',
      answer: '',
    })),
  }
}

export function blankBoard(): Board {
  return {
    id: 'new-board',
    title: 'New Board',
    description: '',
    values: [...DEFAULT_VALUES],
    categories: Array.from({ length: 6 }, (_, i) => blankCategory(i)),
    final: {
      category: 'Final Jeopardy',
      rules: [],
      pages: [{ prompt: '', answer: '' }],
    },
  }
}

export function boardSummary(board: Board): BoardSummary {
  return {
    id: board.id,
    file: `${board.id}.json`,
    title: board.title,
    description: board.description?.trim() ? board.description.trim() : undefined,
    updatedAt: new Date().toISOString().slice(0, 10),
  }
}

export function parseManifest(text: string): BoardManifest {
  const parsed = JSON.parse(text) as Partial<BoardManifest>
  return { boards: Array.isArray(parsed.boards) ? parsed.boards : [] }
}

export function serializeManifest(manifest: BoardManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`
}

export function upsertSummary(manifest: BoardManifest, board: Board): BoardManifest {
  const summary = boardSummary(board)
  const boards = manifest.boards.filter((b) => b.id !== board.id)
  boards.push(summary)
  boards.sort((a, b) => a.title.localeCompare(b.title))
  return { boards }
}

export function removeSummary(manifest: BoardManifest, id: string): BoardManifest {
  return { boards: manifest.boards.filter((b) => b.id !== id) }
}

export function validateBoard(board: Board): string[] {
  const errors: string[] = []
  if (!board.title.trim()) errors.push('Board title is required.')
  if (!/^[a-z0-9][a-z0-9-]*$/.test(board.id)) {
    errors.push('Board id must be lowercase letters, numbers and hyphens.')
  }
  if (board.categories.length !== 6) errors.push('A board needs exactly 6 categories.')
  board.categories.forEach((category, ci) => {
    if (!category.title.trim()) errors.push(`Category ${ci + 1} needs a title.`)
    if (category.clues.length !== 5) errors.push(`Category ${ci + 1} needs exactly 5 clues.`)
    category.clues.forEach((clue) => {
      if (!clue.prompt.trim()) {
        errors.push(`Category ${ci + 1}, $${clue.value}: the prompt is empty.`)
      }
    })
  })
  return errors
}
