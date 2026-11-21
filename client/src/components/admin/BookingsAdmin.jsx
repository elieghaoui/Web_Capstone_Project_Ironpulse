import { useState } from 'react';
import ConfirmDelete from './ConfirmDelete.jsx';
import { Loader, ErrorMessage } from '../Status.jsx';
import { useApi } from '../../hooks/useApi.js';
import { apiFetch } from '../../api/client.js';
import { formatDay, formatTime } from '../../utils.js';
import FilterGroup from './FilterGroup.jsx';

const statusOptions = [
  { value: '', label: 'All' },
  { value: 'booked', label: 'Booked' },
  { value: 'cancelled', label: 'Cancelled' },
];
const typeOptions = [
  { value: '', label: 'All' },
  { value: 'class', label: 'Classes' },
  { value: 'pt', label: 'PT' },
];

// Every booking in the gym: GET /api/bookings returns all of them to an admin,
// filtered with ?status=...&type=... (validated on the server).
// An admin can cancel any active booking, at any time.
export default function BookingsAdmin() {
  const [status, setStatus] = useState('booked');
  const [type, setType] = useState('');

  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (type) params.set('type', type);
  const query = params.toString();
  const { data: bookings, error, loading, reload } = useApi(`/api/bookings${query ? `?${query}` : ''}`);

  async function cancelBooking(id) {
    await apiFetch(`/api/bookings/${id}`, { method: 'DELETE' }); // kept as "cancelled", credit back
    reload();
  }

  return (
    <div>
      <div className="filters">
        <FilterGroup label="Status" options={statusOptions} value={status} onChange={setStatus} />
        <FilterGroup label="Type" options={typeOptions} value={type} onChange={setType} />
      </div>

      <h2>Bookings {bookings && <span className="muted small">({bookings.length})</span>}</h2>
      {loading && !bookings && <Loader label="Loading bookings" />}
      {error && <ErrorMessage message={error.message} />}
      {bookings?.length === 0 && <p className="muted">No bookings match these filters.</p>}

      <div className="admin-list">
        {bookings?.map((b) => {
          const isClass = b.type === 'class';
          const what = isClass ? b.classId?.title ?? 'Deleted class' : 'Personal training';
          const coach = isClass ? b.classId?.trainerId?.name : b.trainerId?.name;
          return (
            <article key={b._id} className="admin-row">
              <div>
                <h3>
                  {what} <span className="tag">{isClass ? 'Class' : 'PT'}</span>{' '}
                  <span className={b.status === 'cancelled' ? 'tag cancelled' : 'tag booked'}>{b.status}</span>
                </h3>
                <p className="muted small">
                  {formatDay(b.startsAt)} · {formatTime(b.startsAt)}
                  {coach && ` · with ${coach}`}
                </p>
                <p className="small">
                  {b.userId ? `${b.userId.name} (${b.userId.email})` : 'Deleted member'}
                  {b.note && <span className="muted"> · “{b.note}”</span>}
                </p>
              </div>
              {b.status === 'booked' && (
                <div className="row-actions">
                  <ConfirmDelete
                    label="Cancel booking"
                    confirmLabel="Yes, cancel"
                    busyLabel="Cancelling…"
                    onConfirm={() => cancelBooking(b._id)}
                  />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
