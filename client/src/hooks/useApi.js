import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api/client.js';

// Loads a GET route and tracks loading / error / data.
// Call reload() after a create, update or delete to fetch fresh data.
// Pass null as the path to load nothing yet (e.g. "my bookings" while logged out).
export function useApi(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(Boolean(path));

  // useCallback keeps `load` the same between renders, so the effect
  // below doesn't loop forever.
  const load = useCallback(() => {
    if (!path) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    apiFetch(path)
      .then(setData, setError)
      .finally(() => setLoading(false));
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, loading, reload: load };
}
