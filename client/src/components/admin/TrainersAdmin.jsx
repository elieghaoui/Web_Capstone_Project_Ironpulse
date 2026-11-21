import { useRef, useState } from 'react';
import ConfirmDelete from './ConfirmDelete.jsx';
import HoursEditor from './HoursEditor.jsx';
import { Loader, ErrorMessage, Notice } from '../Status.jsx';
import { useApi } from '../../hooks/useApi.js';
import { apiFetch } from '../../api/client.js';
import { initials } from '../../utils.js';

const empty = { name: '', bio: '', specialties: '', yearsExperience: '0', weeklyAvailability: [] };

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Enter a name';
  const years = Number(form.yearsExperience);
  if (!Number.isInteger(years) || years < 0 || years > 60) errors.yearsExperience = '0 to 60 years';
  if (form.bio.length > 1000) errors.bio = 'Keep it under 1000 characters';
  if (form.weeklyAvailability.some((slot) => slot.start >= slot.end)) errors.hours = 'Fix the hours marked in red';
  return errors;
}

export default function TrainersAdmin() {
  const { data: trainers, error, loading, reload } = useApi('/api/trainers');

  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const formRef = useRef(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function resetForm() {
    setForm(empty);
    setErrors({});
    setEditingId(null);
  }

  function startEdit(t) {
    setForm({
      name: t.name,
      bio: t.bio ?? '',
      specialties: (t.specialties ?? []).join(', '),
      yearsExperience: String(t.yearsExperience ?? 0),
      weeklyAvailability: (t.weeklyAvailability ?? []).map(({ day, start, end }) => ({ day, start, end })),
    });
    setErrors({});
    setNotice(null);
    setEditingId(t._id);
    formRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const body = {
      name: form.name.trim(),
      bio: form.bio.trim(),
      // "Yoga, Mobility" -> ["Yoga", "Mobility"]
      specialties: form.specialties.split(',').map((s) => s.trim()).filter(Boolean),
      yearsExperience: Number(form.yearsExperience),
      weeklyAvailability: form.weeklyAvailability,
    };
    setBusy(true);
    setNotice(null);
    try {
      if (editingId) {
        await apiFetch(`/api/trainers/${editingId}`, { method: 'PATCH', body: JSON.stringify(body) });
        setNotice({ type: 'success', text: `${body.name} updated` });
      } else {
        await apiFetch('/api/trainers', { method: 'POST', body: JSON.stringify(body) });
        setNotice({ type: 'success', text: `${body.name} added` });
      }
      resetForm();
      reload();
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    await apiFetch(`/api/trainers/${id}`, { method: 'DELETE' });
    if (editingId === id) resetForm();
    reload();
  }

  return (
    <div className="admin-grid">
      <form ref={formRef} className="admin-form" onSubmit={handleSubmit} noValidate>
        <h2>{editingId ? 'Edit trainer' : 'Add a trainer'}</h2>
        <label className="field">
          Name
          <input name="name" value={form.name} onChange={handleChange} aria-invalid={!!errors.name} />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </label>
        <label className="field">
          Specialties <span className="small">(separated by commas)</span>
          <input name="specialties" value={form.specialties} onChange={handleChange} placeholder="Strength, Boxing" />
        </label>
        <label className="field">
          Years coaching
          <input type="number" name="yearsExperience" min="0" max="60" value={form.yearsExperience} onChange={handleChange} aria-invalid={!!errors.yearsExperience} />
          {errors.yearsExperience && <span className="field-error">{errors.yearsExperience}</span>}
        </label>
        <label className="field">
          Bio
          <textarea name="bio" rows="3" value={form.bio} onChange={handleChange} aria-invalid={!!errors.bio} />
          {errors.bio && <span className="field-error">{errors.bio}</span>}
        </label>
        <HoursEditor hours={form.weeklyAvailability} onChange={(hours) => setForm({ ...form, weeklyAvailability: hours })} />
        {errors.hours && <span className="field-error">{errors.hours}</span>}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-small" disabled={busy}>
            {busy ? 'Saving…' : editingId ? 'Save changes' : 'Add trainer'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-ghost btn-small" onClick={resetForm}>Cancel</button>
          )}
        </div>
        {notice && <Notice type={notice.type}>{notice.text}</Notice>}
      </form>

      <div>
        <h2>Coaches {trainers && <span className="muted small">({trainers.length})</span>}</h2>
        {loading && !trainers && <Loader label="Loading trainers" />}
        {error && <ErrorMessage message={error.message} />}
        <div className="admin-list">
          {trainers?.map((t) => (
            <article key={t._id} className={t._id === editingId ? 'admin-row editing' : 'admin-row'}>
              <div className="admin-row-main">
                <span className="avatar small" aria-hidden="true">{initials(t.name)}</span>
                <div>
                  <h3>{t.name}</h3>
                  <p className="muted small">
                    {t.specialties.join(' · ') || 'No specialties'} · {t.yearsExperience} years · {t.weeklyAvailability.length} PT {t.weeklyAvailability.length === 1 ? 'window' : 'windows'} a week
                  </p>
                </div>
              </div>
              <div className="row-actions">
                <button type="button" className="btn btn-ghost btn-small" onClick={() => startEdit(t)}>Edit</button>
                <ConfirmDelete onConfirm={() => handleDelete(t._id)} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
