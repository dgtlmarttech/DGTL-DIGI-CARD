const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

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

const auth = admin.auth();
const db = admin.firestore();

async function createTestUser() {
  const email = 'tester@dgtldigicard.com';
  const password = 'TestPassword123!';
  const firstName = 'Test';
  const lastName = 'User';
  const mobile = '9999988888';
  
  try {
    console.log(`Checking if user ${email} already exists...`);
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log('User already exists in Firebase Auth. Updating user password...');
      userRecord = await auth.updateUser(userRecord.uid, {
        password: password,
        displayName: `${firstName} ${lastName}`,
      });
    } catch (authError) {
      if (authError.code === 'auth/user-not-found') {
        console.log('User not found in Firebase Auth. Creating new user...');
        userRecord = await auth.createUser({
          email: email,
          password: password,
          displayName: `${firstName} ${lastName}`,
          emailVerified: true
        });
      } else {
        throw authError;
      }
    }

    const customUID = `${firstName}_${lastName}_${Math.floor(1000 + Math.random() * 9000)}`;
    const userDocRef = db.collection('users').doc(userRecord.uid);
    
    console.log('Writing user profile details to Firestore users collection...');
    await userDocRef.set({
      uid: userRecord.uid,
      customUID: customUID,
      firstName: firstName,
      lastName: lastName,
      email: email,
      mobile: mobile,
      affiliateRef: '',
      businessName: 'Testing Labs Ltd',
      website: 'www.testinglabs.com',
      address: '123 Testing Street, QA City',
      about: 'Professional software testing account.',
      isPremium: false,
      isTrialActive: true,
      trialStartDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log('\n==================================================');
    console.log('SUCCESS: Test User created/updated successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Firestore Document ID: ${userRecord.uid}`);
    console.log(`Custom URL Path: /${customUID}`);
    console.log('==================================================');

  } catch (err) {
    console.error('Error creating test user:', err);
  } finally {
    process.exit();
  }
}

createTestUser();
