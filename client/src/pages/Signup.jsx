import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageTransition from '../components/PageTransition.jsx';
import { ErrorMessage } from '../components/Status.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

// Client checks help the user; the server checks again (lecture 15).
function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Enter your name';
  if (!form.email.trim()) errors.email = 'Enter your email';
  else if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email';
  if (form.password.length < 8) errors.password = 'Use at least 8 characters';
  if (form.confirm !== form.password) errors.confirm = 'Passwords do not match';
  return errors;
}

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  // One handler for every field: input names match the keys in form (lecture 15).
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
      await signup(form.name, form.email, form.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.message); // e.g. "Email already registered"
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageTransition>
      <section className="section auth">
        <form className="auth-card" onSubmit={handleSubmit} noValidate>
          <h1>Join IRONPULSE</h1>
          <label>
            Full name
            <input name="name" autoComplete="name" value={form.name} onChange={handleChange} aria-invalid={!!errors.name} />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </label>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} aria-invalid={!!errors.email} />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </label>
          <label>
            Password (8+ characters)
            <input name="password" type="password" autoComplete="new-password" value={form.password} onChange={handleChange} aria-invalid={!!errors.password} />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </label>
          <label>
            Confirm password
            <input name="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={handleChange} aria-invalid={!!errors.confirm} />
            {errors.confirm && <span className="field-error">{errors.confirm}</span>}
          </label>
          {serverError && <ErrorMessage message={serverError} />}
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
