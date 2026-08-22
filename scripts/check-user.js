import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkUser() {
  const usersCollection = collection(db, "users");
  const q = query(usersCollection, where("customUID", "==", "vish_vish_7402"));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    console.log("No user found.");
    return;
  }
  
  querySnapshot.forEach((doc) => {
    console.log(doc.id, " => ", doc.data());
  });
  
  process.exit(0);
}

checkUser();
