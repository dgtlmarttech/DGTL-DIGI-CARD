import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/^['"]|['"]$/g, '');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing or invalid Firebase Admin environment variables');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log(`✅ Firebase Admin initialized for project: ${projectId}`);
  } catch (error) {
    console.error('❌ Firebase admin initialization error:', error.message);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export default admin;
