import { useState } from 'react'
import type { CardRandom } from '../types'

/** A host-driven random generator: a number in a range, or a random letter. */
export function RandomRoller({ spec }: { spec: CardRandom }) {
  const [value, setValue] = useState<string | null>(null)

  const roll = () => {
    if (spec.type === 'number') {
      const min = Math.ceil(spec.min)
      const max = Math.floor(spec.max)
      const span = Math.max(0, max - min)
      setValue(String(min + Math.floor(Math.random() * (span + 1))))
    } else {
      setValue(String.fromCharCode(65 + Math.floor(Math.random() * 26)))
    }
  }

  return (
    <div className="jcard__random">
      <span className={`jcard__roll${value ? '' : ' is-empty'}`}>{value ?? '—'}</span>
      <button type="button" className="jbtn jbtn--primary jbtn--sm" onClick={roll}>
        {spec.type === 'number' ? `Roll ${spec.min}–${spec.max}` : 'Pick a letter'}
      </button>
      {value && (
        <button type="button" className="jbtn jbtn--sm jbtn--quiet" onClick={() => setValue(null)}>
          Clear
        </button>
      )}
    </div>
  )
}
