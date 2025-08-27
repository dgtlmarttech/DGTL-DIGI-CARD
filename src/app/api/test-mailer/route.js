// /app/api/test-mailer/route.js
import { NextResponse } from 'next/server';
import { SendMailClient } from 'zeptomail';
import getEmailTemplate from '@/utils/mail_template';

const zeptoUrl = process.env.NEXT_PUBLIC_ZEPTO_URL || 'https://api.zeptomail.com/';
const zeptoToken = process.env.NEXT_PUBLIC_ZEPTO_TOKEN;

const client = new SendMailClient({ url: zeptoUrl, token: zeptoToken });

export async function POST(request) {
  try {
    const { to, type, userName } = await request.json();

    if (!to) {
      return NextResponse.json({ success: false, error: 'Recipient email "to" address required' }, { status: 400 });
    }
    if (!type) {
      return NextResponse.json({ success: false, error: 'Email template type required' }, { status: 400 });
    }

    const template = getEmailTemplate(type, userName || 'Tester');
    if (!template) {
      return NextResponse.json({ success: false, error: 'Invalid email template type' }, { status: 400 });
    }

    const response = await client.sendMail({
      from: { address: 'support@dgtldigicard.com', name: 'DigitalCard Team' },
      to: [{ email_address: { address: to, name: userName || to.split('@')[0] } }],
      subject: template.subject,
      htmlbody: template.html,
    });

    const sent = response.message === 'OK' || (response.data && response.data.some(item => item.code === 'EM_104'));

    return NextResponse.json({ success: sent, response });
  } catch (error) {
    console.error('Test mailer error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
