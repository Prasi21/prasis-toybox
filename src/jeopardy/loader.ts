import type { Board, BoardManifest, BoardSummary } from './types'

const BASE = import.meta.env.BASE_URL

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`Failed to load ${path} (HTTP ${res.status})`)
  return (await res.json()) as T
}

/** List the boards advertised in the manifest. */
export async function loadManifest(): Promise<BoardSummary[]> {
  const manifest = await getJson<BoardManifest>(`${BASE}boards/index.json`)
  return manifest.boards ?? []
}

/** Load a single board by its file name (e.g. `my-board.json`). */
export async function loadBoard(file: string): Promise<Board> {
  return getJson<Board>(`${BASE}boards/${file}`)
}

/** Resolve a clue image reference to a usable URL. */
export function resolveImage(src?: string): string | undefined {
  if (!src) return undefined
  if (/^(https?:|data:|blob:)/.test(src)) return src
  // Anything else is treated as a path relative to the boards folder.
  return `${BASE}boards/${src}`
}
