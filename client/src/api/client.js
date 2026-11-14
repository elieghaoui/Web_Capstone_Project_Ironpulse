// Every request to the Express API goes through this one function (lecture 20, layer 01).
const API_URL = import.meta.env.VITE_API_URL ?? '';

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(API_URL + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  // Token expired or invalid: tell AuthProvider to log out.
  if (res.status === 401 && token) {
    window.dispatchEvent(new Event('auth:expired'));
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}
