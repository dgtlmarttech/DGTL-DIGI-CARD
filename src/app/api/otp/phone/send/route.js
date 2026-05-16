import { NextResponse } from 'next/server';
import { messageCentralService } from '../../../../../services/messageCentralService';
import { otpService } from '../../../../../services/otpService';

export async function POST(request) {
  try {
    const { mobileNumber, countryCode } = await request.json();

    if (!mobileNumber) {
      return NextResponse.json({ success: false, error: 'Mobile number is required' }, { status: 400 });
    }

    try {
      // 1. Call Message Central native OTP service (DLT-bypass pre-approved SMS templates)
      const result = await messageCentralService.sendOTP(mobileNumber, countryCode || '91');
      
      return NextResponse.json({ 
        success: true, 
        verificationId: result.verificationId,
        message: 'OTP sent via SMS' 
      });
    } catch (mcError) {
      console.warn(`⚠️ Message Central native OTP failed (${mcError.message}). Falling back to local Firestore OTP...`);
      
      // Fallback: Generate custom OTP in Firestore
      const otp = await otpService.createPhoneOTP(mobileNumber);
      
      // Log to terminal for local developer bypass
      console.log(`\n[DEBUG] LOCAL PHONE OTP FALLBACK for ${mobileNumber}: ${otp}\n`);
      
      return NextResponse.json({ 
        success: true, 
        verificationId: `LOCAL_${otp}`,
        message: 'Local OTP registered for testing' 
      });
    }
  } catch (error) {
    console.error('API Error (Phone Send):', error);
    return NextResponse.json({ 
      success: false, 
      error: 'We could not send the SMS. Please check your mobile number or try again later.' 
    }, { status: 500 });
  }
}
