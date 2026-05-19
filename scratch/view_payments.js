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

const db = admin.firestore();

async function checkPaymentRecords() {
  try {
    console.log('--- Checking Collections ---');
    const collections = await db.listCollections();
    const collectionIds = collections.map(c => c.id);
    console.log('Available collections:', collectionIds);

    // Let's inspect the 'payments' collection if it exists
    if (collectionIds.includes('payments')) {
      console.log('\n--- Reading documents from "payments" collection ---');
      const paymentsSnapshot = await db.collection('payments').limit(10).get();
      if (paymentsSnapshot.empty) {
        console.log('No documents found in "payments" collection.');
      } else {
        paymentsSnapshot.forEach(doc => {
          console.log(`Payment Doc ID: ${doc.id}`);
          console.log(JSON.stringify(doc.data(), null, 2));
        });
      }
    } else {
      console.log('\n"payments" collection does not exist.');
    }

    // Let's inspect the 'users' collection for paymentData fields
    console.log('\n--- Checking "users" collection for paymentData fields ---');
    const usersSnapshot = await db.collection('users').get();
    let usersWithPaymentField = 0;
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.paymentData) {
        usersWithPaymentField++;
        console.log(`User Doc: ${doc.id} (${data.firstName} ${data.lastName})`);
        console.log(`  - isPremium: ${data.isPremium}`);
        console.log(`  - expireDate: ${data.expireDate}`);
        console.log('  - paymentData:', JSON.stringify(data.paymentData, null, 2));
      }
    });
    console.log(`\nTotal users with paymentData: ${usersWithPaymentField} out of ${usersSnapshot.size} total users.`);

  } catch (err) {
    console.error('Error checking DB:', err);
  } finally {
    process.exit();
  }
}

checkPaymentRecords();
