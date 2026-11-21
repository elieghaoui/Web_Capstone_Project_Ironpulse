const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// A trainer's weekly PT hours: one row per window (day, start, end).
// The list lives in the parent form's state; every change sends a new array up.
export default function HoursEditor({ hours, onChange }) {
  function update(index, field, value) {
    onChange(hours.map((slot, i) => (i === index ? { ...slot, [field]: field === 'day' ? Number(value) : value } : slot)));
  }

  return (
    <fieldset className="hours-editor">
      <legend>Weekly PT hours</legend>
      {hours.length === 0 && <p className="muted small">No hours yet: members can't book PT with this trainer.</p>}
      {hours.map((slot, i) => (
        <div key={i} className="hours-row">
          <label className="field">
            Day
            <select value={slot.day} onChange={(e) => update(i, 'day', e.target.value)}>
              {dayNames.map((name, d) => (
                <option key={name} value={d}>{name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            From
            <input type="time" step="3600" value={slot.start} onChange={(e) => update(i, 'start', e.target.value)} aria-invalid={slot.start >= slot.end} />
          </label>
          <label className="field">
            To
            <input type="time" step="3600" value={slot.end} onChange={(e) => update(i, 'end', e.target.value)} aria-invalid={slot.start >= slot.end} />
          </label>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => onChange(hours.filter((_, j) => j !== i))} aria-label={`Remove ${dayNames[slot.day]} hours`}>
            Remove
          </button>
          {slot.start >= slot.end && <span className="field-error hours-error">"To" must be after "From"</span>}
        </div>
      ))}
      <button type="button" className="btn btn-ghost btn-small" onClick={() => onChange([...hours, { day: 1, start: '09:00', end: '13:00' }])}>
        + Add hours
      </button>
    </fieldset>
  );
}
