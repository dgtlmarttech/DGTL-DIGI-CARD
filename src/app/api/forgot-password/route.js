import { NextResponse } from 'next/server';
import { adminAuth } from '../../../firebase/firebaseAdmin';
import { SendMailClient } from 'zeptomail';

const zeptoUrl = process.env.NEXT_PUBLIC_ZEPTO_URL || 'https://api.zeptomail.com/';
const zeptoToken = process.env.NEXT_PUBLIC_ZEPTO_TOKEN;

if (!zeptoToken) {
  console.error('Missing ZEPTO_TOKEN! Email sending will fail.');
}

const client = new SendMailClient({ url: zeptoUrl, token: zeptoToken });

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists in Firebase Auth to prevent sending emails to non-existent users
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Return success even if user not found to prevent email enumeration attacks
        // or return a specific error if you prefer that UX.
        // The original Firebase client SDK throws an error if user is not found,
        // so we'll maintain that behavior for consistency with the frontend UI.
        return NextResponse.json({ error: 'auth/user-not-found' }, { status: 404 });
      }
      throw error;
    }

    // Generate the password reset link
    const resetLink = await adminAuth.generatePasswordResetLink(email);

    // Prepare the HTML email content
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #4f46e5; margin: 0;">Password Reset Request</h2>
        </div>
        
        <p>Hello ${userRecord.displayName || 'there'},</p>
        
        <p>We received a request to reset your password for your Digital Visiting Card account. Click the button below to set a new password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666; font-size: 14px;">${resetLink}</p>
        
        <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
        
        <p style="font-size: 12px; color: #888; text-align: center;">
          &copy; ${new Date().getFullYear()} Digital Visiting Card. All rights reserved.<br>
          This is an automated email, please do not reply.
        </p>
      </div>
    `;

    // Send the email via ZeptoMail
    const response = await client.sendMail({
      from: { address: 'support@dgtldigicard.com', name: 'DigitalCard Support' },
      to: [{ email_address: { address: email, name: userRecord.displayName || email.split('@')[0] } }],
      subject: 'Reset your password for Digital Visiting Card',
      htmlbody: htmlBody,
    });

    const isSuccess = response.message === 'OK' || (response.data && response.data.some(item => item.code === 'EM_104'));

    if (isSuccess) {
      return NextResponse.json({ success: true, message: 'Password reset email sent' });
    } else {
      console.error('ZeptoMail send failure:', response);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

  } catch (error) {
    console.error('Password reset API error:', error);
    return NextResponse.json(
      { error: 'Internal server error processing password reset' },
      { status: 500 }
    );
  }
}
