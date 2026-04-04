import admin from 'firebase-admin';
import { config } from './env';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebase.projectId,
      privateKey: config.firebase.privateKey,
      clientEmail: config.firebase.clientEmail,
    }),
  });
}

export const db = admin.firestore();
export const auth = admin.auth();

// Collection references
export const collections = {
  courses: db.collection('courses'),
  modules: db.collection('modules'),
  lessons: db.collection('lessons'),
  userProgress: db.collection('userProgress'),
  lessonNotes: db.collection('lessonNotes'),
};

export default admin;
