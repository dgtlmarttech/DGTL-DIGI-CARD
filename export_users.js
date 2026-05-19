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

console.log('Project ID:', env.FIREBASE_PROJECT_ID);
console.log('Client Email:', env.FIREBASE_CLIENT_EMAIL);
console.log('Private Key Length:', privateKey.length);
console.log('Private Key Start:', privateKey.substring(0, 30));

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  })
});

const db = admin.firestore();

async function exportUsers() {
  try {
    console.log('Fetching users from Firestore using .env credentials...');
    const snapshot = await db.collection('users').get();
    console.log(`Total Users: ${snapshot.size}`);

    const users = [];
    const allKeys = new Set();

    snapshot.forEach(doc => {
      const data = doc.data();
      data.id = doc.id;
      users.push(data);
      Object.keys(data).forEach(key => allKeys.add(key));
    });

    const keysArray = Array.from(allKeys);
    console.log(`Found ${keysArray.length} unique fields.`);

    let csv = keysArray.join(',') + '\n';

    users.forEach(user => {
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

    fs.writeFileSync('users_export.csv', csv);
    console.log('Exported to users_export.csv successfully!');

  } catch (error) {
    console.error('Firestore Error:', error.message);
  }
}

exportUsers();
