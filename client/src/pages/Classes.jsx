import { useState } from 'react';
import PageTransition from '../components/PageTransition.jsx';
import { Loader, ErrorMessage } from '../components/Status.jsx';
import { useApi } from '../hooks/useApi.js';

const categories = ['All', 'HIIT', 'Cycling', 'Yoga', 'Pilates', 'Boxing', 'Strength', 'Mobility'];

function formatDay(date) {
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
}

function formatTime(date) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

// Groups classes by calendar day: [["Monday 10 Nov", [...]], ...]
function groupByDay(classes) {
  const groups = new Map();
  for (const c of classes) {
    const day = formatDay(new Date(c.startsAt));
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day).push(c);
  }
  return [...groups.entries()];
}

export default function Classes() {
  const [category, setCategory] = useState('All');
  const path = category === 'All' ? '/api/classes' : `/api/classes?category=${encodeURIComponent(category)}`;
  const { data: classes, error, loading } = useApi(path);

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

        {loading && <Loader label="Loading classes" />}
        {error && <ErrorMessage message={error.message} />}
        {classes && classes.length === 0 && <p className="lead">No upcoming classes for this type.</p>}

        {classes &&
          groupByDay(classes).map(([day, list], i) => (
            <div key={`${category}-${day}`} className="day-group slide-in" style={{ animationDelay: `${i * 80}ms` }}>
              <h2 className="day-title">{day}</h2>
              {list.map((c) => {
                const start = new Date(c.startsAt);
                const full = c.spotsLeft <= 0;
                const fill = (c.capacity - c.spotsLeft) / c.capacity; // 0 to 1
                return (
                  <article key={c._id} className="class-row">
                    <div className="class-time">{formatTime(start)}</div>
                    <div className="class-info">
                      <h3>{c.title}</h3>
                      <p className="muted">
                        {c.durationMin} min · {c.room} · with {c.trainerId?.name ?? 'TBA'}
                      </p>
                      {/* scaleX instead of width: lecture 6, animate transform only */}
                      <div className="spots-bar" aria-hidden="true">
                        <span style={{ '--fill': fill }} />
                      </div>
                    </div>
                    <div className="class-action">
                      <span className={full ? 'spots full' : 'spots'}>
                        {full ? 'Full' : `${c.spotsLeft} spots left`}
                      </span>
                      {/* Milestone 3: POST /api/bookings */}
                      <button type="button" className="btn btn-primary" disabled>
                        Book
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ))}
      </section>
    </PageTransition>
  );
}
