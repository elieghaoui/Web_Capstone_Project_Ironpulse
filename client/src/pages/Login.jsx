import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PageTransition from '../components/PageTransition.jsx';
import { ErrorMessage } from '../components/Status.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(form.email, form.password);
      const home = user.role === 'admin' ? '/admin' : '/dashboard';
      navigate(location.state?.from || home, { replace: true });
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
          <h1>Welcome back</h1>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required value={form.email} onChange={update} />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={update}
            />
          </label>
          {error && <ErrorMessage message={error} />}
          <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
            {busy ? 'Logging in…' : 'Log in'}
          </button>
          <p className="muted">
            New here? <Link to="/signup">Create an account</Link>
          </p>
        </form>
      </section>
    </PageTransition>
  );
}
