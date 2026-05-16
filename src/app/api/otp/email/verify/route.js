import { NextResponse } from 'next/server';
import { otpService } from '../../../../../services/otpService';

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ success: false, error: 'Email and OTP are required' }, { status: 400 });
    }

    const result = await otpService.verifyEmailOTP(email, otp);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error (Email Verify):', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Verification service is temporarily unavailable. Please try again later.' 
    }, { status: 500 });
  }
}
