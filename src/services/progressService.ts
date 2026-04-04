import { db, collections } from '../config/firebase';
import { UserProgress, UpdateProgressDto, CourseProgressSummary } from '../types';

export class ProgressService {
  /**
   * Get or create user progress for a lesson
   */
  async getOrCreateProgress(userId: string, lessonId: string): Promise<UserProgress> {
    const snapshot = await collections.userProgress
      .where('userId', '==', userId)
      .where('lessonId', '==', lessonId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0]!;
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        updatedAt: data.updatedAt.toDate(),
      } as UserProgress;
    }

    const now = new Date();
    const docRef = await collections.userProgress.add({
      userId,
      lessonId,
      lastWatchedSecond: 0,
      completed: false,
      updatedAt: now,
    });

    return {
      id: docRef.id,
      userId,
      lessonId,
      lastWatchedSecond: 0,
      completed: false,
      updatedAt: now,
    };
  }

  /**
   * Update user progress for a lesson
   */
  async updateProgress(userId: string, data: UpdateProgressDto): Promise<UserProgress> {
    const snapshot = await collections.userProgress
      .where('userId', '==', userId)
      .where('lessonId', '==', data.lessonId)
      .limit(1)
      .get();

    const now = new Date();

    if (snapshot.empty) {
      const docRef = await collections.userProgress.add({
        userId,
        lessonId: data.lessonId,
        lastWatchedSecond: data.lastWatchedSecond,
        completed: data.completed || false,
        updatedAt: now,
      });

      return {
        id: docRef.id,
        userId,
        lessonId: data.lessonId,
        lastWatchedSecond: data.lastWatchedSecond,
        completed: data.completed || false,
        updatedAt: now,
      };
    }

    const doc = snapshot.docs[0]!;
    await collections.userProgress.doc(doc.id).update({
      lastWatchedSecond: data.lastWatchedSecond,
      completed: data.completed ?? doc.data().completed,
      updatedAt: now,
    });

    return {
      id: doc.id,
      userId,
      lessonId: data.lessonId,
      lastWatchedSecond: data.lastWatchedSecond,
      completed: data.completed ?? doc.data().completed,
      updatedAt: now,
    };
  }

  /**
   * Get all progress for a user
   */
  async getUserProgress(userId: string): Promise<UserProgress[]> {
    const snapshot = await collections.userProgress
      .where('userId', '==', userId)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as UserProgress[];
  }

  /**
   * Get per-course progress summary for a user
   */
  async getProgressSummary(userId: string): Promise<CourseProgressSummary[]> {
    const allProgress = await this.getUserProgress(userId);
    if (allProgress.length === 0) return [];

    // Batch-fetch all lesson docs to get their moduleIds
    const lessonRefs = allProgress.map((p) => db.collection('lessons').doc(p.lessonId));
    const lessonDocs = await db.getAll(...lessonRefs);

    const lessonModuleMap = new Map<string, string>();
    for (const doc of lessonDocs) {
      if (doc.exists) lessonModuleMap.set(doc.id, (doc.data() as { moduleId: string }).moduleId);
    }

    // Batch-fetch all module docs to get their courseIds
    const uniqueModuleIds = [...new Set(lessonModuleMap.values())];
    if (uniqueModuleIds.length === 0) return [];
    const moduleDocs = await db.getAll(...uniqueModuleIds.map((id) => db.collection('modules').doc(id)));

    const moduleCourseMap = new Map<string, string>();
    for (const doc of moduleDocs) {
      if (doc.exists) moduleCourseMap.set(doc.id, (doc.data() as { courseId: string }).courseId);
    }

    // Group progress by courseId
    const byCourse = new Map<string, { completed: number; last: UserProgress | null }>();
    for (const p of allProgress) {
      const moduleId = lessonModuleMap.get(p.lessonId);
      if (!moduleId) continue;
      const courseId = moduleCourseMap.get(moduleId);
      if (!courseId) continue;

      const entry = byCourse.get(courseId) ?? { completed: 0, last: null };
      if (p.completed) entry.completed++;
      if (!entry.last || p.updatedAt > entry.last.updatedAt) entry.last = p;
      byCourse.set(courseId, entry);
    }

    // For each course get total lesson count, then build summary
    const summaries = await Promise.all(
      [...byCourse.entries()].map(async ([courseId, { completed, last }]) => {
        const modulesSnap = await collections.modules.where('courseId', '==', courseId).get();
        const lessonCounts = await Promise.all(
          modulesSnap.docs.map((m) =>
            collections.lessons.where('moduleId', '==', m.id).get().then((s) => s.size)
          )
        );
        const totalLessons = lessonCounts.reduce((a, b) => a + b, 0);

        return {
          courseId,
          completedLessons: completed,
          totalLessons,
          lastWatchedLessonId: last?.lessonId ?? null,
          lastWatchedSecond: last?.lastWatchedSecond ?? 0,
        };
      })
    );

    return summaries;
  }

  /**
   * Get user progress for a specific course
   */
  async getCourseProgress(userId: string, lessonIds: string[]): Promise<UserProgress[]> {
    if (lessonIds.length === 0) return [];

    const snapshot = await collections.userProgress
      .where('userId', '==', userId)
      .where('lessonId', 'in', lessonIds)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as UserProgress[];
  }
}

export const progressService = new ProgressService();
