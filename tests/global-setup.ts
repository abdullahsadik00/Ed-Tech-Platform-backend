import { execSync } from 'child_process';

// Integration tests run against a real PostgreSQL database (DATABASE_URL).
// Apply all migrations once before any test file runs.
export default function setup() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must point at a disposable test database');
  }
  process.env.DATABASE_URL_UNPOOLED ??= process.env.DATABASE_URL;
  execSync('npx prisma migrate deploy', { stdio: 'inherit', env: process.env });
}
