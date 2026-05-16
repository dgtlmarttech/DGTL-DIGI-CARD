const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));

// Fix common newline issues in private_key if they exist
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'digital-card-test.appspot.com'
});

const bucket = admin.storage().bucket();

async function listFiles() {
  try {
    console.log('Attempting to list files...');
    const [files] = await bucket.getFiles();
    console.log(`Successfully found ${files.length} files.`);
    
    files.forEach(file => {
      console.log(`- ${file.name} (${file.metadata.size} bytes) [${file.metadata.contentType}]`);
    });
  } catch (error) {
    console.error('ERROR TYPE:', error.constructor.name);
    console.error('ERROR MESSAGE:', error.message);
    if (error.code === 402 || error.message.includes('402')) {
      console.log('\nResult: The 402 error means Firebase has blocked access to Storage for this project because it is on the Spark plan.');
    }
  }
}

listFiles();
