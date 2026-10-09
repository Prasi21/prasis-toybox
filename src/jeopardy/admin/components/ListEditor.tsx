type Props = {
  label: string
  items: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  addLabel?: string
}

/** Editable list of short text lines (rules, reveal steps). */
export function ListEditor({ label, items, onChange, placeholder, addLabel = 'Add line' }: Props) {
  const update = (index: number, value: string) => {
    const next = items.slice()
    next[index] = value
    onChange(next)
  }
  return (
    <div className="admin-list">
      <span className="admin-label">{label}</span>
      {items.map((item, index) => (
        <div className="admin-list__row" key={index}>
          <input
            value={item}
            placeholder={placeholder}
            onChange={(event) => update(index, event.target.value)}
          />
          <button
            type="button"
            className="jbtn jbtn--sm jbtn--quiet"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
            aria-label="Remove line"
          >
            &times;
          </button>
        </div>
      ))}
      <button type="button" className="jbtn jbtn--sm jbtn--quiet" onClick={() => onChange([...items, ''])}>
        + {addLabel}
      </button>
    </div>
  )
}
