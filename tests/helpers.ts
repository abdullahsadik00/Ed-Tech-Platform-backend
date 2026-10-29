import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/prisma';

export const api = () => request(app);

// Empty every application table between test files (keeps migration history).
export async function resetDb() {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tables.length === 0) return;
  const list = tables.map((t) => `"public"."${t.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}

let counter = 0;

export async function signUp(role: 'STUDENT' | 'INSTRUCTOR' = 'STUDENT') {
  counter += 1;
  const email = `${role.toLowerCase()}${counter}@test.dev`;
  const res = await api()
    .post('/api/auth/signup')
    .send({ firstName: 'Test', lastName: 'User', email, password: 'secret123', role });
  if (res.status !== 201) throw new Error(`signup failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { email, token: res.body.data.token as string, id: res.body.data.user.id as number };
}

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

export const validCourse = {
  title: 'Intro to Testing',
  description: 'Learn how to write integration tests for an API.',
  thumbnail: 'https://example.com/thumb.jpg',
  price: 0,
  level: 'BEGINNER',
  duration: 30,
};

// Creates a free course with one section and `lessons` lessons, published unless told otherwise.
export async function createCourse(instructorToken: string, opts: { lessons?: number; publish?: boolean; price?: number } = {}) {
  const { lessons = 2, publish = true, price = 0 } = opts;
  const course = await api().post('/api/courses').set(auth(instructorToken)).send({ ...validCourse, price });
  if (course.status !== 201) throw new Error(`create course failed: ${course.status} ${JSON.stringify(course.body)}`);
  const courseId = course.body.data.id as number;

  const section = await api()
    .post(`/api/courses/${courseId}/sections`)
    .set(auth(instructorToken))
    .send({ title: 'Section 1', order: 1 });
  const sectionId = section.body.data.id as number;

  const lessonIds: number[] = [];
  for (let i = 1; i <= lessons; i++) {
    const lesson = await api()
      .post(`/api/sections/${sectionId}/subsections`)
      .set(auth(instructorToken))
      .send({ title: `Lesson ${i}`, content: 'https://youtu.be/dQw4w9WgXcQ', duration: 5, order: i });
    lessonIds.push(lesson.body.data.id);
  }

  if (publish) {
    await api().put(`/api/courses/${courseId}/publish`).set(auth(instructorToken));
  }
  return { courseId, sectionId, lessonIds };
}
