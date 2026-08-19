/**
 * One-off script to delete a user by email OR mobile number from:
 *  1. Firebase Firestore (users collection)
 *  2. Firebase Authentication
 *
 * Usage:
 *   node scripts/delete-user.mjs vishalyadavdgtl@gmail.com
 *   node scripts/delete-user.mjs 7347414419
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Load .env manually ────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');
const envContent = readFileSync(envPath, 'utf-8');

for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[key]) process.env[key] = val;
}

// ── Firebase Admin ─────────────────────────────────────────────────────────────
import admin from 'firebase-admin';

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId:   process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey,
  }),
});

const db   = admin.firestore();
const auth = admin.auth();

// ── Helpers ───────────────────────────────────────────────────────────────────
const isEmail = (str) => str.includes('@');

async function deleteFirestoreDocs(query) {
  const snap = await query.get();
  if (snap.empty) return 0;
  for (const doc of snap.docs) {
    await doc.ref.delete();
    console.log(`✅  Deleted Firestore document — users/${doc.id}`);
  }
  return snap.size;
}

async function deleteAuthUser(uid) {
  try {
    await auth.deleteUser(uid);
    console.log(`✅  Deleted Firebase Auth user  — UID: ${uid}`);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.warn(`⚠️   Auth user not found for UID: ${uid}`);
    } else {
      throw err;
    }
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────
const identifier = process.argv[2];

if (!identifier) {
  console.error('❌  Please provide an email or mobile number as an argument.');
  process.exit(1);
}

console.log(`\n🔍  Looking up user: ${identifier}\n`);

try {
  if (isEmail(identifier)) {
    // ── Email flow ─────────────────────────────────────────────────────────
    let uid;
    try {
      const authUser = await auth.getUserByEmail(identifier);
      uid = authUser.uid;
      console.log(`✅  Found Auth user — UID: ${uid}`);
    } catch (err) {
      if (err.code !== 'auth/user-not-found') throw err;
      console.warn('⚠️   Not found in Firebase Auth. Checking Firestore by email...');
    }

    // Delete by UID doc first
    if (uid) {
      const docRef = db.collection('users').doc(uid);
      const snap = await docRef.get();
      if (snap.exists) {
        await docRef.delete();
        console.log(`✅  Deleted Firestore document — users/${uid}`);
      }
    }

    // Fallback: query by email field
    const deleted = await deleteFirestoreDocs(
      db.collection('users').where('email', '==', identifier)
    );
    if (!deleted && !uid) {
      console.warn('⚠️   No Firestore documents found for this email.');
    }

    if (uid) await deleteAuthUser(uid);

  } else {
    // ── Mobile number flow ─────────────────────────────────────────────────
    // Try multiple formats the number could be stored as
    const variants = [
      identifier,                    // as-is:       7347414419
      `+91${identifier}`,            // with +91:    +917347414419
      `91${identifier}`,             // with 91:     917347414419
      identifier.replace(/^0/, ''),  // strip leading 0 if any
    ];

    let uid = null;

    // Try Firebase Auth phone lookup (needs E.164 format)
    for (const variant of [`+91${identifier}`, `+${identifier}`]) {
      try {
        const authUser = await auth.getUserByPhoneNumber(variant);
        uid = authUser.uid;
        console.log(`✅  Found Auth user (phone ${variant}) — UID: ${uid}`);
        break;
      } catch (err) {
        if (err.code !== 'auth/user-not-found') throw err;
      }
    }

    // Delete Auth user if found
    if (uid) {
      const docRef = db.collection('users').doc(uid);
      const snap = await docRef.get();
      if (snap.exists) {
        await docRef.delete();
        console.log(`✅  Deleted Firestore document — users/${uid}`);
      }
      await deleteAuthUser(uid);
    }

    // Also query Firestore mobile field for all variants (catches email/OTP signups)
    let totalDeleted = 0;
    for (const variant of variants) {
      const count = await deleteFirestoreDocs(
        db.collection('users').where('mobile', '==', variant)
      );
      totalDeleted += count;
    }

    if (!uid && totalDeleted === 0) {
      console.warn('⚠️   No records found for this mobile number in Auth or Firestore.');
    }
  }

  console.log(`\n🎉  Done. Account "${identifier}" has been fully removed.\n`);
} catch (err) {
  console.error('\n❌  Error during deletion:', err.message);
  process.exit(1);
}
