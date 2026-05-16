// /app/api/mailer/route.js
import { NextResponse } from 'next/server';
import admin, { adminDb as db } from '../../../firebase/firebaseAdmin';
import { SendMailClient } from 'zeptomail';
import getEmailTemplate from '../../../utils/mail_template';

const zeptoUrl = process.env.NEXT_PUBLIC_ZEPTO_URL || 'https://api.zeptomail.com/';
const zeptoToken = process.env.NEXT_PUBLIC_ZEPTO_TOKEN;

if (!zeptoToken) {
  console.error('Missing ZEPTO_TOKEN! Email sending will fail.');
}

const client = new SendMailClient({ url: zeptoUrl, token: zeptoToken });

const sendEmail = async (to, subject, html, userName) => {
  try {
    const response = await client.sendMail({
      from: { address: 'support@dgtldigicard.com', name: 'DigitalCard Team' },
      to: [{ email_address: { address: to, name: userName || to.split('@')[0] } }],
      subject,
      htmlbody: html,
    });

    const sent =
      response.message === 'OK' || (response.data && response.data.some(item => item.code === 'EM_104'));

    // Log every attempt
    await db.collection('emailLogs').add({
      to,
      userName,
      subject,
      sent,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      response,
    });

    return sent;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

const hasSentEmailBefore = async (to, subject) => {
  const existing = await db
    .collection('emailLogs')
    .where('to', '==', to)
    .where('subject', '==', subject)
    .where('sent', '==', true)
    .limit(1)
    .get();

  return !existing.empty;
};

export async function POST() {
  try {
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

    const usersSnapshot = await db.collection('users').get();
    let emailsSent = 0;

    /*
    for (const doc of usersSnapshot.docs) {
      const user = doc.data();
      if (!user.email) continue;
      const userName = user.firstName || 'there';

      let emailType = null;

      // Trial emails have been removed as the free trial is replaced with a direct 99 rs payment.

      // Premium emails (with discount variants)
      if (user.isPremium && user.expireDate) {
        const premiumExp = user.expireDate.toDate ? user.expireDate.toDate() : new Date(user.expireDate);

        if (premiumExp > now && premiumExp <= twoDaysFromNow) emailType = 'premium_2_days_before_discount';
        else if (premiumExp <= twoDaysAgo && premiumExp > tenDaysAgo) emailType = 'premium_2_days_after_discount';
        else if (premiumExp <= tenDaysAgo) emailType = 'premium_10_days_after_discount';
        else if (premiumExp > now && premiumExp <= new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000))
          emailType = 'premium_10_days_before_discount'; // optional for clarity
      }

      // Skip if no email type applicable
      if (!emailType) continue;

      // Get template for emailType and userName
      const template = getEmailTemplate(emailType, userName);

      // Check for duplicates
      const alreadySent = await hasSentEmailBefore(user.email, template.subject);
      if (alreadySent) {
        console.log(`Skipping duplicate "${emailType}" email to ${user.email}`);
        continue;
      }

      // Send email and increment if successful
      const sent = await sendEmail(user.email, template.subject, template.html, userName);
      if (sent) {
        console.log(`Sent "${emailType}" email to ${user.email}`);
        emailsSent++;
      }
    }
    */

    return NextResponse.json({ success: true, emailsSent, message: `Automated mailer is currently disabled. Only OTP and Welcome emails are active.` });
  } catch (error) {
    console.error('Mailer worker error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error in mailer' }, { status: 500 });
  }
}
