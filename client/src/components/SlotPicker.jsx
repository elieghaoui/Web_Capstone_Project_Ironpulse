import { formatTime, groupByDay } from '../utils.js';

// Free 1-hour PT start times, grouped by day. `slots` are ISO strings from the API.
export default function SlotPicker({ slots, selected, onSelect }) {
  if (slots.length === 0) {
    return <p className="muted">No free slots in the next two weeks.</p>;
  }
  return (
    <div className="slot-days">
      {groupByDay(slots, (slot) => slot).map(([day, list]) => (
        <div key={day} className="slot-day">
          <h3>{day}</h3>
          <div className="slot-list" role="group" aria-label={`Free times on ${day}`}>
            {list.map((slot) => (
              <button
                key={slot}
                type="button"
                className={slot === selected ? 'chip active' : 'chip'}
                aria-pressed={slot === selected}
                onClick={() => onSelect(slot)}
              >
                {formatTime(slot)}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
