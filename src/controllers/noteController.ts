import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { noteService } from '../services/noteService';
import { UpsertNoteDto } from '../types';
import { AppError } from '../middleware/errorHandler';

export class NoteController {
  /**
   * GET /notes/:lessonId
   */
  async getNote(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.uid;
      if (!userId) throw new AppError('User not authenticated', 401);

      const note = await noteService.getNote(userId, req.params.lessonId as string);
      res.json({ success: true, data: note });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /notes/:lessonId
   */
  async upsertNote(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.uid;
      if (!userId) throw new AppError('User not authenticated', 401);

      const data: UpsertNoteDto = req.body;
      const note = await noteService.upsertNote(userId, req.params.lessonId as string, data);
      res.json({ success: true, data: note });
    } catch (error) {
      next(error);
    }
  }
}

export const noteController = new NoteController();
