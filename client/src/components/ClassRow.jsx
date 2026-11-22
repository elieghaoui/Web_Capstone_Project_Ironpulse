import { Link } from 'react-router-dom';
import { Notice } from './Status.jsx';
import { formatTime } from '../utils.js';

// One class in the schedule, with its Book button.
export default function ClassRow({ gymClass, booked, busy, notice, onBook }) {
  const full = gymClass.spotsLeft <= 0;
  const fill = (gymClass.capacity - gymClass.spotsLeft) / gymClass.capacity; // 0 to 1

  return (
    <article className="class-row">
      <div className="class-time">{formatTime(gymClass.startsAt)}</div>
      <div className="class-info">
        <h3>{gymClass.title}</h3>
        <p className="muted">
          {gymClass.durationMin} min · {gymClass.room} · with {gymClass.trainerId?.name ?? 'TBA'}
        </p>
        {/* scaleX instead of width: lecture 6, animate transform only */}
        <div className="spots-bar" aria-hidden="true">
          <span style={{ '--fill': fill }} />
        </div>
        {notice && (
          <Notice type={notice.type}>
            {notice.text} {notice.planLink && <Link to="/plans">See plans</Link>}
          </Notice>
        )}
      </div>
      <div className="class-action">
        <span className={full ? 'spots full' : 'spots'}>{full ? 'Full' : `${gymClass.spotsLeft} spots left`}</span>
        {booked ? (
          <span className="booked">Booked ✓</span>
        ) : (
          <button type="button" className="btn btn-primary" disabled={full || busy} onClick={() => onBook(gymClass._id)}>
            {busy ? 'Booking…' : 'Book'}
          </button>
        )}
      </div>
    </article>
  );
}
