import type { Card } from '../../types'
import { AudioPicker } from './AudioPicker'
import { ImagePicker } from './ImagePicker'

type Props = {
  cards: Card[]
  onChange: (next: Card[]) => void
  resolve: (path?: string) => string | undefined
  onPickImage: (file: File, apply: (path: string) => void) => void
  onPickAudio: (file: File, apply: (path: string) => void) => void
}

export function CardsEditor({ cards, onChange, resolve, onPickImage, onPickAudio }: Props) {
  const update = (index: number, patch: Partial<Card>) =>
    onChange(cards.map((card, i) => (i === index ? { ...card, ...patch } : card)))

  const move = (index: number, dir: number) => {
    const target = index + dir
    if (target < 0 || target >= cards.length) return
    const next = cards.slice()
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    onChange(next)
  }

  const setLink = (index: number, patch: Partial<{ label: string; href: string }>) => {
    const card = cards[index]
    const link = { label: card.link?.label ?? '', href: card.link?.href ?? '', ...patch }
    update(index, { link: link.label.trim() || link.href.trim() ? link : undefined })
  }

  return (
    <div className="admin-cards">
      <span className="admin-label">Cards / mini-game steps ({cards.length})</span>

      {cards.map((card, index) => {
        const random = card.random
        return (
          <div className="admin-card-item" key={index}>
            <div className="admin-card-item__head">
              <span className="admin-card-item__num">Card {index + 1}</span>
              <div className="admin-card-item__ctrl">
                <button
                  type="button"
                  className="jbtn jbtn--sm jbtn--quiet"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Move card up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="jbtn jbtn--sm jbtn--quiet"
                  onClick={() => move(index, 1)}
                  disabled={index === cards.length - 1}
                  aria-label="Move card down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="jbtn jbtn--sm jbtn--quiet"
                  onClick={() => onChange(cards.filter((_, i) => i !== index))}
                >
                  Remove
                </button>
              </div>
            </div>

            <label className="admin-field">
              <span className="admin-label">Title (optional)</span>
              <input
                value={card.title ?? ''}
                placeholder="Rules / Outcome / Ready…"
                onChange={(event) => update(index, { title: event.target.value })}
              />
            </label>

            <label className="admin-field">
              <span className="admin-label">Text</span>
              <textarea
                rows={2}
                value={card.text ?? ''}
                placeholder="What the host reads / shows on this card"
                onChange={(event) => update(index, { text: event.target.value })}
              />
            </label>

            <div className="admin-clue__images">
              <ImagePicker
                label="Image"
                value={card.image}
                previewSrc={resolve(card.image)}
                onPick={(file) => onPickImage(file, (path) => update(index, { image: path }))}
                onClear={() => update(index, { image: undefined })}
              />
              <AudioPicker
                label="Audio"
                value={card.audio}
                previewSrc={resolve(card.audio)}
                onPick={(file) => onPickAudio(file, (path) => update(index, { audio: path }))}
                onClear={() => update(index, { audio: undefined })}
              />
            </div>

            <div className="admin-card-item__row">
              <label className="admin-field">
                <span className="admin-label">Link label</span>
                <input
                  value={card.link?.label ?? ''}
                  placeholder="Open the game"
                  onChange={(event) => setLink(index, { label: event.target.value })}
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">Link URL</span>
                <input
                  value={card.link?.href ?? ''}
                  placeholder="https://…"
                  onChange={(event) => setLink(index, { href: event.target.value })}
                />
              </label>
              <label className="admin-field admin-field--timer">
                <span className="admin-label">Timer (s)</span>
                <input
                  type="number"
                  min={0}
                  value={card.timerSeconds ?? ''}
                  placeholder="0"
                  onChange={(event) =>
                    update(index, {
                      timerSeconds: event.target.value ? Number(event.target.value) : undefined,
                    })
                  }
                />
              </label>
            </div>

            <div className="admin-card-item__row admin-card-item__row--random">
              <label className="admin-field">
                <span className="admin-label">Random</span>
                <select
                  value={random?.type ?? 'none'}
                  onChange={(event) => {
                    const value = event.target.value
                    if (value === 'number') update(index, { random: { type: 'number', min: 1, max: 6 } })
                    else if (value === 'letter') update(index, { random: { type: 'letter' } })
                    else update(index, { random: undefined })
                  }}
                >
                  <option value="none">None</option>
                  <option value="number">Number range</option>
                  <option value="letter">Random letter</option>
                </select>
              </label>
              {random?.type === 'number' && (
                <>
                  <label className="admin-field">
                    <span className="admin-label">Min</span>
                    <input
                      type="number"
                      value={random.min}
                      onChange={(event) =>
                        update(index, {
                          random: { type: 'number', min: Number(event.target.value), max: random.max },
                        })
                      }
                    />
                  </label>
                  <label className="admin-field">
                    <span className="admin-label">Max</span>
                    <input
                      type="number"
                      value={random.max}
                      onChange={(event) =>
                        update(index, {
                          random: { type: 'number', min: random.min, max: Number(event.target.value) },
                        })
                      }
                    />
                  </label>
                </>
              )}
            </div>
          </div>
        )
      })}

      <button
        type="button"
        className="jbtn jbtn--sm jbtn--quiet"
        onClick={() => onChange([...cards, { text: '' }])}
      >
        + Add card
      </button>
    </div>
  )
}
