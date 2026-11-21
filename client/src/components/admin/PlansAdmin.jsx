import { useRef, useState } from 'react';
import ConfirmDelete from './ConfirmDelete.jsx';
import { Loader, ErrorMessage, Notice } from '../Status.jsx';
import { useApi } from '../../hooks/useApi.js';
import { apiFetch } from '../../api/client.js';

const empty = { name: '', priceMonthly: '', unlimitedClasses: false, classesPerMonth: '0', ptSessionsPerMonth: '0', perks: '' };

function isWhole(value, min, max) {
  const n = Number(value);
  return value !== '' && Number.isInteger(n) && n >= min && n <= max;
}

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Enter a name';
  const price = Number(form.priceMonthly);
  if (form.priceMonthly === '' || Number.isNaN(price) || price < 0 || price > 10000) errors.priceMonthly = '0 to 10000';
  if (!form.unlimitedClasses && !isWhole(form.classesPerMonth, 0, 1000)) errors.classesPerMonth = '0 to 1000, or tick unlimited';
  if (!isWhole(form.ptSessionsPerMonth, 0, 100)) errors.ptSessionsPerMonth = '0 to 100';
  return errors;
}

// "null" classes = unlimited (same meaning as the server and the Plans page)
function describeClasses(n) {
  return n === null ? 'Unlimited classes' : `${n} classes`;
}

export default function PlansAdmin() {
  const { data: plans, error, loading, reload } = useApi('/api/plans');

  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const formRef = useRef(null);

  function handleChange(e) {
    const { name, type, checked, value } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  }

  function resetForm() {
    setForm(empty);
    setErrors({});
    setEditingId(null);
  }

  function startEdit(p) {
    setForm({
      name: p.name,
      priceMonthly: String(p.priceMonthly),
      unlimitedClasses: p.classesPerMonth === null,
      classesPerMonth: p.classesPerMonth === null ? '0' : String(p.classesPerMonth),
      ptSessionsPerMonth: String(p.ptSessionsPerMonth),
      perks: p.perks.join('\n'),
    });
    setErrors({});
    setNotice(null);
    setEditingId(p._id);
    formRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const body = {
      name: form.name.trim(),
      priceMonthly: Number(form.priceMonthly),
      classesPerMonth: form.unlimitedClasses ? null : Number(form.classesPerMonth),
      ptSessionsPerMonth: Number(form.ptSessionsPerMonth),
      perks: form.perks.split('\n').map((p) => p.trim()).filter(Boolean), // one perk per line
    };
    if (!editingId) {
      // New plans go last on the Plans page.
      body.order = Math.max(0, ...(plans ?? []).map((p) => p.order ?? 0)) + 1;
    }
    setBusy(true);
    setNotice(null);
    try {
      if (editingId) {
        await apiFetch(`/api/plans/${editingId}`, { method: 'PATCH', body: JSON.stringify(body) });
        setNotice({ type: 'success', text: `${body.name} updated` });
      } else {
        await apiFetch('/api/plans', { method: 'POST', body: JSON.stringify(body) });
        setNotice({ type: 'success', text: `${body.name} added` });
      }
      resetForm();
      reload();
    } catch (err) {
      setNotice({ type: 'error', text: err.message }); // e.g. 409 a plan with that name exists
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    await apiFetch(`/api/plans/${id}`, { method: 'DELETE' });
    if (editingId === id) resetForm();
    reload();
  }

  return (
    <div className="admin-grid">
      <form ref={formRef} className="admin-form" onSubmit={handleSubmit} noValidate>
        <h2>{editingId ? 'Edit plan' : 'Add a plan'}</h2>
        <div className="form-row">
          <label className="field">
            Name
            <input name="name" value={form.name} onChange={handleChange} aria-invalid={!!errors.name} />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </label>
          <label className="field">
            Price / month ($)
            <input type="number" name="priceMonthly" min="0" value={form.priceMonthly} onChange={handleChange} aria-invalid={!!errors.priceMonthly} />
            {errors.priceMonthly && <span className="field-error">{errors.priceMonthly}</span>}
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            Classes / 30 days
            <input
              type="number"
              name="classesPerMonth"
              min="0"
              value={form.classesPerMonth}
              onChange={handleChange}
              disabled={form.unlimitedClasses}
              aria-invalid={!!errors.classesPerMonth}
            />
            {errors.classesPerMonth && <span className="field-error">{errors.classesPerMonth}</span>}
          </label>
          <label className="field">
            PT sessions / 30 days
            <input type="number" name="ptSessionsPerMonth" min="0" value={form.ptSessionsPerMonth} onChange={handleChange} aria-invalid={!!errors.ptSessionsPerMonth} />
            {errors.ptSessionsPerMonth && <span className="field-error">{errors.ptSessionsPerMonth}</span>}
          </label>
        </div>
        <label className="check">
          <input type="checkbox" name="unlimitedClasses" checked={form.unlimitedClasses} onChange={handleChange} />
          Unlimited group classes
        </label>
        <label className="field">
          Perks <span className="small">(one per line)</span>
          <textarea name="perks" rows="4" value={form.perks} onChange={handleChange} />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-small" disabled={busy}>
            {busy ? 'Saving…' : editingId ? 'Save changes' : 'Add plan'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-ghost btn-small" onClick={resetForm}>Cancel</button>
          )}
        </div>
        {notice && <Notice type={notice.type}>{notice.text}</Notice>}
      </form>

      <div>
        <h2>Plans {plans && <span className="muted small">({plans.length})</span>}</h2>
        {loading && !plans && <Loader label="Loading plans" />}
        {error && <ErrorMessage message={error.message} />}
        <div className="admin-list">
          {plans?.map((p) => (
            <article key={p._id} className={p._id === editingId ? 'admin-row editing' : 'admin-row'}>
              <div>
                <h3>{p.name} <span className="muted small">${p.priceMonthly}/month</span></h3>
                <p className="muted small">
                  {describeClasses(p.classesPerMonth)} · {p.ptSessionsPerMonth} PT sessions · {p.perks.length} perks
                </p>
              </div>
              <div className="row-actions">
                <button type="button" className="btn btn-ghost btn-small" onClick={() => startEdit(p)}>Edit</button>
                <ConfirmDelete onConfirm={() => handleDelete(p._id)} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
