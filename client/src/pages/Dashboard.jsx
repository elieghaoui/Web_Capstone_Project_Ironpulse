import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition.jsx';
import Reveal from '../components/Reveal.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user.name.split(' ')[0];

  return (
    <PageTransition>
      <section className="section">
        <h1 className="page-title">Hey {firstName}, ready to train?</h1>
        <div className="grid-3">
          <Reveal className="card">
            <h2>My plan</h2>
            {user.planId ? (
              <p className="price">{user.planId.name}</p>
            ) : (
              <>
                <p className="muted">You haven't picked a plan yet.</p>
                <Link to="/plans" className="btn btn-primary">Choose a plan</Link>
              </>
            )}
          </Reveal>
          <Reveal className="card" delay={100}>
            <h2>Upcoming classes</h2>
            {/* Milestone 3: GET /api/bookings */}
            <p className="muted">No bookings yet.</p>
            <Link to="/classes" className="btn btn-ghost">Browse classes</Link>
          </Reveal>
          <Reveal className="card" delay={200}>
            <h2>PT sessions</h2>
            <p className="muted">No sessions booked.</p>
            <Link to="/trainers" className="btn btn-ghost">Find a coach</Link>
          </Reveal>
        </div>
      </section>
    </PageTransition>
  );
}
