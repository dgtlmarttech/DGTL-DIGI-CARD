const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Helper to parse .env manually
function parseEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  const env = {};
  lines.forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      env[key] = value;
    }
  });
  return env;
}

const env = parseEnv();
const projectId = env.FIREBASE_PROJECT_ID;
const clientEmail = env.FIREBASE_CLIENT_EMAIL;
const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/^['"]|['"]$/g, '');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

async function findAdmins() {
  try {
    console.log('Fetching all users from Firebase Auth to check for admin claims...');
    let nextPageToken;
    let foundAdmins = [];
    
    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      for (const userRecord of listUsersResult.users) {
        const customClaims = userRecord.customClaims || {};
        if (customClaims.admin === true) {
          foundAdmins.push({
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            customClaims
          });
        }
      }
      nextPageToken = listUsersResult.nextPageToken;
    } while (nextPageToken);

    console.log(`\nFound ${foundAdmins.length} admin user(s):`);
    console.log(JSON.stringify(foundAdmins, null, 2));

  } catch (error) {
    console.error('Error listing users:', error);
  } finally {
    process.exit();
  }
}

findAdmins();
