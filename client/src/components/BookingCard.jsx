import { useState } from 'react';
import { Notice } from './Status.jsx';
import { formatDay, formatTime } from '../utils.js';

const CANCEL_LIMIT_HOURS = 12; // same rule as the server

// One of my bookings on the dashboard: view it, change its note, cancel it.
export default function BookingCard({ booking, onSaveNote, onCancel }) {
  const isClass = booking.type === 'class';
  const title = isClass ? booking.classId?.title ?? 'Class' : 'Personal training';
  const coach = isClass ? booking.classId?.trainerId?.name : booking.trainerId?.name;
  const hoursLeft = (new Date(booking.startsAt).getTime() - Date.now()) / (60 * 60 * 1000);
  const canCancel = hoursLeft >= CANCEL_LIMIT_HOURS;

  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(booking.note ?? '');
  const [noteError, setNoteError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  async function handleSave(e) {
    e.preventDefault();
    if (note.length > 300) {
      setNoteError('Keep the note under 300 characters'); // checked again by the server
      return;
    }
    setNoteError('');
    setBusy(true);
    setNotice(null);
    try {
      await onSaveNote(booking._id, note.trim());
      setEditing(false);
      setNotice({ type: 'success', text: 'Note saved' });
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    setBusy(true);
    setNotice(null);
    try {
      await onCancel(booking._id); // the page reloads the list, so this card disappears
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <article className="booking-card">
      <div className="booking-head">
        <h3>{title}</h3>
        <span className="tag">{isClass ? 'Class' : 'PT'}</span>
      </div>
      <p className="muted">
        {formatDay(booking.startsAt)} · {formatTime(booking.startsAt)}
        {coach && ` · with ${coach}`}
      </p>

      {editing ? (
        <form className="note-form" onSubmit={handleSave} noValidate>
          <label className="field">
            Note
            <textarea
              name="note"
              rows="2"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              aria-invalid={!!noteError}
            />
            {noteError && <span className="field-error">{noteError}</span>}
          </label>
          <div className="booking-actions">
            <button type="submit" className="btn btn-primary btn-small" disabled={busy}>
              {busy ? 'Saving…' : 'Save note'}
            </button>
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setEditing(false)}>
              Close
            </button>
          </div>
        </form>
      ) : (
        booking.note && <p className="booking-note">“{booking.note}”</p>
      )}

      {!editing && (
        <div className="booking-actions">
          <button type="button" className="btn btn-ghost btn-small" onClick={() => setEditing(true)}>
            {booking.note ? 'Edit note' : 'Add note'}
          </button>
          {!canCancel && <span className="muted small">Can't cancel less than {CANCEL_LIMIT_HOURS} hours before</span>}
          {canCancel && !confirming && (
            <button type="button" className="btn btn-danger btn-small" onClick={() => setConfirming(true)}>
              Cancel booking
            </button>
          )}
          {canCancel && confirming && (
            <>
              <span className="small">Cancel this booking?</span>
              <button type="button" className="btn btn-danger btn-small" disabled={busy} onClick={handleCancel}>
                {busy ? 'Cancelling…' : 'Yes, cancel'}
              </button>
              <button type="button" className="btn btn-ghost btn-small" onClick={() => setConfirming(false)}>
                Keep it
              </button>
            </>
          )}
        </div>
      )}
      {notice && <Notice type={notice.type}>{notice.text}</Notice>}
    </article>
  );
}
