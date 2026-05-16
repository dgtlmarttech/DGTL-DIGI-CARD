require('dotenv').config({ path: '.env' });
const { SendMailClient } = require('zeptomail');

const zeptoUrl = process.env.NEXT_PUBLIC_ZEPTO_URL || 'https://api.zeptomail.com/';
const zeptoToken = process.env.NEXT_PUBLIC_ZEPTO_TOKEN;

const client = new SendMailClient({ url: zeptoUrl, token: zeptoToken });

async function testMail() {
  try {
    const response = await client.sendMail({
      from: { address: 'support@dgtldigicard.com', name: 'DigitalCard Team' },
      to: [{ email_address: { address: 'raaja616@gmail.com', name: 'Test User' } }],
      subject: `TEST is your verification code`,
      htmlbody: '<div>TEST</div>',
    });
    console.log('Success:', response);
  } catch (error) {
    console.error("❌ Failed. Full Error:", JSON.stringify(error, null, 2));
    if (error.error) console.error("Error Object:", error.error);
  }
}

testMail();
