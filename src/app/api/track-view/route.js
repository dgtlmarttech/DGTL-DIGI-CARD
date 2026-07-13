import { NextResponse } from 'next/server';
import admin, { adminDb } from '../../../firebase/firebaseAdmin';

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Securely increment the cardViews counter. Using merge: true prevents errors if the field/doc doesn't exist yet.
    const userRef = adminDb.collection('users').doc(userId);
    await userRef.set({
      cardViews: admin.firestore.FieldValue.increment(1)
    }, { merge: true });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error tracking view:', error);
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
}
