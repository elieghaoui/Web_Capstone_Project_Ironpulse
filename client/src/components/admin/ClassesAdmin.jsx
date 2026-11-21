import { useRef, useState } from 'react';
import ConfirmDelete from './ConfirmDelete.jsx';
import { Loader, ErrorMessage, Notice } from '../Status.jsx';
import { useApi } from '../../hooks/useApi.js';
import { apiFetch } from '../../api/client.js';
import { formatDay, formatTime, toInputDateTime, fromInputDateTime } from '../../utils.js';

const CATEGORIES = ['HIIT', 'Cycling', 'Yoga', 'Pilates', 'Boxing', 'Strength', 'Mobility']; // same list as the server
const empty = { title: '', category: 'HIIT', room: 'Studio A', trainerId: '', startsAt: '', durationMin: '45', capacity: '20' };

// Checked here for quick feedback, and again by the server (zod) on every request.
function validate(form, isNew) {
  const errors = {};
  if (!form.title.trim()) errors.title = 'Enter a title';
  if (!form.trainerId) errors.trainerId = 'Pick a coach';
  if (!form.startsAt) errors.startsAt = 'Pick a date and time';
  else if (isNew && new Date(form.startsAt) <= new Date()) errors.startsAt = 'Pick a time in the future';
  const duration = Number(form.durationMin);
  if (!Number.isInteger(duration) || duration < 15 || duration > 180) errors.durationMin = '15 to 180 minutes';
  const capacity = Number(form.capacity);
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 200) errors.capacity = '1 to 200 spots';
  return errors;
}

export default function ClassesAdmin() {
  const { data: classes, error, loading, reload } = useApi('/api/classes');
  const { data: trainers } = useApi('/api/trainers');

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

  function startEdit(c) {
    setForm({
      title: c.title,
      category: c.category,
      room: c.room ?? '',
      trainerId: c.trainerId?._id ?? '',
      startsAt: toInputDateTime(c.startsAt),
      durationMin: String(c.durationMin),
      capacity: String(c.capacity),
    });
    setErrors({});
    setNotice(null);
    setEditingId(c._id);
    formRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate(form, !editingId);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const body = {
      title: form.title.trim(),
      category: form.category,
      room: form.room.trim() || 'Studio A',
      trainerId: form.trainerId,
      startsAt: fromInputDateTime(form.startsAt),
      durationMin: Number(form.durationMin),
      capacity: Number(form.capacity),
    };
    setBusy(true);
    setNotice(null);
    try {
      if (editingId) {
        await apiFetch(`/api/classes/${editingId}`, { method: 'PATCH', body: JSON.stringify(body) });
        setNotice({ type: 'success', text: `${body.title} updated` });
      } else {
        await apiFetch('/api/classes', { method: 'POST', body: JSON.stringify(body) });
        setNotice({ type: 'success', text: `${body.title} added to the schedule` });
      }
      resetForm();
      reload();
    } catch (err) {
      setNotice({ type: 'error', text: err.message }); // e.g. capacity below the number already booked
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    await apiFetch(`/api/classes/${id}`, { method: 'DELETE' });
    if (editingId === id) resetForm();
    reload();
  }

  return (
    <div className="admin-grid">
      <form ref={formRef} className="admin-form" onSubmit={handleSubmit} noValidate>
        <h2>{editingId ? 'Edit class' : 'Add a class'}</h2>
        <label className="field">
          Title
          <input name="title" value={form.title} onChange={handleChange} aria-invalid={!!errors.title} />
          {errors.title && <span className="field-error">{errors.title}</span>}
        </label>
        <div className="form-row">
          <label className="field">
            Type
            <select name="category" value={form.category} onChange={handleChange}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Room
            <input name="room" value={form.room} onChange={handleChange} />
          </label>
        </div>
        <label className="field">
          Coach
          <select name="trainerId" value={form.trainerId} onChange={handleChange} aria-invalid={!!errors.trainerId}>
            <option value="">Choose a coach…</option>
            {trainers?.map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
          {errors.trainerId && <span className="field-error">{errors.trainerId}</span>}
        </label>
        <label className="field">
          Starts at
          <input type="datetime-local" name="startsAt" value={form.startsAt} onChange={handleChange} aria-invalid={!!errors.startsAt} />
          {errors.startsAt && <span className="field-error">{errors.startsAt}</span>}
        </label>
        <div className="form-row">
          <label className="field">
            Minutes
            <input type="number" name="durationMin" min="15" max="180" step="5" value={form.durationMin} onChange={handleChange} aria-invalid={!!errors.durationMin} />
            {errors.durationMin && <span className="field-error">{errors.durationMin}</span>}
          </label>
          <label className="field">
            Spots
            <input type="number" name="capacity" min="1" max="200" value={form.capacity} onChange={handleChange} aria-invalid={!!errors.capacity} />
            {errors.capacity && <span className="field-error">{errors.capacity}</span>}
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-small" disabled={busy}>
            {busy ? 'Saving…' : editingId ? 'Save changes' : 'Add class'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-ghost btn-small" onClick={resetForm}>Cancel</button>
          )}
        </div>
        {notice && <Notice type={notice.type}>{notice.text}</Notice>}
      </form>

      <div>
        <h2>Upcoming classes {classes && <span className="muted small">({classes.length})</span>}</h2>
        {loading && !classes && <Loader label="Loading classes" />}
        {error && <ErrorMessage message={error.message} />}
        {classes?.length === 0 && <p className="muted">No upcoming classes yet.</p>}
        <div className="admin-list">
          {classes?.map((c) => (
            <article key={c._id} className={c._id === editingId ? 'admin-row editing' : 'admin-row'}>
              <div>
                <h3>{c.title} <span className="tag">{c.category}</span></h3>
                <p className="muted small">
                  {formatDay(c.startsAt)} · {formatTime(c.startsAt)} · {c.durationMin} min · {c.room}
                  {c.trainerId?.name && ` · ${c.trainerId.name}`}
                </p>
                <p className="small">{c.capacity - c.spotsLeft} / {c.capacity} booked</p>
              </div>
              <div className="row-actions">
                <button type="button" className="btn btn-ghost btn-small" onClick={() => startEdit(c)}>Edit</button>
                <ConfirmDelete onConfirm={() => handleDelete(c._id)} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
