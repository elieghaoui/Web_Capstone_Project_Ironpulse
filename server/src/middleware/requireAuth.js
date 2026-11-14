import { verifyToken } from '../auth/token.js';

// Authentication: is there a valid token? Sets req.userId and req.userRole.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing token' });
  }
  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Authorization: logged in, but are you an admin? Use after requireAuth.
export function requireAdmin(req, res, next) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admins only' });
  }
  next();
}
