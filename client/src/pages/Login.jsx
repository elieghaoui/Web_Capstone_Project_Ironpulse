import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PageTransition from '../components/PageTransition.jsx';
import { ErrorMessage, Notice } from '../components/Status.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

function validate(form) {
  const errors = {};
  if (!form.email.trim()) errors.email = 'Enter your email';
  if (!form.password) errors.password = 'Enter your password';
  return errors;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    setServerError('');
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      const user = await login(form.email, form.password);
      const home = user.role === 'admin' ? '/admin' : '/dashboard';
      navigate(location.state?.from || home, { replace: true });
    } catch (err) {
      setServerError(err.message); // "Invalid email or password"
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageTransition>
      <section className="section auth">
        <form className="auth-card" onSubmit={handleSubmit} noValidate>
          <h1>Welcome back</h1>
          {/* Sent here from Book / Choose plan while logged out */}
          {location.state?.from && <Notice type="success">Log in or create an account to continue.</Notice>}
          <label>
            Email
            <input name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} aria-invalid={!!errors.email} />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </label>
          <label>
            Password
            <input name="password" type="password" autoComplete="current-password" value={form.password} onChange={handleChange} aria-invalid={!!errors.password} />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </label>
          {serverError && <ErrorMessage message={serverError} />}
          <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
            {busy ? 'Logging in…' : 'Log in'}
          </button>
          <p className="muted">
            New here? <Link to="/signup" state={location.state}>Create an account</Link>
          </p>
        </form>
      </section>
    </PageTransition>
  );
}
