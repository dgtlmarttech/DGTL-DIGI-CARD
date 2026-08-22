import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../firebase/firebaseAdmin';
import { getMeetingUsageData } from '../../../../utils/meetingUsage';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];

    if (!userId || !idToken) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Verify token
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      if (decodedToken.uid !== userId) {
        return NextResponse.json({ error: 'Unauthorized. User ID mismatch.' }, { status: 403 });
      }
    } catch (authError) {
      return NextResponse.json({ error: 'Unauthorized. Invalid session.' }, { status: 401 });
    }

    // Fetch User Data
    const userRef = adminDb.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const userData = userSnap.data();

    // Verify PA Subscription Access first
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
      // If no access, remaining is 0.
      return NextResponse.json({ 
        totalRemainingSeconds: 0,
        hasAccess: false 
      });
    }

    // Calculate usage data
    const usageData = await getMeetingUsageData(userData);

    // If resets are needed, perform them now to keep db clean
    if (usageData.needsBaseReset || usageData.needsAddonReset) {
      const updates = {};
      
      if (usageData.needsBaseReset) {
        updates.meetingNotesUsage = {
          usedSeconds: 0,
          cycleStartDate: usageData.cycleStart.toISOString()
        };
      }
      
      if (usageData.needsAddonReset) {
        updates.meetingNotesAddon = {
          active: false,
          expireDate: null,
          usedSeconds: 0
        };
      }
      
      // Update asynchronously without awaiting to not block the request
      userRef.update(updates).catch(err => console.error('Failed to reset cycles:', err));
    }

    return NextResponse.json({
      hasAccess: true,
      totalRemainingSeconds: usageData.totalRemainingSeconds,
      baseRemaining: usageData.baseRemaining,
      addonRemaining: usageData.addonRemaining,
      addonActive: usageData.addonActive
    });

  } catch (error) {
    console.error('Meeting Usage API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
  }
}
