import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../firebase/firebaseAdmin';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const idToken = searchParams.get('idToken');

    if (!userId || !idToken) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Verify token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (authError) {
      return NextResponse.json({ error: 'Unauthorized. Invalid or expired session.' }, { status: 401 });
    }

    if (decodedToken.uid !== userId) {
      return NextResponse.json({ error: 'Unauthorized. User ID mismatch.' }, { status: 403 });
    }

    // Verify PA Subscription
    const userSnap = await adminDb.collection('users').doc(userId).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    const userData = userSnap.data();

    const hasVerifiedPayment = !!(userData.paymentData?.paymentId || userData.paymentId);

    let hasPaidPlan = false;
    if (hasVerifiedPayment) {
      hasPaidPlan = userData.planType === 'monthly' || userData.planType === 'yearly';
    }
    
    if (hasPaidPlan && (userData.expireDate || userData.premiumEndDate || userData.paExpireDate)) {
       const dates = [];
       if (userData.expireDate) dates.push(new Date(userData.expireDate));
       if (userData.premiumEndDate) dates.push(new Date(userData.premiumEndDate));
       if (userData.paExpireDate) dates.push(new Date(userData.paExpireDate));
       
       const maxExpiry = new Date(Math.max(...dates));
       hasPaidPlan = maxExpiry > new Date();
    }
    
    let inTrial = false;
    if (userData.createdAt) {
      const createdAtDate = new Date(userData.createdAt);
      const trialEndDate = new Date(createdAtDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (trialEndDate > new Date()) {
         inTrial = true;
      }
    }
    
    const hasAccess = hasPaidPlan || inTrial;
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden. Active subscription or trial required.' }, { status: 403 });
    }

    // Fetch all todos for this user
    const todosSnap = await adminDb
      .collection('todos')
      .where('userId', '==', userId)
      .get();

    const todos = todosSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || '',
        status: data.status || 'pending',
        taskDate: data.taskDate || '',
        taskTime: data.taskTime || '',
        recurrence: data.recurrence || 'none',
        createdAt: data.createdAt || '',
      };
    });

    // Sort by createdAt ascending for todos
    todos.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Fetch recent meeting notes for context
    const meetingsSnap = await adminDb
      .collection('meetingNotes')
      .where('userId', '==', userId)
      .get();
      
    let meetings = meetingsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || '',
        createdAt: data.createdAt || data.meetingDate || '',
        summary: data.summary || '',
        actionItems: data.actionItems || []
      };
    });
    
    // Sort meetings descending (newest first) and take top 5
    meetings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    meetings = meetings.slice(0, 5);

    return NextResponse.json({ todos, meetings });
  } catch (error) {
    console.error('Todos API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 });
  }
}
