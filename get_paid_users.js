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

async function getPaidUsers() {
  try {
    console.log('Fetching users from Firestore...');
    const snapshot = await db.collection('users').get();
    
    const paidUsers = [];
    const allKeys = new Set();

    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Check if user is premium or has payment data
      const isPremium = data.isPremium === true || data.isPremium === 'true';
      const hasPaymentData = data.paymentData && (typeof data.paymentData === 'object' || (typeof data.paymentData === 'string' && data.paymentData.trim() !== ''));

      if (isPremium || hasPaymentData) {
        data.id = doc.id;
        paidUsers.push(data);
        Object.keys(data).forEach(key => allKeys.add(key));
      }
    });

    console.log(`Total Paid Users found: ${paidUsers.length}`);

    if (paidUsers.length === 0) {
      console.log('No paid users found.');
      return;
    }

    const keysArray = Array.from(allKeys);
    let csv = keysArray.join(',') + '\n';

    paidUsers.forEach(user => {
      const row = keysArray.map(key => {
        let val = user[key];
        if (val === undefined || val === null) {
          return '""';
        }
        if (typeof val === 'object') {
          val = JSON.stringify(val);
        } else {
          val = String(val);
        }
        val = val.replace(/"/g, '""');
        return `"${val}"`;
      });
      csv += row.join(',') + '\n';
    });

    fs.writeFileSync('paid_users_export.csv', csv);
    console.log('Exported to paid_users_export.csv successfully!');

    // Print a summary of a few users
    console.log('\nSummary of first few paid users:');
    paidUsers.slice(0, 5).forEach(u => {
      console.log(`- ${u.firstName} ${u.lastName} (${u.email}) - Premium: ${u.isPremium}`);
    });

  } catch (error) {
    console.error('Firestore Error:', error.message);
  }
}

getPaidUsers();
