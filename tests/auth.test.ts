import { beforeAll, describe, expect, it } from 'vitest';
import { api, auth, resetDb, signUp } from './helpers';

beforeAll(resetDb);

describe('POST /api/auth/signup', () => {
  it('creates a student by default and returns a token', async () => {
    const res = await api()
      .post('/api/auth/signup')
      .send({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@test.dev', password: 'secret123' });

    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({ email: 'ada@test.dev', role: 'STUDENT' });
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(res.body.data.token).toEqual(expect.any(String));
  });

  it('refuses to let anyone sign up as ADMIN', async () => {
    const res = await api()
      .post('/api/auth/signup')
      .send({ firstName: 'Eve', lastName: 'Mallory', email: 'eve@test.dev', password: 'secret123', role: 'ADMIN' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toContainEqual(expect.objectContaining({ field: 'role' }));
  });

  it('returns field-level validation errors as 400', async () => {
    const res = await api()
      .post('/api/auth/signup')
      .send({ firstName: 'A', lastName: 'B', email: 'not-an-email', password: '123' });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e: { field: string }) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['firstName', 'email', 'password']));
  });

  it('rejects a duplicate email', async () => {
    const res = await api()
      .post('/api/auth/signup')
      .send({ firstName: 'Ada', lastName: 'Again', email: 'ada@test.dev', password: 'secret123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already registered/i);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with the right password', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'ada@test.dev', password: 'secret123' });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
  });

  it('gives the same 401 for a wrong password and an unknown email', async () => {
    const wrong = await api().post('/api/auth/login').send({ email: 'ada@test.dev', password: 'nope-nope' });
    const unknown = await api().post('/api/auth/login').send({ email: 'ghost@test.dev', password: 'secret123' });

    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.message).toBe(unknown.body.message);
  });
});

describe('authentication middleware', () => {
  it('rejects protected routes without a token', async () => {
    const res = await api().get('/api/enrollments/me');
    expect(res.status).toBe(401);
  });

  it('rejects a forged token', async () => {
    const res = await api().get('/api/enrollments/me').set(auth('not.a.real.token'));
    expect(res.status).toBe(401);
  });

  it('accepts a valid token', async () => {
    const { token } = await signUp();
    const res = await api().get('/api/enrollments/me').set(auth(token));
    expect(res.status).toBe(200);
  });
});
