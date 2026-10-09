import { createContext, useContext } from 'react'

export type AdminConfig = {
  token: string
  owner: string
  repo: string
  branch: string
}

const KEY = 'toybox:admin:github'

export function loadConfig(): AdminConfig | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AdminConfig>
    if (typeof parsed.token !== 'string' || parsed.token.length === 0) return null
    return {
      token: parsed.token,
      owner: String(parsed.owner ?? ''),
      repo: String(parsed.repo ?? ''),
      branch: String(parsed.branch || 'main'),
    }
  } catch {
    return null
  }
}

export function persistConfig(config: AdminConfig): void {
  localStorage.setItem(KEY, JSON.stringify(config))
}

export function clearConfig(): void {
  localStorage.removeItem(KEY)
}

/** Guess owner/repo from a GitHub Pages URL. */
export function detectRepo(): { owner: string; repo: string; branch: string } {
  let owner = ''
  let repo = ''
  const host = location.hostname
  if (host.endsWith('.github.io')) {
    owner = host.slice(0, -'.github.io'.length)
    repo = location.pathname.split('/').filter(Boolean)[0] ?? ''
  }
  return { owner, repo, branch: 'main' }
}

export const AdminContext = createContext<AdminConfig | null>(null)

export function useAdminConfig(): AdminConfig {
  const config = useContext(AdminContext)
  if (!config) throw new Error('Admin config is not available')
  return config
}
