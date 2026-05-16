import { NextResponse } from 'next/server';
import { otpService } from '../../../../../services/otpService';
import { sendOTPEmail } from '../../../../../services/triggerMail';

export async function POST(request) {
  try {
    const { email, firstName } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const otp = await otpService.createEmailOTP(email);
    console.log(`\n[DEBUG] EMAIL OTP for ${email}: ${otp}\n`);
    const sent = await sendOTPEmail(email, firstName, otp);

    if (sent) {
      return NextResponse.json({ success: true, message: 'OTP sent to email' });
    } else {
      throw new Error('Failed to send email');
    }
  } catch (error) {
    console.error('API Error (Email Send):', error);
    return NextResponse.json({ 
      success: false, 
      error: 'We could not send the verification email. Please check your address or try again later.' 
    }, { status: 500 });
  }
}
