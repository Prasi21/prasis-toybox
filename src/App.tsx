import { useState } from 'react'
import { Tessellation, type TessVariant } from './components/Tessellation'
import { ToyCard } from './components/ToyCard'
import { ToyStage } from './components/ToyStage'
import TicTacToe from './games/TicTacToe'

type Toy = {
  id: string
  title: string
  tagline: string
  badge: string
  variant: TessVariant
  playable?: boolean
}

const TOYS: Toy[] = [
  {
    id: 'tic-tac-toe',
    title: 'Tic-Tac-Toe',
    tagline: 'Three in a row takes the crown. Pass and play with a friend.',
    badge: 'Play',
    variant: 'orange',
    playable: true,
  },
  {
    id: 'soon-2',
    title: 'Coming Soon',
    tagline: 'A new toy is being bolted together. Check back shortly.',
    badge: 'Soon',
    variant: 'indigo',
  },
  {
    id: 'soon-3',
    title: 'Coming Soon',
    tagline: 'Still on the workbench — gears and all.',
    badge: 'Soon',
    variant: 'navy',
  },
  {
    id: 'soon-4',
    title: 'Coming Soon',
    tagline: 'Something with patterns, probably.',
    badge: 'Soon',
    variant: 'cream',
  },
  {
    id: 'soon-5',
    title: 'Coming Soon',
    tagline: 'Reserved slot. The builders are on it.',
    badge: 'Soon',
    variant: 'mixed',
  },
  {
    id: 'soon-6',
    title: 'Coming Soon',
    tagline: 'A mystery toy waiting for its turn.',
    badge: 'Soon',
    variant: 'orange',
  },
]

function CubeMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <polygon points="32,8 57,22 32,36 7,22" fill="#F2A15C" />
      <polygon points="7,22 32,36 32,62 7,48" fill="#E8782E" />
      <polygon points="57,22 57,48 32,62 32,36" fill="#4A44A5" />
    </svg>
  )
}

export default function App() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const active = TOYS.find((toy) => toy.id === activeId && toy.playable)

  const readyCount = TOYS.filter((toy) => toy.playable).length
  const soonCount = TOYS.length - readyCount

  return (
    <div className="page">
      <div className="page__bg" aria-hidden="true">
        <Tessellation variant="mixed" R={56} />
      </div>

      <header className="hero">
        <div className="hero__inner">
          <span className="hero__eyebrow">
            <CubeMark className="hero__cube" />a personal arcade
          </span>
          <h1 className="hero__title">
            Prasi&apos;s <span className="hero__title-accent">Toybox</span>
          </h1>
          <p className="hero__tagline">
            Gizmos, gadgets and fun little something-or-others that I&apos;ve thought of!
          </p>
        </div>
      </header>

      <main className="content">
        <div className="content__head">
          <h2 className="content__title">The Toys</h2>
          <span className="content__count">
            {readyCount} ready &middot; {soonCount} coming soon
          </span>
        </div>

        <div className="toy-grid">
          {TOYS.map((toy) => (
            <ToyCard
              key={toy.id}
              title={toy.title}
              tagline={toy.tagline}
              badge={toy.badge}
              variant={toy.variant}
              playable={toy.playable}
              onOpen={() => setActiveId(toy.id)}
            />
          ))}
        </div>
      </main>

      <footer className="footer">
        <CubeMark className="footer__cube" />
        <p>
          Prasi&apos;s Toybox &middot; built with React + Vite &middot; {new Date().getFullYear()}
        </p>
      </footer>

      {active && (
        <ToyStage title={active.title} onClose={() => setActiveId(null)}>
          {active.id === 'tic-tac-toe' && <TicTacToe />}
        </ToyStage>
      )}
    </div>
  )
}
