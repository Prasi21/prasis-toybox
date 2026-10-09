import { useRef, useState } from 'react'
import { detectRepo, type AdminConfig } from '../auth'
import { testConnection } from '../github'

type Props = {
  onConnected: (config: AdminConfig) => void
}

export default function AdminGate({ onConnected }: Props) {
  const detected = useRef(detectRepo())
  const [token, setToken] = useState('')
  const [owner, setOwner] = useState(detected.current.owner)
  const [repo, setRepo] = useState(detected.current.repo)
  const [branch, setBranch] = useState(detected.current.branch || 'main')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function connect(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const config: AdminConfig = {
        token: token.trim(),
        owner: owner.trim(),
        repo: repo.trim(),
        branch: branch.trim() || 'main',
      }
      if (!config.token || !config.owner || !config.repo) {
        throw new Error('Token, owner and repo are all required.')
      }
      await testConnection(config)
      onConnected(config)
    } catch (err) {
      setError(String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-gate">
      <form className="admin-gate__card" onSubmit={connect}>
        <h1>Board editor</h1>
        <p className="admin-gate__lead">
          Connect to the GitHub repo that hosts this site. You&apos;ll need a{' '}
          <strong>fine-grained personal access token</strong> scoped to this repository with{' '}
          <strong>Contents: Read and write</strong>. It&apos;s stored only in this browser and sent
          only to <code>api.github.com</code>.
        </p>

        <label className="admin-field">
          <span className="admin-label">Access token</span>
          <input
            type="password"
            autoComplete="off"
            value={token}
            placeholder="github_pat_..."
            onChange={(event) => setToken(event.target.value)}
          />
        </label>

        <div className="admin-field-row">
          <label className="admin-field">
            <span className="admin-label">Owner</span>
            <input value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="username" />
          </label>
          <label className="admin-field">
            <span className="admin-label">Repo</span>
            <input value={repo} onChange={(event) => setRepo(event.target.value)} placeholder="prasis-toybox" />
          </label>
          <label className="admin-field admin-field--branch">
            <span className="admin-label">Branch</span>
            <input value={branch} onChange={(event) => setBranch(event.target.value)} placeholder="main" />
          </label>
        </div>

        {error && <p className="admin-error">{error}</p>}

        <button type="submit" className="jbtn jbtn--primary" disabled={busy}>
          {busy ? 'Connecting…' : 'Connect'}
        </button>

        <p className="admin-gate__hint">
          Create one at GitHub → Settings → Developer settings → Personal access tokens →
          Fine-grained tokens. Revoke it any time to cut off access.
        </p>
      </form>
    </div>
  )
}
