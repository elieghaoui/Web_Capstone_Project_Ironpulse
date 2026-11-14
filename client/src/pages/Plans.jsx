import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition.jsx';
import { Loader, ErrorMessage } from '../components/Status.jsx';
import { useApi } from '../hooks/useApi.js';

function describeCount(n, word) {
  if (n === null || n === undefined) return `Unlimited ${word}`;
  if (n === 0) return `No ${word}`;
  return `${n} ${word} / month`;
}

export default function Plans() {
  const { data: plans, error, loading } = useApi('/api/plans');

  return (
    <PageTransition>
      <section className="section">
        <h1 className="page-title">Membership plans</h1>
        <p className="lead">Every plan includes everything in the plans before it.</p>

        {loading && <Loader label="Loading plans" />}
        {error && <ErrorMessage message={error.message} />}

        {plans && (
          <div className="plans-grid">
            {plans.map((plan, i) => (
              <motion.article
                key={plan._id}
                className={plan.name === 'Elite' ? 'plan-card featured' : 'plan-card'}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                {plan.name === 'Elite' && <span className="badge">Most popular</span>}
                <h2>{plan.name}</h2>
                <p className="price">
                  ${plan.priceMonthly}<span>/month</span>
                </p>
                <ul>
                  <li>{describeCount(plan.classesPerMonth, 'group classes')}</li>
                  <li>{describeCount(plan.ptSessionsPerMonth, 'PT sessions')}</li>
                  {plan.perks.map((perk) => (
                    <li key={perk}>{perk}</li>
                  ))}
                </ul>
                {/* Milestone 3: POST /api/me/plan */}
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled
                  title="Coming soon"
                  aria-label={`Choose the ${plan.name} plan`}
                >
                  Choose plan
                </button>
              </motion.article>
            ))}
          </div>
        )}
      </section>
    </PageTransition>
  );
}
