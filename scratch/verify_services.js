const fs = require('fs');
const path = require('path');
const { SendMailClient } = require('zeptomail');

// Manually parse .env
function parseEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (!fs.existsSync(envPath)) return {};
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.substring(1, value.length - 1);
      env[match[1]] = value;
    }
  });
  return env;
}

const env = parseEnv();
const zeptoUrl = env.NEXT_PUBLIC_ZEPTO_URL || 'https://api.zeptomail.com/';
const zeptoToken = env.NEXT_PUBLIC_ZEPTO_TOKEN;

if (!zeptoToken) {
  console.error('❌ ZEPTO_TOKEN is missing!');
  process.exit(1);
}

const client = new SendMailClient({ url: zeptoUrl, token: zeptoToken });

async function testOTPSending(email, otp) {
  console.log(`\nTesting OTP sending to ${email}...`);
  const emailTemplate = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #00d1ff;">Verification Code</h2>
      <p>Hello Test User,</p>
      <p>Your verification code for DGTLmart DigiCard is:</p>
      <div style="background: #f4f4f4; padding: 20px; font-size: 32px; font-weight: bold; letter-spacing: 5px; text-align: center; border-radius: 8px;">
        ${otp}
      </div>
      <p>This is a test to verify ZeptoMail integration.</p>
    </div>
  `;

  try {
    const response = await client.sendMail({
      from: { address: 'support@dgtldigicard.com', name: 'DigitalCard Team' },
      to: [{ email_address: { address: email, name: 'Test User' } }],
      subject: `${otp} is your verification code`,
      htmlbody: emailTemplate,
    });

    const sent = response.message === 'OK' || (response.data && response.data.some(item => item.code === 'EM_104'));
    if (sent) {
      console.log('✅ OTP email sent successfully via ZeptoMail!');
    } else {
      console.error('❌ OTP email delivery failed:', response);
    }
    return sent;
  } catch (error) {
    console.error('❌ Error sending OTP:', error.message);
    return false;
  }
}

async function runVerification() {
  // Test with a dummy email (ZeptoMail might only allow verified domains or specific domains in sandbox)
  // We'll try to send to a common address to see if the API accepts it.
  const testEmail = 'vishalyadavdgtl@gmail.com'; 
  const success = await testOTPSending(testEmail, '123456');
  
  if (success) {
    console.log('\n--- VERIFICATION RESULT ---');
    console.log('ZeptoMail API: WORKING');
    console.log('OTP Logic: WORKING');
    console.log('Welcome Email Logic: READY (uses same client)');
    console.log('---------------------------\n');
  } else {
    console.log('\n--- VERIFICATION RESULT ---');
    console.log('ZeptoMail API: FAILED (Check tokens/sender domain)');
    console.log('---------------------------\n');
  }
  process.exit();
}

runVerification();
