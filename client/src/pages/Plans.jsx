import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageTransition from '../components/PageTransition.jsx';
import PlanCard from '../components/PlanCard.jsx';
import { Loader, ErrorMessage } from '../components/Status.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { apiFetch } from '../api/client.js';

export default function Plans() {
  const { data: plans, error, loading } = useApi('/api/plans');
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState(null); // { planId, type, text }

  async function choosePlan(plan) {
    // Not logged in: go to the login page, then come back here.
    if (!user) return navigate('/login', { state: { from: location.pathname } });

    setBusyId(plan._id);
    setNotice(null);
    try {
      await apiFetch('/api/me/plan', { method: 'PUT', body: JSON.stringify({ planId: plan._id }) });
      await refreshUser(); // the navbar, dashboard and this page now know the new plan
      setNotice({ planId: plan._id, type: 'success', text: `You're on ${plan.name} now. Your 30-day period starts today.` });
    } catch (err) {
      setNotice({ planId: plan._id, type: 'error', text: err.message });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PageTransition>
      <section className="section">
        <h1 className="page-title">Membership plans</h1>
        <p className="lead">
          Every plan includes everything in the plans before it. Choosing or switching a plan starts a new 30-day period.
        </p>

        {loading && !plans && <Loader label="Loading plans" />}
        {error && <ErrorMessage message={error.message} />}

        {plans && (
          <div className="plans-grid">
            {plans.map((plan, i) => (
              <PlanCard
                key={plan._id}
                plan={plan}
                delay={i * 100}
                isCurrent={user?.planId?._id === plan._id}
                busy={busyId === plan._id}
                notice={notice?.planId === plan._id ? notice : null}
                onChoose={choosePlan}
              />
            ))}
          </div>
        )}
      </section>
    </PageTransition>
  );
}
