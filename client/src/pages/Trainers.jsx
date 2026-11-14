import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition.jsx';
import { Loader, ErrorMessage } from '../components/Status.jsx';
import { useApi } from '../hooks/useApi.js';
import { initials } from '../utils.js';

export default function Trainers() {
  const { data: trainers, error, loading } = useApi('/api/trainers');

  return (
    <PageTransition>
      <section className="section">
        <h1 className="page-title">Meet the coaches</h1>
        <p className="lead">Hover a card (or tap it on your phone) to flip it.</p>

        {loading && <Loader label="Loading trainers" />}
        {error && <ErrorMessage message={error.message} />}

        {trainers && (
          <div className="trainers-grid">
            {trainers.map((t, i) => (
              <div key={t._id} className="flip-card pop-in" tabIndex={0} style={{ animationDelay: `${i * 100}ms` }}>
                <div className="flip-inner">
                  <div className="flip-front">
                    <div className="avatar">{initials(t.name)}</div>
                    <h2>{t.name}</h2>
                    <p className="muted">{t.specialties.join(' · ')}</p>
                  </div>
                  <div className="flip-back">
                    <p>{t.bio}</p>
                    <p className="muted">{t.yearsExperience} years coaching</p>
                    <Link to={`/trainers/${t._id}`} className="btn btn-primary">View profile</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </PageTransition>
  );
}
