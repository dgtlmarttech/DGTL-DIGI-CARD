import { NextResponse } from 'next/server';
import admin, { adminDb as db } from '../../../firebase/firebaseAdmin';
import { sendAccountDeletionAlert } from '../../../../services/triggerMail';

export async function POST(request) {
  try {
    const { email, reason } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    // 1. Save to Firestore
    await db.collection('accountDeletionRequests').add({
      email,
      reason: reason || 'No reason provided',
      status: 'pending',
      requestedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 2. Send Email Alert to Admin
    await sendAccountDeletionAlert(email, reason);

    return NextResponse.json({ success: true, message: 'Request submitted successfully' });
  } catch (error) {
    console.error('API Error (Account Deletion):', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to submit request.' 
    }, { status: 500 });
  }
}
