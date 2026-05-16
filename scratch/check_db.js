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

const db = admin.firestore();

async function checkUsers() {
  try {
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;
    
    let premiumCount = 0;
    let standardCount = 0;
    let blockedCount = 0;
    
    const users = [];
    
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.blocked) blockedCount++;
      else if (data.isPremium) premiumCount++;
      else standardCount++;
      
      users.push({
        id: doc.id,
        name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
        email: data.email,
        isPremium: data.isPremium,
        createdAt: data.createdAt
      });
    });

    console.log(`\n--- Firebase User Statistics ---`);
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Premium Users: ${premiumCount}`);
    console.log(`Standard Users: ${standardCount}`);
    console.log(`Blocked Users: ${blockedCount}`);
    console.log(`------------------------------\n`);

    // Approximate size calculation (very rough)
    let totalSizeApprox = 0;
    usersSnapshot.forEach(doc => {
        totalSizeApprox += JSON.stringify(doc.data()).length;
    });
    
    console.log(`Approximate Firestore User Data Size: ${(totalSizeApprox / 1024).toFixed(2)} KB`);
    console.log(`Firestore Free Tier Limit: 1,024,000 KB (1 GB)`);
    console.log(`Usage: ~${((totalSizeApprox / (1024 * 1024 * 1024)) * 100).toFixed(6)}% of free storage limit`);
    console.log(`------------------------------\n`);

    console.log(`Recent Users:`);
    users.slice(-5).forEach(u => {
        console.log(`- ${u.name} (${u.email}) - Premium: ${u.isPremium}`);
    });

  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    process.exit();
  }
}

checkUsers();
