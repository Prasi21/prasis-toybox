/**
 * Minimal GitHub REST client for the board editor.
 *
 * Reads files with the Contents API; writes one atomic multi-file commit with
 * the Git Data API (blobs → tree → commit → update ref), so a board + manifest
 * + images all land in a single commit.
 */

export type RepoConfig = {
  token: string
  owner: string
  repo: string
  branch: string
}

const API = 'https://api.github.com'

export type FileChange =
  | { path: string; text: string }
  | { path: string; bytes: Uint8Array }
  | { path: string; remove: true }

export type TextFile = { sha: string; text: string }

function headers(config: RepoConfig, extra?: HeadersInit): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${config.token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    ...(extra ?? {}),
  }
}

async function fail(res: Response): Promise<never> {
  let detail = ''
  try {
    detail = await res.text()
  } catch {
    /* ignore */
  }
  throw new Error(
    `GitHub ${res.status} ${res.statusText}${detail ? ` — ${detail.slice(0, 240)}` : ''}`,
  )
}

export async function testConnection(
  config: RepoConfig,
): Promise<{ fullName: string; defaultBranch: string }> {
  const res = await fetch(`${API}/repos/${config.owner}/${config.repo}`, {
    headers: headers(config),
  })
  if (!res.ok) await fail(res)
  const data = (await res.json()) as { full_name: string; default_branch: string }
  return { fullName: data.full_name, defaultBranch: data.default_branch }
}

export async function getTextFile(config: RepoConfig, path: string): Promise<TextFile | null> {
  const res = await fetch(
    `${API}/repos/${config.owner}/${config.repo}/contents/${path}?ref=${encodeURIComponent(config.branch)}`,
    { headers: headers(config) },
  )
  if (res.status === 404) return null
  if (!res.ok) await fail(res)
  const data = (await res.json()) as { sha: string; content?: string; encoding?: string }
  if (typeof data.content !== 'string' || data.encoding !== 'base64') {
    throw new Error(`Could not read ${path} (too large or unexpected encoding).`)
  }
  return { sha: data.sha, text: base64ToUtf8(data.content.replace(/\n/g, '')) }
}

export async function getFileSha(config: RepoConfig, path: string): Promise<string | null> {
  const file = await getTextFile(config, path)
  return file?.sha ?? null
}

export async function commitFiles(
  config: RepoConfig,
  message: string,
  changes: FileChange[],
): Promise<{ commitSha: string; htmlUrl: string }> {
  const base = `${API}/repos/${config.owner}/${config.repo}`

  const refRes = await fetch(`${base}/git/ref/heads/${encodeURIComponent(config.branch)}`, {
    headers: headers(config),
  })
  if (!refRes.ok) await fail(refRes)
  const ref = (await refRes.json()) as { object: { sha: string } }
  const parentSha = ref.object.sha

  const commitRes = await fetch(`${base}/git/commits/${parentSha}`, { headers: headers(config) })
  if (!commitRes.ok) await fail(commitRes)
  const parentCommit = (await commitRes.json()) as { tree: { sha: string } }

  const tree: Array<Record<string, unknown>> = []
  for (const change of changes) {
    if ('remove' in change) {
      tree.push({ path: change.path, mode: '100644', type: 'blob', sha: null })
      continue
    }
    const bytes = 'bytes' in change ? change.bytes : new TextEncoder().encode(change.text)
    const blobRes = await fetch(`${base}/git/blobs`, {
      method: 'POST',
      headers: headers(config, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ content: bytesToBase64(bytes), encoding: 'base64' }),
    })
    if (!blobRes.ok) await fail(blobRes)
    const blob = (await blobRes.json()) as { sha: string }
    tree.push({ path: change.path, mode: '100644', type: 'blob', sha: blob.sha })
  }

  const treeRes = await fetch(`${base}/git/trees`, {
    method: 'POST',
    headers: headers(config, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ base_tree: parentCommit.tree.sha, tree }),
  })
  if (!treeRes.ok) await fail(treeRes)
  const newTree = (await treeRes.json()) as { sha: string }

  const newCommitRes = await fetch(`${base}/git/commits`, {
    method: 'POST',
    headers: headers(config, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ message, tree: newTree.sha, parents: [parentSha] }),
  })
  if (!newCommitRes.ok) await fail(newCommitRes)
  const newCommit = (await newCommitRes.json()) as { sha: string; html_url: string }

  const updateRes = await fetch(`${base}/git/refs/heads/${encodeURIComponent(config.branch)}`, {
    method: 'PATCH',
    headers: headers(config, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ sha: newCommit.sha }),
  })
  if (!updateRes.ok) await fail(updateRes)

  return { commitSha: newCommit.sha, htmlUrl: newCommit.html_url }
}

// --- encoding helpers ------------------------------------------------------

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

export function base64ToUtf8(base64: string): string {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}
