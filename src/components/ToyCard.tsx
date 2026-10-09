import { Link } from 'react-router-dom'
import { Tessellation, type TessVariant } from './Tessellation'

type Props = {
  title: string
  tagline: string
  badge: string
  variant: TessVariant
  playable?: boolean
  /** When set, the playable card navigates to this route. */
  to?: string
  onOpen?: () => void
}

export function ToyCard({ title, tagline, badge, variant, playable, to, onOpen }: Props) {
  const inner = (
    <>
      <div className="toy-card__art">
        <Tessellation variant={variant} R={34} />
        <span className={`toy-card__badge${playable ? ' is-live' : ''}`}>{badge}</span>
      </div>
      <div className="toy-card__body">
        <h3 className="toy-card__title">{title}</h3>
        <p className="toy-card__tagline">{tagline}</p>
        {playable && <span className="toy-card__cta">Open toy &rarr;</span>}
      </div>
    </>
  )

  if (playable && to) {
    return (
      <Link to={to} className="toy-card is-playable">
        {inner}
      </Link>
    )
  }

  if (playable) {
    return (
      <button type="button" className="toy-card is-playable" onClick={onOpen}>
        {inner}
      </button>
    )
  }

  return (
    <article className="toy-card is-soon" aria-disabled="true">
      {inner}
    </article>
  )
}
