import { beforeAll, describe, expect, it } from 'vitest';
import { api, auth, createCourse, resetDb, signUp } from './helpers';

let instructor: Awaited<ReturnType<typeof signUp>>;
let student: Awaited<ReturnType<typeof signUp>>;

beforeAll(async () => {
  await resetDb();
  instructor = await signUp('INSTRUCTOR');
  student = await signUp('STUDENT');
});

describe('enrollment', () => {
  it('enrolls a student in a free published course exactly once', async () => {
    const { courseId } = await createCourse(instructor.token);

    const first = await api().post(`/api/courses/${courseId}/enroll`).set(auth(student.token));
    const second = await api().post(`/api/courses/${courseId}/enroll`).set(auth(student.token));

    expect(first.status).toBe(201);
    expect(second.status).toBe(409);

    const mine = await api().get('/api/enrollments/me').set(auth(student.token));
    expect(mine.body.data.map((e: { courseId: number }) => e.courseId)).toContain(courseId);
  });

  it('does not allow enrolling in a draft course', async () => {
    const { courseId } = await createCourse(instructor.token, { publish: false });
    const res = await api().post(`/api/courses/${courseId}/enroll`).set(auth(student.token));
    expect(res.status).toBe(404);
  });

  it('requires payment for paid courses', async () => {
    const { courseId } = await createCourse(instructor.token, { price: 499 });
    const res = await api().post(`/api/courses/${courseId}/enroll`).set(auth(student.token));
    expect(res.status).toBe(402);
  });
});

describe('lesson progress', () => {
  it('tracks completed lessons as a percentage, idempotently', async () => {
    const { courseId, lessonIds } = await createCourse(instructor.token, { lessons: 4 });
    await api().post(`/api/courses/${courseId}/enroll`).set(auth(student.token));

    const complete = (lessonId: number) =>
      api().post(`/api/progress/${courseId}/subsections/${lessonId}`).set(auth(student.token));

    expect((await complete(lessonIds[0])).body.data.progress).toBe(25);
    expect((await complete(lessonIds[0])).body.data.progress).toBe(25); // marking twice doesn't double-count
    const res = await complete(lessonIds[1]);

    expect(res.status).toBe(200);
    expect(res.body.data.progress).toBe(50);
    expect(res.body.data.completedSubSectionIds).toEqual(expect.arrayContaining(lessonIds.slice(0, 2)));

    const progress = await api().get(`/api/progress/${courseId}`).set(auth(student.token));
    expect(progress.body.data.progress).toBe(50);
  });

  it('rejects progress for a course the student is not enrolled in', async () => {
    const { courseId, lessonIds } = await createCourse(instructor.token);
    const res = await api()
      .post(`/api/progress/${courseId}/subsections/${lessonIds[0]}`)
      .set(auth(student.token));
    expect(res.status).toBe(403);
  });

  it('rejects a lesson that belongs to a different course', async () => {
    const a = await createCourse(instructor.token);
    const b = await createCourse(instructor.token);
    await api().post(`/api/courses/${a.courseId}/enroll`).set(auth(student.token));

    const res = await api()
      .post(`/api/progress/${a.courseId}/subsections/${b.lessonIds[0]}`)
      .set(auth(student.token));
    expect(res.status).toBe(400);
  });
});
