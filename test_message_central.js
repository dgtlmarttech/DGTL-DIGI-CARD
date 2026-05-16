require('dotenv').config({ path: '.env' });
const axios = require('axios');

const BASE_URL = 'https://cpaas.messagecentral.com';
const CUSTOMER_ID = process.env.MESSAGE_CENTRAL_CUSTOMER_ID;
const PASSWORD = process.env.MESSAGE_CENTRAL_PASSWORD;

async function testMessageCentral() {
  console.log('Testing Message Central...');
  try {
    const response = await axios.get(`${BASE_URL}/auth/v1/authentication/token`, {
      params: {
        customerId: CUSTOMER_ID,
        key: PASSWORD,
        scope: 'NEW'
      }
    });

    if (response.data && response.data.token) {
      console.log('✅ Auth Token received! Message Central Login is working.');
    } else {
      console.log('❌ Unexpected response:', response.data);
    }
  } catch (error) {
    console.error('❌ Login Error:', error.response?.data || error.message);
  }
}

testMessageCentral();
