const { SendMailClient } = require('zeptomail');

// Initialize ZeptoMail client
const zeptoUrl = process.env.NEXT_PUBLIC_ZEPTO_URL || 'https://api.zeptomail.com/';
const zeptoToken = process.env.NEXT_PUBLIC_ZEPTO_TOKEN || 'Zoho-enczapikey wSsVR60jq0P1D65+lGb/Jes/nVRUVAnxRk163QTy6Cf7S6jA/Mc9xUzIUFWjGfYfQ2ZuFjYVo7N7kRZW0jYLi9kkyVBUASiF9mqRe1U4J3x17qnvhDzOX21ekxGNKIMOxg5pnmFjEMkr+g=='

if (!zeptoToken) {
  console.error('Missing ZEPTO_TOKEN! Function will not work.');
}

const client = new SendMailClient({ url: zeptoUrl, token: zeptoToken });

// Send email using ZeptoMail
const sendEmail = async (to, subject, html, userName) => {
  try {
    console.log(`▶️ Sending email to ${to}: ${subject}`);
    
    const response = await client.sendMail({
      from: {
        address: 'lokesh@dgtlmart.in',
        name: 'DigitalCard Team',
      },
      to: [
        {
          email_address: {
            address: to,
            name: userName || to.split('@')[0],
          },
        },
      ],
      subject: subject,
      htmlbody: html,
    });

    console.log('✅ ZeptoMail response:', JSON.stringify(response, null, 2));
    
    if (response.message === 'OK' || (response.data && response.data.some((item) => item.code === 'EM_104'))) {
      console.log(`🎉 Email sent successfully! MessageId: ${response.MessageId}`);
      return true;
    } else {
      console.error('⚠️ Unexpected ZeptoMail response:', response);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, JSON.stringify(error.error || error, null, 2));
    return false;
  }
};

sendEmail('kunaldgtlmart@gmail.com', 'testing', '<p>testing</p>', 'kunal')