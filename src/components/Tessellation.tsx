import { useId, type ReactNode } from 'react'

/**
 * A seamless isometric-cube tessellation, inspired by the bold geometric
 * reference pattern. Each cube is drawn as three rhombi (top / left / right)
 * so it reads as a little 3D block.
 *
 * The pattern tile spans `P` columns and 2 rows of the cube lattice. Because a
 * cube lattice repeats every column horizontally and every 2 rows vertically,
 * colour variation is keyed off (column mod P, row mod 2) so the tile always
 * stays seamless.
 */

export type TessVariant = 'orange' | 'indigo' | 'navy' | 'cream' | 'mixed'

type FaceSet = [top: string, left: string, right: string]

const FACES: Record<Exclude<TessVariant, 'mixed'>, FaceSet> = {
  orange: ['#F4A968', '#E8782E', '#AE5019'],
  indigo: ['#7C76D0', '#4A44A5', '#2B266C'],
  navy: ['#3B4A7C', '#25315A', '#111830'],
  cream: ['#FBF8F1', '#E4DBC9', '#B9AD96'],
}

// Six face sets cycled through for the "mixed" mosaic look.
const MIX: FaceSet[] = [
  ['#F4A968', '#E8782E', '#AE5019'], // orange
  ['#7C76D0', '#4A44A5', '#2B266C'], // indigo
  ['#3B4A7C', '#25315A', '#111830'], // navy
  ['#FBF8F1', '#E4DBC9', '#B9AD96'], // cream
  ['#8A85D6', '#514AAE', '#2E2978'], // violet
  ['#F2B27A', '#D96B22', '#94400F'], // ember
]

const P = 3 // column period of the tile
const SQRT3_2 = Math.sqrt(3) / 2

const mod = (n: number, m: number) => ((n % m) + m) % m

function facesFor(variant: TessVariant, i: number, j: number): FaceSet {
  if (variant !== 'mixed') return FACES[variant]
  return MIX[mod(mod(i, P) * 2 + mod(j, 2), MIX.length)]
}

type Props = {
  variant?: TessVariant
  /** Cube radius in user units. Larger = chunkier cubes. */
  R?: number
  className?: string
}

export function Tessellation({ variant = 'mixed', R = 40, className }: Props) {
  const rawId = useId()
  const patternId = `tess-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`

  const w = SQRT3_2 * R
  const tileW = 2 * w
  const tileH = 3 * R
  const patW = P * tileW
  const patH = tileH

  const cubes: ReactNode[] = []
  for (let i = -1; i <= P; i++) {
    for (let j = -1; j <= 2; j++) {
      const cx = i * tileW + j * w
      const cy = j * 1.5 * R
      const [top, left, right] = facesFor(variant, i, j)

      const pt = (x: number, y: number) => `${cx + x},${cy + y}`

      const topFace = [pt(0, 0), pt(-w, -R / 2), pt(0, -R), pt(w, -R / 2)].join(' ')
      const leftFace = [pt(0, 0), pt(-w, -R / 2), pt(-w, R / 2), pt(0, R)].join(' ')
      const rightFace = [pt(0, 0), pt(w, -R / 2), pt(w, R / 2), pt(0, R)].join(' ')

      cubes.push(
        <g key={`${i}-${j}`}>
          <polygon points={topFace} fill={top} />
          <polygon points={leftFace} fill={left} />
          <polygon points={rightFace} fill={right} />
        </g>,
      )
    }
  }

  return (
    <svg
      className={className}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id={patternId} width={patW} height={patH} patternUnits="userSpaceOnUse">
          {cubes}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  )
}
