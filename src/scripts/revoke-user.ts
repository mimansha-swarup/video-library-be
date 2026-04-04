// Usage: ts-node src/scripts/revoke-user.ts user@email.com
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

async function revokeUser(email: string): Promise<void> {
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { approved: false });
  console.log(`✓ Revoked: ${email} (uid: ${user.uid})`);
}

const email = process.argv[2];

if (!email) {
  console.error('Usage: ts-node src/scripts/revoke-user.ts user@email.com');
  process.exit(1);
}

revokeUser(email)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
