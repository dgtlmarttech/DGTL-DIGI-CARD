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

async function createAdmin() {
  const email = 'admin@dgtldigicard.com';
  const password = 'AdminPassword123!';
  
  try {
    let userRecord;
    try {
      // Check if user already exists
      userRecord = await admin.auth().getUserByEmail(email);
      console.log(`User ${email} already exists.`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create user
        userRecord = await admin.auth().createUser({
          email: email,
          emailVerified: true,
          password: password,
          displayName: 'System Admin',
          disabled: false
        });
        console.log(`Successfully created new user: ${email}`);
      } else {
        throw error;
      }
    }

    // Set custom admin claims
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
    console.log(`Successfully set admin custom claim for user ${email}`);

    // Update password to ensure the user knows it
    await admin.auth().updateUser(userRecord.uid, {
      password: password
    });
    console.log(`Successfully set password to: ${password}`);

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    process.exit();
  }
}

createAdmin();
