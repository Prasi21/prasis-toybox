import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { AdminContext, clearConfig, loadConfig, persistConfig, type AdminConfig } from '../auth'
import { Tessellation } from '../../../components/Tessellation'
import AdminGate from './AdminGate'

export default function AdminLayout() {
  const [config, setConfig] = useState<AdminConfig | null>(() => loadConfig())

  if (!config) {
    return (
      <AdminGate
        onConnected={(next) => {
          persistConfig(next)
          setConfig(next)
        }}
      />
    )
  }

  return (
    <AdminContext.Provider value={config}>
      <div className="admin-page">
        <div className="admin-page__bg" aria-hidden="true">
          <Tessellation variant="navy" R={56} />
        </div>

        <header className="admin-bar">
          <Link to="/jeopardy" className="jbar__back">
            <span aria-hidden="true">&larr;</span> Boards
          </Link>
          <span className="admin-bar__title">
            Board editor &middot; {config.owner}/{config.repo}
          </span>
          <div className="admin-bar__actions">
            <Link to="/" className="jbtn jbtn--ghost jbtn--sm">
              Toybox
            </Link>
            <button
              type="button"
              className="jbtn jbtn--ghost jbtn--sm"
              onClick={() => {
                clearConfig()
                setConfig(null)
              }}
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </AdminContext.Provider>
  )
}
