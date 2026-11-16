import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition.jsx';
import Reveal from '../components/Reveal.jsx';
import BookingCard from '../components/BookingCard.jsx';
import { Loader, ErrorMessage } from '../components/Status.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { apiFetch } from '../api/client.js';
import { formatDate } from '../utils.js';

// "3 of 12 used", with a small bar. limit null = unlimited, 0 = not included.
function Usage({ label, used, limit }) {
  if (limit === 0) {
    return (
      <div className="usage-row">
        <span>{label}</span>
        <span className="muted">Not included</span>
      </div>
    );
  }
  const unlimited = limit === null || limit === undefined;
  return (
    <div className="usage-row">
      <span>{label}</span>
      <span>{unlimited ? `${used} used · unlimited` : `${used} of ${limit} used`}</span>
      {!unlimited && (
        <div className="spots-bar" aria-hidden="true">
          <span style={{ '--fill': Math.min(used / limit, 1) }} />
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: planInfo, reload: reloadPlan } = useApi('/api/me/plan');
  const { data: bookings, error, loading, reload: reloadBookings } = useApi('/api/bookings');
  const firstName = user.name.split(' ')[0];

  async function saveNote(id, note) {
    await apiFetch(`/api/bookings/${id}`, { method: 'PATCH', body: JSON.stringify({ note }) });
    reloadBookings();
  }

  async function cancelBooking(id) {
    await apiFetch(`/api/bookings/${id}`, { method: 'DELETE' }); // 204, no body
    reloadBookings();
    reloadPlan(); // the credit comes back
  }

  const plan = planInfo?.plan;

  return (
    <PageTransition>
      <section className="section">
        <h1 className="page-title">Hey {firstName}, ready to train?</h1>

        <div className="dashboard-grid">
          <Reveal className="card">
            <h2>My plan</h2>
            {!planInfo && <Loader label="Loading plan" />}
            {planInfo && !plan && (
              <>
                <p className="muted">You haven't picked a plan yet.</p>
                <Link to="/plans" className="btn btn-primary">Choose a plan</Link>
              </>
            )}
            {plan && (
              <>
                <p className="price">{plan.name}</p>
                <div className="usage">
                  <Usage label="Group classes" used={planInfo.classesUsed} limit={plan.classesPerMonth} />
                  <Usage label="PT sessions" used={planInfo.ptUsed} limit={plan.ptSessionsPerMonth} />
                </div>
                <p className="muted small">Renews on {formatDate(planInfo.cycleEnd)}</p>
                <Link to="/plans" className="btn btn-ghost">Change plan</Link>
              </>
            )}
          </Reveal>

          <Reveal className="card" delay={100}>
            <h2>My upcoming bookings</h2>
            {loading && !bookings && <Loader label="Loading bookings" />}
            {error && <ErrorMessage message={error.message} />}
            {bookings && bookings.length === 0 && (
              <>
                <p className="muted">No bookings yet.</p>
                <div className="booking-actions">
                  <Link to="/classes" className="btn btn-ghost">Browse classes</Link>
                  <Link to="/trainers" className="btn btn-ghost">Find a coach</Link>
                </div>
              </>
            )}
            {bookings && bookings.length > 0 && (
              <div className="booking-list">
                {bookings.map((b) => (
                  <BookingCard key={b._id} booking={b} onSaveNote={saveNote} onCancel={cancelBooking} />
                ))}
              </div>
            )}
          </Reveal>
        </div>
      </section>
    </PageTransition>
  );
}
