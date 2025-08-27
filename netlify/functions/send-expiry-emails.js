// netlify/functions/send-expiry-emails.js

const { schedule } = require('@netlify/functions');
const fetch = require('node-fetch');

const EMAIL_API_URL = 'https://my.dgtldigicard.com/api/mailer';

const handler = async () => {
  try {
    console.log('⏰ Triggering email send API...');

    const response = await fetch(EMAIL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Email API success: ${data.message || JSON.stringify(data)}`);
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, detail: data }),
      };
    } else {
      console.error(`❌ Email API error: ${JSON.stringify(data)}`);
      return {
        statusCode: response.status,
        body: JSON.stringify({ success: false, error: data }),
      };
    }
  } catch (error) {
    console.error('❌ Netlify email trigger error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};

exports.handler = schedule('0 0 * * *', handler); 
