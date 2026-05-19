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

async function checkPremiumDetails() {
  const today = new Date();
  try {
    const usersSnapshot = await db.collection('users').get();
    let totalUsers = usersSnapshot.size;
    let premiumCount = 0;
    let premiumActive = 0;
    let premiumExpired = 0;
    let premiumBlocked = 0;
    let premiumActiveWithPayment = 0;
    let premiumActiveWithoutPayment = 0;

    usersSnapshot.forEach(doc => {
      const u = doc.data();
      if (u.isPremium) {
        premiumCount++;
        const isBlocked = u.blocked === true;
        const isExpired = u.expireDate && new Date(u.expireDate) <= today;
        const hasPayment = !!u.paymentData;

        if (isBlocked) {
          premiumBlocked++;
        } else if (isExpired) {
          premiumExpired++;
        } else {
          premiumActive++;
          if (hasPayment) {
            premiumActiveWithPayment++;
          } else {
            premiumActiveWithoutPayment++;
          }
          console.log(`Active Premium: ${u.firstName} ${u.lastName} (ID: ${doc.id})`);
          console.log(`  - Has paymentData: ${hasPayment}`);
          console.log(`  - expireDate: ${u.expireDate || 'None'}`);
        }
      }
    });

    console.log('\n================ PREMIUM METRICS AUDIT ================');
    console.log(`Total registered users in DB: ${totalUsers}`);
    console.log(`Total users labeled isPremium (any state): ${premiumCount}`);
    console.log(`- Blocked Premium users: ${premiumBlocked}`);
    console.log(`- Expired Premium users: ${premiumExpired}`);
    console.log(`- Active Premium users (visible on dashboard): ${premiumActive}`);
    console.log(`  └ With Payment Records: ${premiumActiveWithPayment}`);
    console.log(`  └ Manually Set / No Payment Record: ${premiumActiveWithoutPayment}`);
    console.log('=======================================================');

  } catch (err) {
    console.error('Error running premium audit:', err);
  } finally {
    process.exit();
  }
}

checkPremiumDetails();
