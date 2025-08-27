import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { SendMailClient } from 'zeptomail';
import getEmailTemplate from '@/utils/mail_template';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

const db = admin.firestore();

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

    const sent = response.message === 'OK' || (response.data && response.data.some(item => item.code === 'EM_104'));

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
  const existing = await db.collection('emailLogs')
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

    for (const doc of usersSnapshot.docs) {
      const user = doc.data();
      if (!user.email) continue;
      const userName = user.firstName || 'there';

      // Determine which email to send based on user state
      let emailType = null;

      // Trial emails
      if (!user.isPremium && user.trialStartDate) {
        const trialStart = user.trialStartDate.toDate ? user.trialStartDate.toDate() : new Date(user.trialStartDate);
        const trialEnd = new Date(trialStart.getTime() + 15 * 24 * 60 * 60 * 1000);

        if (trialEnd > now && trialEnd <= twoDaysFromNow) emailType = 'trial_2_days_before';
        else if (trialEnd <= twoDaysAgo && trialEnd > tenDaysAgo) emailType = 'trial_2_days_after';
        else if (trialEnd <= tenDaysAgo) emailType = 'trial_10_days_after';
      }

      // Premium emails
      if (user.isPremium && user.expireDate) {
        const premiumExp = user.expireDate.toDate ? user.expireDate.toDate() : new Date(user.expireDate);

        if (premiumExp > now && premiumExp <= twoDaysFromNow) emailType = 'premium_2_days_before';
        else if (premiumExp <= twoDaysAgo && premiumExp > tenDaysAgo) emailType = 'premium_2_days_after';
        else if (premiumExp <= tenDaysAgo) emailType = 'premium_10_days_after';
      }

      // Skip if no email type applicable
      if (!emailType) continue;

      // Get template once here
      const template = getEmailTemplate(emailType, userName);

      // Check for duplicates: skip if email already sent successfully
      const alreadySent = await hasSentEmailBefore(user.email, template.subject);
      if (alreadySent) {
        console.log(`Skipping duplicate "${emailType}" email to ${user.email}`);
        continue;
      }

      // Send email and increment counter if successful
      const sent = await sendEmail(user.email, template.subject, template.html, userName);
      if (sent) {
        console.log(`Sent "${emailType}" email to ${user.email}`);
        emailsSent++;
      }
    }

    return NextResponse.json({ success: true, emailsSent, message: `Sent ${emailsSent} emails` });

  } catch (error) {
    console.error('Mailer worker error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
