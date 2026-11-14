import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../auth/AuthContext.jsx';

const links = [
  { to: '/', label: 'Home' },
  { to: '/plans', label: 'Plans' },
  { to: '/classes', label: 'Classes' },
  { to: '/trainers', label: 'Trainers' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const accountLinks = user ? (
    <>
      {user.role === 'admin' && (
        <NavLink to="/admin" onClick={close} className="nav-link">Admin</NavLink>
      )}
      <NavLink to="/dashboard" onClick={close} className="nav-link">My Dashboard</NavLink>
      <button type="button" className="btn btn-ghost" onClick={() => { logout(); close(); }}>
        Log out
      </button>
    </>
  ) : (
    <>
      <NavLink to="/login" onClick={close} className="nav-link">Log in</NavLink>
      <Link to="/signup" onClick={close} className="btn btn-primary">Join now</Link>
    </>
  );

  return (
    <header className="navbar">
      <Link to="/" className="logo" onClick={close} aria-label="IRONPULSE home">
        IRON<span>PULSE</span>
      </Link>

      <nav className="nav-desktop" aria-label="Main">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.to === '/'} className="nav-link">
            {({ isActive }) => (
              <>
                {l.label}
                {isActive && <motion.span layoutId="nav-underline" className="nav-underline" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="nav-account">{accountLinks}</div>

      <button
        type="button"
        className="nav-toggle"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={open ? 'bar open' : 'bar'} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.nav
            className="nav-mobile"
            aria-label="Mobile"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
          >
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'} onClick={close} className="nav-link">
                {l.label}
              </NavLink>
            ))}
            {accountLinks}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
