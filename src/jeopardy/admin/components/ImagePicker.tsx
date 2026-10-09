type Props = {
  label: string
  value?: string
  previewSrc?: string
  busy?: boolean
  onPick: (file: File) => void
  onClear: () => void
}

export function ImagePicker({ label, value, previewSrc, busy, onPick, onClear }: Props) {
  return (
    <div className="admin-img">
      <span className="admin-label">{label}</span>
      <div className="admin-img__row">
        <input
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) onPick(file)
          }}
        />
        {value && (
          <button type="button" className="jbtn jbtn--sm jbtn--quiet" onClick={onClear}>
            Remove
          </button>
        )}
      </div>
      {busy && <span className="admin-hint">Compressing&hellip;</span>}
      {value && previewSrc && <img className="admin-img__preview" src={previewSrc} alt="" />}
      {value && <code className="admin-img__path">{value}</code>}
    </div>
  )
}
