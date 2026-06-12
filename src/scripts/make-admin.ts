// Usage: ts-node src/scripts/make-admin.ts user@email.com
import admin from 'firebase-admin';
import { config } from '../config/env';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebase.projectId,
      privateKey: config.firebase.privateKey,
      clientEmail: config.firebase.clientEmail,
    }),
  });
}

async function makeAdmin(email: string): Promise<void> {
  const user = await admin.auth().getUserByEmail(email);
  const existing = user.customClaims || {};
  await admin.auth().setCustomUserClaims(user.uid, { ...existing, admin: true });
  console.log(`✓ Admin claim set for: ${email} (uid: ${user.uid})`);
}

const email = process.argv[2];

if (!email) {
  console.error('Usage: ts-node src/scripts/make-admin.ts user@email.com');
  process.exit(1);
}

makeAdmin(email)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
