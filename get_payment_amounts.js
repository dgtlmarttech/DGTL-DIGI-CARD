const admin = require('firebase-admin');
const fs = require('fs');
const Razorpay = require('razorpay');

// Read .env file
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
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

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY,
  key_secret: env.RAZORPAY_SECRET,
});

async function getPaymentAmounts() {
  try {
    console.log('Fetching users from Firestore...');
    const snapshot = await db.collection('users').get();
    
    const paidUsers = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const isPremium = data.isPremium === true || data.isPremium === 'true';
      const hasPaymentData = data.paymentData && (typeof data.paymentData === 'object' || (typeof data.paymentData === 'string' && data.paymentData.trim() !== ''));

      if (isPremium || hasPaymentData) {
        data.id = doc.id;
        paidUsers.push(data);
      }
    });

    console.log(`Found ${paidUsers.length} paid users. Fetching amounts from Razorpay...`);

    for (const user of paidUsers) {
      let paymentId = null;
      let paymentData = user.paymentData;

      if (typeof paymentData === 'string') {
        try {
          paymentData = JSON.parse(paymentData);
        } catch (e) {
          // Ignore
        }
      }

      if (paymentData && paymentData.paymentId) {
        paymentId = paymentData.paymentId;
      }

      if (paymentId) {
        try {
          const payment = await razorpay.payments.fetch(paymentId);
          console.log(`User: ${user.firstName} ${user.lastName} (${user.email}) - Paid: ${payment.amount / 100} ${payment.currency}`);
          user.amount = payment.amount / 100;
          user.currency = payment.currency;
        } catch (err) {
          console.error(`Error fetching payment ${paymentId} for user ${user.email}:`, err.message);
          user.amount = 'Error';
          user.currency = '';
        }
      } else {
        console.log(`User: ${user.firstName} ${user.lastName} (${user.email}) - No Payment ID in paymentData`);
        user.amount = 'N/A';
        user.currency = '';
      }
    }

    // Save to a new CSV
    const keysArray = ['id', 'firstName', 'lastName', 'email', 'amount', 'currency', 'isPremium'];
    let csv = keysArray.join(',') + '\n';

    paidUsers.forEach(user => {
      const row = keysArray.map(key => {
        let val = user[key];
        if (val === undefined || val === null) {
          return '""';
        }
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      });
      csv += row.join(',') + '\n';
    });

    fs.writeFileSync('paid_users_amounts.csv', csv);
    console.log('\nSaved to paid_users_amounts.csv successfully!');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

getPaymentAmounts();
