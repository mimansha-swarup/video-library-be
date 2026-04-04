import { collections } from '../config/firebase';
import { LessonNote, UpsertNoteDto } from '../types';

export class NoteService {
  /**
   * Get the user's note for a lesson, or null if none exists
   */
  async getNote(userId: string, lessonId: string): Promise<LessonNote | null> {
    const snapshot = await collections.lessonNotes
      .where('userId', '==', userId)
      .where('lessonId', '==', lessonId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0]!;
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      updatedAt: data.updatedAt.toDate(),
    } as LessonNote;
  }

  /**
   * Create or update the user's note for a lesson
   */
  async upsertNote(userId: string, lessonId: string, data: UpsertNoteDto): Promise<LessonNote> {
    const now = new Date();

    const snapshot = await collections.lessonNotes
      .where('userId', '==', userId)
      .where('lessonId', '==', lessonId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      const docRef = await collections.lessonNotes.add({
        userId,
        lessonId,
        content: data.content,
        updatedAt: now,
      });

      return { id: docRef.id, userId, lessonId, content: data.content, updatedAt: now };
    }

    const doc = snapshot.docs[0]!;
    await collections.lessonNotes.doc(doc.id).update({
      content: data.content,
      updatedAt: now,
    });

    return { id: doc.id, userId, lessonId, content: data.content, updatedAt: now };
  }
}

export const noteService = new NoteService();
