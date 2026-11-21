import { useState } from 'react';
import { Notice } from '../Status.jsx';

// Two-step delete: the first click only asks, the second one deletes.
// If the server refuses (e.g. 409 "Members booked this class"), its message shows here.
export default function ConfirmDelete({ onConfirm, label = 'Delete' }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleYes() {
    setBusy(true);
    setError('');
    try {
      await onConfirm(); // the parent reloads its list, so this row disappears
    } catch (err) {
      setError(err.message);
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <div className="confirm-delete">
      {confirming ? (
        <>
          <button type="button" className="btn btn-danger btn-small" onClick={handleYes} disabled={busy}>
            {busy ? 'Deleting…' : 'Yes, delete'}
          </button>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => setConfirming(false)} disabled={busy}>
            Keep it
          </button>
        </>
      ) : (
        <button type="button" className="btn btn-danger btn-small" onClick={() => setConfirming(true)}>
          {label}
        </button>
      )}
      {error && <Notice type="error">{error}</Notice>}
    </div>
  );
}
