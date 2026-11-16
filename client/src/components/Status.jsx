// Small shared pieces for loading, error and result messages.
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

// Inline result next to the button that was used: type is "success" or "error".
export function Notice({ type = 'success', children }) {
  return (
    <p className={`notice ${type}`} role={type === 'error' ? 'alert' : 'status'}>
      {children}
    </p>
  );
}
