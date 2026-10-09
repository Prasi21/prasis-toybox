type Props = {
  label: string
  value?: string
  previewSrc?: string
  onPick: (file: File) => void
  onClear: () => void
}

export function AudioPicker({ label, value, previewSrc, onPick, onClear }: Props) {
  return (
    <div className="admin-img">
      <span className="admin-label">{label}</span>
      <div className="admin-img__row">
        <input
          type="file"
          accept="audio/*"
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
      {value && previewSrc && <audio className="admin-audio" controls src={previewSrc} />}
      {value && <code className="admin-img__path">{value}</code>}
    </div>
  )
}
