// Fail fast (lecture 21): crash at startup if a secret is missing,
// instead of failing later on the first login.
export function checkEnv(keys = ['MONGODB_URI', 'JWT_SECRET', 'CLIENT_URL']) {
  for (const key of keys) {
    if (!process.env[key]) {
      throw new Error(`Missing env var: ${key} (copy .env.example to .env and fill it in)`);
    }
  }
}
