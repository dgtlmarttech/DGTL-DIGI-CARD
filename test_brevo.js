require('dotenv').config({ path: '.env' });

async function testBrevo() {
  const key = process.env.NEXT_PUBLIC_BREVO_API_KEY?.trim();
  
  if (!key) {
    console.log("❌ No key found in NEXT_PUBLIC_BREVO_API_KEY");
    return;
  }

  console.log(`Testing key: ${key.substring(0, 15)}...`);

  try {
    // Test 1: Can we get account details? (Validates if key is real)
    const accRes = await fetch('https://api.brevo.com/v3/account', {
      headers: { 'api-key': key }
    });
    
    const accData = await accRes.json();
    console.log("Account Check:", accRes.ok ? "✅ SUCCESS" : "❌ FAILED");
    console.log("Account Response:", accData);

    // Test 2: Can we send an email?
    const emailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': key
      },
      body: JSON.stringify({
        sender: { name: 'DigitalCard Team', email: 'support@dgtldigicard.com' },
        to: [{ email: 'raaja616@gmail.com', name: 'Test' }],
        subject: "Brevo Test",
        htmlContent: "<html>Test Email</html>"
      })
    });

    const emailData = await emailRes.json();
    console.log("Email Send Check:", emailRes.ok ? "✅ SUCCESS" : "❌ FAILED");
    console.log("Email Response:", emailData);

  } catch (err) {
    console.log(`❌ Network Error:`, err.message);
  }
}

testBrevo();
