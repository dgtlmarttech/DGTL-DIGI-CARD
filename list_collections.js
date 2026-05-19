const admin = require('firebase-admin');
const fs = require('fs');

// Read .env file
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let value = match[2].trim();
    env[match[1].trim()] = value;
  }
});

const rawPrivateKey = env.FIREBASE_PRIVATE_KEY;
const privateKey = rawPrivateKey ? rawPrivateKey.replace(/\\n/g, '\n').replace(/^['"]|['"]$/g, '') : null;

if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !privateKey) {
  console.error('Error: Missing Firebase credentials in .env file.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  })
});

const db = admin.firestore();

async function listCollections() {
  try {
    console.log('Fetching collections...');
    const collections = await db.listCollections();
    console.log('Collections found:');
    collections.forEach(collection => {
      console.log(`- ${collection.id}`);
    });
  } catch (error) {
    console.error('Firestore Error:', error.message);
  }
}

listCollections();
