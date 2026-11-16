import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageTransition from '../components/PageTransition.jsx';
import ClassRow from '../components/ClassRow.jsx';
import { Loader, ErrorMessage } from '../components/Status.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { apiFetch } from '../api/client.js';
import { groupByDay } from '../utils.js';

const categories = ['All', 'HIIT', 'Cycling', 'Yoga', 'Pilates', 'Boxing', 'Strength', 'Mobility'];

export default function Classes() {
  const [category, setCategory] = useState('All');
  const path = category === 'All' ? '/api/classes' : `/api/classes?category=${encodeURIComponent(category)}`;
  const { data: classes, error, loading, reload } = useApi(path);

  const { user } = useAuth();
  // My bookings, only when logged in, so booked classes show "Booked ✓".
  const { data: myBookings, reload: reloadMine } = useApi(user ? '/api/bookings' : null);
  const bookedIds = new Set((myBookings ?? []).filter((b) => b.type === 'class').map((b) => b.classId?._id));

  const navigate = useNavigate();
  const location = useLocation();
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState(null); // { classId, type, text }

  async function bookClass(classId) {
    if (!user) return navigate('/login', { state: { from: location.pathname } });

    setBusyId(classId);
    setNotice(null);
    try {
      await apiFetch('/api/bookings', { method: 'POST', body: JSON.stringify({ type: 'class', classId }) });
      setNotice({ classId, type: 'success', text: 'Booked! You can see it on My Dashboard.' });
      reload(); // spots left changes
      reloadMine(); // shows "Booked ✓"
    } catch (err) {
      setNotice({ classId, type: 'error', text: err.message }); // e.g. "This class is full"
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PageTransition>
      <section className="section">
        <h1 className="page-title">Class schedule</h1>

        <div className="chips" role="group" aria-label="Filter by class type">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={c === category ? 'chip active' : 'chip'}
              onClick={() => setCategory(c)}
              aria-pressed={c === category}
            >
              {c}
            </button>
          ))}
        </div>

        {loading && !classes && <Loader label="Loading classes" />}
        {error && <ErrorMessage message={error.message} />}
        {classes && classes.length === 0 && <p className="lead">No upcoming classes for this type.</p>}

        {classes &&
          groupByDay(classes, (c) => c.startsAt).map(([day, list], i) => (
            <div key={`${category}-${day}`} className="day-group slide-in" style={{ animationDelay: `${i * 80}ms` }}>
              <h2 className="day-title">{day}</h2>
              {list.map((c) => (
                <ClassRow
                  key={c._id}
                  gymClass={c}
                  booked={bookedIds.has(c._id)}
                  busy={busyId === c._id}
                  notice={notice?.classId === c._id ? notice : null}
                  onBook={bookClass}
                />
              ))}
            </div>
          ))}
      </section>
    </PageTransition>
  );
}
