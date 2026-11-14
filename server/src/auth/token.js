import jwt from 'jsonwebtoken';

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error('JWT_SECRET is missing from .env');
  return value;
}

export function signToken(user) {
  // Only the user id and role go in the token: anyone can read a JWT payload.
  return jwt.sign({ sub: user._id.toString(), role: user.role }, secret(), { expiresIn: '1h' });
}

// Throws if the token was tampered with or has expired.
export function verifyToken(token) {
  return jwt.verify(token, secret());
}
