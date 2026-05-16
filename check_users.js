const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkUsers() {
  try {
    console.log('Fetching users from Firestore...');
    const snapshot = await db.collection('users').get();
    console.log(`Total Users: ${snapshot.size}`);

    let usersWithImages = 0;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.imgUrl) {
        usersWithImages++;
      }
    });

    console.log(`Users with profile images: ${usersWithImages}`);
    console.log(`Rough estimate: ~${(usersWithImages * 0.1).toFixed(2)} MB (assuming ~100KB per image)`);
    
  } catch (error) {
    console.error('Firestore Error:', error.message);
  }
}

checkUsers();
