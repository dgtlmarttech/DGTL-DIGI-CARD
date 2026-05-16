import { NextResponse } from 'next/server';
import { messageCentralService } from '../../../../../services/messageCentralService';
import { otpService } from '../../../../../services/otpService';

export async function POST(request) {
  try {
    const { mobileNumber, otp, verificationId } = await request.json();

    if (!mobileNumber || !otp) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Check for local testing fallback prefix
    if (verificationId && verificationId.startsWith('LOCAL_')) {
      const fallbackOtp = verificationId.replace('LOCAL_', '');
      if (otp === fallbackOtp) {
        return NextResponse.json({ success: true, message: 'Local OTP verified successfully' });
      }
      // Direct verification from firestore as backup
      const result = await otpService.verifyPhoneOTP(mobileNumber, otp);
      return NextResponse.json(result);
    }

    // 2. Real Message Central Verification check
    if (verificationId) {
      const result = await messageCentralService.verifyOTP(mobileNumber, otp, verificationId);
      return NextResponse.json(result);
    }

    // 3. Fallback: Simple firestore validation
    const result = await otpService.verifyPhoneOTP(mobileNumber, otp);
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error (Phone Verify):', error);
    return NextResponse.json({ 
      success: false, 
      error: 'OTP verification is currently unavailable. Please try again later.' 
    }, { status: 500 });
  }
}
