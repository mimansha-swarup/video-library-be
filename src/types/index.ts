// Course Types
export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCourseDto {
  title: string;
  description: string;
  thumbnail?: string;
}

// Module Types
export interface Module {
  id: string;
  courseId: string;
  title: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateModuleDto {
  courseId: string;
  title: string;
  order: number;
}

// Lesson Types
export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  videoKey: string;
  duration: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLessonDto {
  moduleId: string;
  title: string;
  videoKey: string;
  duration: number;
  order: number;
}

// User Progress Types
export interface UserProgress {
  id: string;
  userId: string;
  lessonId: string;
  lastWatchedSecond: number;
  completed: boolean;
  updatedAt: Date;
}

export interface UpdateProgressDto {
  lessonId: string;
  lastWatchedSecond: number;
  completed?: boolean;
}

// Auth Types
export interface AuthUser {
  uid: string;
  email: string;
  name?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Lesson Note Types
export interface LessonNote {
  id: string;
  userId: string;
  lessonId: string;
  content: string;
  updatedAt: Date;
}

export interface UpsertNoteDto {
  content: string;
}

// Course Progress Summary (used by GET /progress/summary)
export interface CourseProgressSummary {
  courseId: string;
  completedLessons: number;
  totalLessons: number;
  lastWatchedLessonId: string | null;
  lastWatchedSecond: number;
}

// Video Stream Response
export interface StreamUrlResponse {
  streamUrl: string;
  expiresIn: number;
}
