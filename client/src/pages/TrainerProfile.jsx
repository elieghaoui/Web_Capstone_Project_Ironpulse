import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import PageTransition from '../components/PageTransition.jsx';
import SlotPicker from '../components/SlotPicker.jsx';
import { Loader, ErrorMessage, Notice } from '../components/Status.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { apiFetch } from '../api/client.js';
import { initials, formatDay, formatTime } from '../utils.js';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TrainerProfile() {
  const { id } = useParams();
  const { data: trainer, error, loading } = useApi(`/api/trainers/${id}`);
  const { data: slots, error: slotsError, reload: reloadSlots } = useApi(`/api/trainers/${id}/slots`);

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  async function bookSession(e) {
    e.preventDefault();
    if (!user) return navigate('/login', { state: { from: location.pathname } });
    if (!selected) {
      setNotice({ type: 'error', text: 'Pick a time first' });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      await apiFetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({ type: 'pt', trainerId: id, startsAt: selected, note: note.trim() }),
      });
      setNotice({
        type: 'success',
        text: `Booked ${formatDay(selected)} at ${formatTime(selected)}. See it on My Dashboard.`,
      });
      setSelected(null);
      setNote('');
      reloadSlots(); // that time is no longer free
    } catch (err) {
      setNotice({ type: 'error', text: err.message }); // e.g. plan limit reached
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageTransition>
      <section className="section narrow">
        <Link to="/trainers" className="back-link">← All coaches</Link>
        {loading && <Loader label="Loading profile" />}
        {/* A bad or old link: "Invalid id" (400) or "Trainer not found" (404) from the API */}
        {error && <ErrorMessage message={/invalid id|not found/i.test(error.message) ? 'Coach not found.' : error.message} />}

        {trainer && (
          <div className="fade-up">
            <div className="profile-head">
              <div className="avatar large">{initials(trainer.name)}</div>
              <div>
                <h1 className="page-title">{trainer.name}</h1>
                <p className="muted">
                  {trainer.specialties.join(' · ')} · {trainer.yearsExperience} years
                </p>
              </div>
            </div>
            <p className="lead">{trainer.bio}</p>

            <h2>Weekly PT hours</h2>
            <ul className="availability">
              {trainer.weeklyAvailability.map((slot) => (
                <li key={`${slot.day}-${slot.start}`}>
                  <strong>{dayNames[slot.day]}</strong> {slot.start}–{slot.end}
                </li>
              ))}
            </ul>

            <h2>Book a 1-hour session</h2>
            {slotsError && !error && <ErrorMessage message={slotsError.message} />}
            {!slots && !slotsError && <Loader label="Loading free times" />}
            {slots && (
              <form className="pt-form" onSubmit={bookSession} noValidate>
                <SlotPicker slots={slots} selected={selected} onSelect={setSelected} />
                <label className="field">
                  Note for {trainer.name.split(' ')[0]} (optional)
                  <input
                    name="note"
                    value={note}
                    maxLength={300}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. knee injury, go easy"
                  />
                </label>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? 'Booking…' : selected ? `Book ${formatDay(selected)} ${formatTime(selected)}` : 'Book a session'}
                </button>
                {notice && <Notice type={notice.type}>{notice.text}</Notice>}
              </form>
            )}
          </div>
        )}
      </section>
    </PageTransition>
  );
}
