// "Karim Haddad" -> "KH" (used for avatar circles until we add photos)
export function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// Dates arrive from the API as ISO strings, e.g. "2026-11-20T07:00:00.000Z".
export function formatDay(date) {
  return new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Groups items by calendar day: [["Monday 10 Nov", [...]], ...]
export function groupByDay(items, getDate) {
  const groups = new Map();
  for (const item of items) {
    const day = formatDay(getDate(item));
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day).push(item);
  }
  return [...groups.entries()];
}

// <input type="datetime-local"> works in the browser's local time without a time zone:
// Date -> "2026-11-23T09:00" to fill the input...
export function toInputDateTime(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ...and back to a full ISO date with its time zone for the API.
export function fromInputDateTime(value) {
  return new Date(value).toISOString();
}
