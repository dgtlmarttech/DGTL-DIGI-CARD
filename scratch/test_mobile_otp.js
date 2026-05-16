const axios = require('axios');
const fs = require('fs');
const path = require('path');

function parseEnv() {
  const envPath = path.resolve(__dirname, '../.env');
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
const CUSTOMER_ID = env.MESSAGE_CENTRAL_CUSTOMER_ID;
const PASSWORD = env.MESSAGE_CENTRAL_PASSWORD;

async function testMobileAuth() {
  console.log('Testing Message Central Authentication...');
  try {
    const response = await axios.get('https://cpaas.messagecentral.com/auth/v1/authentication/token', {
      params: {
        customerId: CUSTOMER_ID,
        key: PASSWORD,
        scope: 'NEW'
      }
    });

    if (response.data && response.data.token) {
      console.log('✅ Message Central Auth Token obtained successfully!');
      return response.data.token;
    } else {
      console.error('❌ Failed to get token:', response.data);
    }
  } catch (error) {
    console.error('❌ Message Central Auth Error:', error.response?.data || error.message);
  }
}

async function testMobileOTPSend(token) {
    if (!token) return;
    console.log('\nTesting OTP Send (to dummy number 919999999999)...');
    try {
        const url = 'https://cpaas.messagecentral.com/verification/v3/send';
        const params = new URLSearchParams({
            countryCode: '91',
            customerId: CUSTOMER_ID,
            flowType: 'SMS',
            mobileNumber: '9999999999',
            otpLength: '6',
        });

        const response = await axios.post(`${url}?${params.toString()}`, {}, {
            headers: {
                'authToken': token,
            }
        });

        console.log('✅ Message Central API Response:', response.data);
    } catch (error) {
        // If it's a dummy number, it might fail, but we care if the API handles the request.
        console.error('❌ Message Central Send Error (Expected if number is invalid):', error.response?.data || error.message);
    }
}

async function run() {
    const token = await testMobileAuth();
    await testMobileOTPSend(token);
    process.exit();
}

run();
