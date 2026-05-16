const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Fix common newline issues if any
if (serviceAccount.private_key.includes('\\n')) {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function test() {
  try {
    const docRef = db.collection('test').doc('test');
    await docRef.set({ test: true });
    console.log('✅ Firestore Write Success!');
  } catch (err) {
    console.error('❌ Firestore Write Error:', err);
  }
}

test();
