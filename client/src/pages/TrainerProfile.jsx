import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition.jsx';
import { Loader, ErrorMessage } from '../components/Status.jsx';
import { useApi } from '../hooks/useApi.js';
import { initials } from '../utils.js';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TrainerProfile() {
  const { id } = useParams();
  const { data: trainer, error, loading } = useApi(`/api/trainers/${id}`);

  return (
    <PageTransition>
      <section className="section narrow">
        <Link to="/trainers" className="back-link">← All coaches</Link>
        {loading && <Loader label="Loading profile" />}
        {error && <ErrorMessage message={error.message} />}

        {trainer && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
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

            <h2>Available for PT</h2>
            <ul className="availability">
              {trainer.weeklyAvailability.map((slot) => (
                <li key={`${slot.day}-${slot.start}`}>
                  <strong>{dayNames[slot.day]}</strong> {slot.start}–{slot.end}
                </li>
              ))}
            </ul>
            {/* Milestone 3: pick a 1-hour slot and POST /api/bookings with type "pt" */}
            <button type="button" className="btn btn-primary" disabled>
              Book a session
            </button>
          </motion.div>
        )}
      </section>
    </PageTransition>
  );
}
