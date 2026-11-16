import request from 'supertest';
import jwt from 'jsonwebtoken';
import { describe, it, expect } from 'vitest';
import app from '../app.js';

// Lecture 22: requests without a browser. These cases are rejected before the
// database is asked, so no port and no database are needed.
process.env.JWT_SECRET ??= 'test-secret';
const memberToken = jwt.sign({ sub: '665f1c2e4b7a1d3f0c8e2a9b', role: 'member' }, process.env.JWT_SECRET);
const auth = { Authorization: `Bearer ${memberToken}` };

describe('/api/bookings', () => {
  it('rejects a missing token', async () => {
    const res = await request(app).get('/api/bookings');
    expect(res.status).toBe(401);
  });

  it('rejects a forged token', async () => {
    const res = await request(app).get('/api/bookings').set('Authorization', 'Bearer abc.def.ghi');
    expect(res.status).toBe(401);
  });

  it('rejects a booking with an unknown type', async () => {
    const res = await request(app).post('/api/bookings').set(auth).send({ type: 'gym' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('type must be "class" or "pt"');
  });

  it('rejects a malformed booking id', async () => {
    const res = await request(app).delete('/api/bookings/not-an-id').set(auth);
    expect(res.status).toBe(400);
  });
});

describe('/api/auth', () => {
  it('rejects a short password on signup', async () => {
    const res = await request(app).post('/api/auth/signup').send({ name: 'Bob', email: 'bob@uni.edu', password: 'short' });
    expect(res.status).toBe(400);
  });

  it('rejects an injection attempt on login', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: { $ne: null }, password: { $ne: null } });
    expect(res.status).toBe(400);
  });
});

describe('/api/plans', () => {
  it("doesn't let a member create a plan", async () => {
    const res = await request(app).post('/api/plans').set(auth).send({ name: 'Free', priceMonthly: 0 });
    expect(res.status).toBe(403);
  });
});
