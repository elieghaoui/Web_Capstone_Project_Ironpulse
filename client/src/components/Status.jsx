// Small shared pieces for loading and error states.
export function Loader({ label = 'Loading' }) {
  return (
    <div className="loader" role="status">
      <span className="pulse-line" aria-hidden="true" />
      <span>{label}…</span>
    </div>
  );
}

export function ErrorMessage({ message }) {
  return (
    <p className="error" role="alert">
      {message}
    </p>
  );
}
