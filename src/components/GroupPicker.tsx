type Props = {
  groups: string[]
  selected: string
  onSelect: (group: string) => void
}

export function GroupPicker({ groups, selected, onSelect }: Props) {
  return (
    <div className="group-picker-block">
      <p className="group-picker__label" id="group-picker-label">
        Groups
      </p>
      <div
        className="group-picker"
        role="tablist"
        aria-labelledby="group-picker-label"
      >
        {groups.map((g) => (
          <button
            key={g}
            type="button"
            role="tab"
            aria-selected={selected === g}
            aria-label={`Group ${g}`}
            title={`Group ${g}`}
            className={`group-tab${selected === g ? ' group-tab--active' : ''}`}
            onClick={() => onSelect(g)}
          >
            <span className="group-tab__letter" aria-hidden="true">
              {g}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
