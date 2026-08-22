import { NextResponse } from 'next/server';
import { db } from '../../../firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function GET(request) {
  try {
    const q = query(collection(db, 'users'), where('customUID', '==', 'vish_vish_7402'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('DEBUG-USER: No user found with customUID = vish_vish_7402');
      return NextResponse.json({ error: 'No user found' });
    }
    
    const userData = snapshot.docs[0].data();
    console.log('DEBUG-USER Data:', JSON.stringify(userData, null, 2));
    
    return NextResponse.json({ success: true, userData });
  } catch (error) {
    console.error('DEBUG-USER Error:', error);
    return NextResponse.json({ error: error.message });
  }
}
