import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Tessellation } from '../../components/Tessellation'

type Props = {
  children: ReactNode
  backTo?: string
  backLabel?: string
  title?: string
  actions?: ReactNode
}

/** Shared chrome for the Jeopardy pages: tessellation backdrop + top bar. */
export function JShell({ children, backTo = '/', backLabel = 'Toybox', title, actions }: Props) {
  return (
    <div className="jpage">
      <div className="jpage__bg" aria-hidden="true">
        <Tessellation variant="indigo" R={56} />
      </div>

      <header className="jbar">
        <Link to={backTo} className="jbar__back">
          <span aria-hidden="true">&larr;</span> {backLabel}
        </Link>
        <span className="jbar__title">{title}</span>
        <div className="jbar__actions">{actions}</div>
      </header>

      <main className="jmain">{children}</main>
    </div>
  )
}
