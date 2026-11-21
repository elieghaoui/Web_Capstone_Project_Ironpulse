// One row of filter chips (same look as the class type filter).
export default function FilterGroup({ label, options, value, onChange }) {
  return (
    <div className="chips" role="group" aria-label={`Filter by ${label.toLowerCase()}`}>
      <span className="filter-label">{label}</span>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={o.value === value ? 'chip active' : 'chip'}
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
