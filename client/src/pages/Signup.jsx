import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageTransition from '../components/PageTransition.jsx';
import { ErrorMessage } from '../components/Status.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    // Quick checks for a nicer experience; the server checks again.
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');

    setBusy(true);
    try {
      await signup(form.name, form.email, form.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageTransition>
      <section className="section auth">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h1>Join IRONPULSE</h1>
          <label>
            Full name
            <input name="name" autoComplete="name" required value={form.name} onChange={update} />
          </label>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required value={form.email} onChange={update} />
          </label>
          <label>
            Password (8+ characters)
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={update}
            />
          </label>
          <label>
            Confirm password
            <input
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={form.confirm}
              onChange={update}
            />
          </label>
          {error && <ErrorMessage message={error} />}
          <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
            {busy ? 'Creating account…' : 'Sign up'}
          </button>
          <p className="muted">
            Already a member? <Link to="/login">Log in</Link>
          </p>
        </form>
      </section>
    </PageTransition>
  );
}
