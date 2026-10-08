import { useEffect, type ReactNode } from 'react'
import { Tessellation } from './Tessellation'

type Props = {
  title: string
  onClose: () => void
  children: ReactNode
}

/**
 * Full-screen "focus view" that takes over when a toy is opened. The toybox
 * grid stays behind it; pressing Escape or the back button returns to it.
 */
export function ToyStage({ title, onClose, children }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  return (
    <div className="stage" role="dialog" aria-modal="true" aria-label={title}>
      <div className="stage__bg" aria-hidden="true">
        <Tessellation variant="mixed" R={64} />
      </div>

      <header className="stage__bar">
        <button type="button" className="stage__back" onClick={onClose}>
          <span aria-hidden="true">&larr;</span> Toybox
        </button>
        <h2 className="stage__title">{title}</h2>
        <button type="button" className="stage__close" aria-label="Close" onClick={onClose}>
          &times;
        </button>
      </header>

      <div className="stage__body">
        <div className="stage__panel">{children}</div>
      </div>
    </div>
  )
}
