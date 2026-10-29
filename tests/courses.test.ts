import { beforeAll, describe, expect, it } from 'vitest';
import { api, auth, createCourse, resetDb, signUp, validCourse } from './helpers';

let instructor: Awaited<ReturnType<typeof signUp>>;
let otherInstructor: Awaited<ReturnType<typeof signUp>>;
let student: Awaited<ReturnType<typeof signUp>>;

beforeAll(async () => {
  await resetDb();
  instructor = await signUp('INSTRUCTOR');
  otherInstructor = await signUp('INSTRUCTOR');
  student = await signUp('STUDENT');
});

describe('creating courses (role-based access)', () => {
  it('lets an instructor create a course as a draft', async () => {
    const res = await api().post('/api/courses').set(auth(instructor.token)).send(validCourse);
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ title: validCourse.title, published: false });
  });

  it('forbids students from creating courses', async () => {
    const res = await api().post('/api/courses').set(auth(student.token)).send(validCourse);
    expect(res.status).toBe(403);
  });

  it('forbids an instructor from adding sections to someone else\'s course', async () => {
    const { courseId } = await createCourse(instructor.token, { lessons: 0 });
    const res = await api()
      .post(`/api/courses/${courseId}/sections`)
      .set(auth(otherInstructor.token))
      .send({ title: 'Hijack', order: 2 });
    expect(res.status).toBe(403);
  });
});

describe('course visibility', () => {
  it('lists only published courses in the public catalog', async () => {
    const published = await createCourse(instructor.token, { publish: true });
    const draft = await createCourse(instructor.token, { publish: false });

    const res = await api().get('/api/courses');
    const ids = res.body.data.courses.map((c: { id: number }) => c.id);

    expect(res.status).toBe(200);
    expect(ids).toContain(published.courseId);
    expect(ids).not.toContain(draft.courseId);
  });

  it('hides a draft from anonymous users, students and other instructors', async () => {
    const { courseId } = await createCourse(instructor.token, { publish: false });

    expect((await api().get(`/api/courses/${courseId}`)).status).toBe(404);
    expect((await api().get(`/api/courses/${courseId}`).set(auth(student.token))).status).toBe(404);
    expect((await api().get(`/api/courses/${courseId}`).set(auth(otherInstructor.token))).status).toBe(404);
  });

  it('shows a draft to its own instructor', async () => {
    const { courseId } = await createCourse(instructor.token, { publish: false });
    const res = await api().get(`/api/courses/${courseId}`).set(auth(instructor.token));
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(courseId);
  });

  it('shows a published course to anyone, with its curriculum', async () => {
    const { courseId, lessonIds } = await createCourse(instructor.token, { lessons: 3 });
    const res = await api().get(`/api/courses/${courseId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.sections[0].subSections).toHaveLength(lessonIds.length);
  });
});
