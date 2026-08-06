import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '../../../firebase/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req) {
  try {
    const body = await req.json();
    const { couponCode, userId, idToken } = body;

    // --- Input Validation ---
    if (!couponCode || !userId || !idToken) {
      return NextResponse.json(
        { error: 'Missing required fields: couponCode, userId, idToken.' },
        { status: 400 }
      );
    }

    // --- Authenticate the user via their ID token ---
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (authError) {
      console.error('Token verification failed:', authError.message);
      return NextResponse.json(
        { error: 'Unauthorized. Invalid or expired session.' },
        { status: 401 }
      );
    }

    // Ensure the token's UID matches the claimed userId to prevent spoofing
    if (decodedToken.uid !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized. User ID mismatch.' },
        { status: 403 }
      );
    }

    // --- Fetch & Validate the Coupon ---
    const normalizedCode = couponCode.trim().toUpperCase();
    const couponRef = adminDb.collection('coupons').doc(normalizedCode);
    const couponSnap = await couponRef.get();

    if (!couponSnap.exists) {
      return NextResponse.json(
        { error: 'Invalid coupon code. Please check and try again.' },
        { status: 400 }
      );
    }

    const coupon = couponSnap.data();

    // Check if coupon is active
    if (!coupon.active) {
      return NextResponse.json(
        { error: 'This coupon is no longer active.' },
        { status: 400 }
      );
    }

    // Check expiry
    if (coupon.expiresAt) {
      const expiry = new Date(coupon.expiresAt);
      if (new Date() > expiry) {
        return NextResponse.json(
          { error: 'This coupon has expired.' },
          { status: 400 }
        );
      }
    }

    // Check global usage limit
    if (coupon.usageLimit !== null && coupon.usageLimit !== undefined) {
      if ((coupon.usedCount || 0) >= coupon.usageLimit) {
        return NextResponse.json(
          { error: 'This coupon has reached its maximum usage limit.' },
          { status: 400 }
        );
      }
    }

    // Check if this specific user has already redeemed this coupon
    const redeemedBy = coupon.redeemedBy || [];
    if (redeemedBy.includes(userId)) {
      return NextResponse.json(
        { error: 'You have already redeemed this coupon.' },
        { status: 400 }
      );
    }

    // --- Apply the Coupon (Atomic Writes using a Batch) ---
    const planType = coupon.planType; // 'basic' or 'premium'
    if (planType !== 'basic' && planType !== 'premium') {
      return NextResponse.json(
        { error: 'Invalid coupon configuration. Please contact support.' },
        { status: 500 }
      );
    }

    const expireDate = new Date();
    expireDate.setFullYear(expireDate.getFullYear() + 1);

    const userRef = adminDb.collection('users').doc(userId);

    const batch = adminDb.batch();

    // Update user subscription
    batch.update(userRef, {
      isPremium: planType === 'premium',
      isBasic: planType === 'basic',
      planType: planType,
      expireDate: expireDate.toISOString(),
      paymentData: {
        method: 'coupon',
        couponCode: normalizedCode,
        redeemedAt: new Date().toISOString(),
        planStartDate: new Date().toISOString(),
        planEndDate: expireDate.toISOString(),
      },
    });

    // Update coupon usage
    batch.update(couponRef, {
      usedCount: FieldValue.increment(1),
      redeemedBy: FieldValue.arrayUnion(userId),
    });

    await batch.commit();

    console.log(`✅ Coupon "${normalizedCode}" redeemed by user "${userId}" for plan "${planType}".`);

    return NextResponse.json({
      success: true,
      planType,
      message: `Coupon applied! Your ${planType === 'premium' ? 'Premium' : 'Basic'} subscription is now active.`,
      planEndDate: expireDate.toISOString(),
    });

  } catch (error) {
    console.error('❌ Coupon redemption error:', error);
    return NextResponse.json(
      { error: 'An unexpected server error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
